import asyncio
import json

import pytest
from fastapi.testclient import TestClient

from app.copper.hub import hub
from app.copper.market import CopperMarket, market
from app.main import app
from app.routes.copper import _sse_event


@pytest.fixture(autouse=True)
def reset_copper_state():
    market.reset()
    hub.reset()
    yield
    market.reset()
    hub.reset()


@pytest.fixture
def copper_client():
    with TestClient(app) as client:
        yield client


def test_market_tick_stays_within_bounds():
    sim = CopperMarket(min_index=180.0, max_index=320.0, volatility=6.0)
    for _ in range(50):
        snapshot = sim.tick()
        assert 180.0 <= snapshot.index <= 320.0
        assert len(snapshot.spark) == 14
        assert snapshot.trend in {"up", "down", "flat"}


def test_sse_event_format():
    snapshot = market.snapshot()
    event = _sse_event(snapshot)

    assert event.startswith("data: ")
    assert event.endswith("\n\n")
    payload = json.loads(event.removeprefix("data: ").strip())
    assert payload["index"] == 248.0
    assert len(payload["spark"]) == 14


def test_copper_current_returns_snapshot(copper_client):
    response = copper_client.get("/copper/current")

    assert response.status_code == 200
    data = response.json()
    assert data["index"] == 248.0
    assert data["delta"] == 0.0
    assert data["trend"] == "flat"
    assert len(data["spark"]) == 14
    assert "timestamp" in data


def test_copper_stream_route_is_registered(copper_client):
    response = copper_client.get("/openapi.json")
    assert response.status_code == 200
    paths = response.json()["paths"]
    assert "/copper/stream" in paths
    assert "/copper/current" in paths


@pytest.mark.anyio
async def test_hub_broadcasts_tick_to_subscriber():
    queue = hub.subscribe()
    try:
        snapshot = market.tick()
        hub.publish(snapshot)
        received = await asyncio.wait_for(queue.get(), timeout=1)
        assert received.index == snapshot.index
        assert received.spark == snapshot.spark
    finally:
        hub.unsubscribe(queue)
