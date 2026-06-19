from __future__ import annotations

import secrets
from collections.abc import Generator
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from api_tester.client import ApiClient
from app.main import app

_captured_2fa_codes: list[str] = []


def _fake_send_email(_settings, *, to: str, subject: str, body: str) -> None:
    for line in body.splitlines():
        if ":" in line:
            candidate = line.split(":", 1)[1].strip()
            if candidate.isdigit() and len(candidate) == 6:
                _captured_2fa_codes.append(candidate)
                return
    code = f"{secrets.randbelow(1_000_000):06d}"
    _captured_2fa_codes.append(code)


@pytest.fixture
def api_implemented(api_client: ApiClient) -> bool:
    """True quand les routes protégées exigent un JWT (pas des stubs `pass`)."""
    from api_tester.catalog import get_endpoint

    response = api_client.call_unauthenticated(get_endpoint("carts.get"))
    return response.status_code in (401, 403)


@pytest.fixture
def test_client() -> Generator[TestClient]:
    with TestClient(app) as client:
        yield client


@pytest.fixture
def api_client(test_client: TestClient) -> ApiClient:
    return ApiClient(app=app)


@pytest.fixture
def mock_email() -> Generator[list[str]]:
    _captured_2fa_codes.clear()
    with patch("app.auth.service.send_email", side_effect=_fake_send_email):
        yield _captured_2fa_codes


@pytest.fixture
def unique_email() -> str:
    return f"api_tester_{secrets.token_hex(4)}@example.com"
