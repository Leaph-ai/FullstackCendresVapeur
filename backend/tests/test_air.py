from datetime import UTC, datetime

from app.air.constants import GAUGE_CONFIGS, SULFUR_ID
from app.air.schemas import AirSnapshot, GaugeReading
from app.config import get_settings


def test_gauge_configs_cover_four_pollutants():
    ids = [g.id for g in GAUGE_CONFIGS]
    assert ids == ["soufre", "monoxyde", "particules", "pression"]
    assert SULFUR_ID == "soufre"
    soufre = next(g for g in GAUGE_CONFIGS if g.id == SULFUR_ID)
    assert soufre.unit == "ppm"
    assert soufre.danger == 70


def test_air_settings_defaults():
    settings = get_settings()
    assert settings.air_tick_seconds == 2.6
    assert settings.air_sulfur_threshold == 70.0
    assert settings.air_sulfur_threshold_low == 60.0
    assert settings.air_spark_length == 16
    assert 0.0 < settings.air_sulfur_spike_chance < 1.0


def test_air_snapshot_serializes():
    snap = AirSnapshot(
        gauges=[GaugeReading(id="soufre", label="Soufre", value=34, unit="ppm", warn=False, danger=False)],
        sulfur_spark=[34.0, 36.0],
        sulfur_level=34.0,
        alert_red=False,
        threshold=70.0,
        timestamp=datetime.now(UTC),
    )
    payload = snap.model_dump(mode="json")
    assert payload["alert_red"] is False
    assert payload["threshold"] == 70.0
    assert payload["gauges"][0]["id"] == "soufre"
    assert len(payload["sulfur_spark"]) == 2


from app.air.monitor import AirMonitor


def test_tick_keeps_values_within_bounds():
    sim = AirMonitor(spark_length=16, volatility=6.0)
    for _ in range(100):
        snap, _ = sim.tick()
        assert len(snap.gauges) == 4
        assert len(snap.sulfur_spark) == 16
        for g in snap.gauges:
            assert 4 <= g.value <= 96


def test_hysteresis_activates_above_high_threshold():
    sim = AirMonitor(threshold_high=70.0, threshold_low=60.0)
    assert sim._apply_hysteresis(75.0) is True   # front montant
    snap = sim.snapshot()
    assert snap.alert_red is True


def test_hysteresis_holds_between_thresholds():
    sim = AirMonitor(threshold_high=70.0, threshold_low=60.0)
    sim._apply_hysteresis(75.0)                   # activée
    assert sim._apply_hysteresis(65.0) is False   # reste active, pas de nouveau front
    assert sim.snapshot().alert_red is True


def test_hysteresis_releases_below_low_threshold():
    sim = AirMonitor(threshold_high=70.0, threshold_low=60.0)
    sim._apply_hysteresis(75.0)
    assert sim._apply_hysteresis(55.0) is False   # levée (pas un front montant)
    assert sim.snapshot().alert_red is False


def test_rising_edge_fires_only_once_while_active():
    sim = AirMonitor(threshold_high=70.0, threshold_low=60.0)
    assert sim._apply_hysteresis(80.0) is True
    assert sim._apply_hysteresis(85.0) is False   # déjà en alerte → pas de re-front


def test_snapshot_exposes_threshold_high():
    sim = AirMonitor(threshold_high=70.0)
    assert sim.snapshot().threshold == 70.0


import asyncio

import pytest

from app.air.hub import hub as air_hub
from app.air.monitor import monitor as air_monitor


@pytest.mark.anyio
async def test_hub_broadcasts_tick_to_subscriber():
    queue = air_hub.subscribe()
    try:
        snapshot, _ = air_monitor.tick()
        air_hub.publish(snapshot)
        received = await asyncio.wait_for(queue.get(), timeout=1)
        assert received.sulfur_level == snapshot.sulfur_level
        assert received.sulfur_spark == snapshot.sulfur_spark
    finally:
        air_hub.unsubscribe(queue)
        air_monitor.reset()
        air_hub.reset()


from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import models  # noqa: F401 — enregistre les modèles sur Base.metadata
from app.air.ticker import persist_alert
from app.core.database import Base
from models.air_quality import AirQuality


def _memory_session_factory():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, autoflush=False, autocommit=False)


def test_persist_alert_writes_single_row():
    factory = _memory_session_factory()
    sim = AirMonitor(threshold_high=70.0)
    sim._apply_hysteresis(80.0)
    snapshot = sim.snapshot()

    persist_alert(snapshot, session_factory=factory)

    session = factory()
    try:
        rows = session.query(AirQuality).all()
        assert len(rows) == 1
        assert rows[0].alert_red is True
        assert float(rows[0].sulfur_level) == snapshot.sulfur_level
    finally:
        session.close()


import json

from fastapi.testclient import TestClient

from app.main import app
from app.routes.air import _sse_event


def test_air_sse_event_format():
    sim = AirMonitor()
    event = _sse_event(sim.snapshot())
    assert event.startswith("data: ")
    assert event.endswith("\n\n")
    payload = json.loads(event.removeprefix("data: ").strip())
    assert "sulfur_level" in payload
    assert len(payload["gauges"]) == 4


def test_air_current_returns_snapshot():
    with TestClient(app) as client:
        response = client.get("/air/current")
    assert response.status_code == 200
    data = response.json()
    assert len(data["gauges"]) == 4
    assert len(data["sulfur_spark"]) == 16
    assert "alert_red" in data
    assert data["threshold"] == 70.0


def test_air_routes_registered():
    with TestClient(app) as client:
        paths = client.get("/openapi.json").json()["paths"]
    assert "/air/current" in paths
    assert "/air/stream" in paths
