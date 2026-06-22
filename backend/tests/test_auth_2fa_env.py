from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.auth.dependencies import get_auth_service
from app.config import Settings, get_settings
from app.main import app


@pytest.fixture(autouse=True)
def clear_settings_cache():
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()
    app.dependency_overrides.clear()


@pytest.fixture
def auth_client():
    return TestClient(app)


def _override_settings(app_env: str):
    settings = Settings(app_env=app_env)

    def _get_auth_service():
        from app.auth.service import AuthService

        return AuthService(settings)

    app.dependency_overrides[get_settings] = lambda: settings
    app.dependency_overrides[get_auth_service] = _get_auth_service


def test_login_dev_skips_2fa(auth_client):
    _override_settings("dev")

    response = auth_client.post(
        "/auth/login",
        json={"email": "admin@example.com", "password": "Admin123!"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["requires_2fa"] is False
    assert data["access_token"]
    assert data["challenge_token"] is None


@patch("app.auth.service.send_email")
def test_login_prod_requires_2fa(mock_send_email, auth_client):
    _override_settings("prod")

    response = auth_client.post(
        "/auth/login",
        json={"email": "admin@example.com", "password": "Admin123!"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["requires_2fa"] is True
    assert data["challenge_token"]
    assert data["access_token"] is None
    mock_send_email.assert_called_once()


@patch("app.auth.service.send_email")
def test_verify_2fa_prod_flow(mock_send_email, auth_client):
    _override_settings("prod")

    login_response = auth_client.post(
        "/auth/login",
        json={"email": "admin@example.com", "password": "Admin123!"},
    )
    challenge_token = login_response.json()["challenge_token"]
    sent_code = mock_send_email.call_args.kwargs["body"].split(": ")[1].split("\n")[0]

    verify_response = auth_client.post(
        "/auth/verify-2fa",
        json={"challenge_token": challenge_token, "code": sent_code},
    )

    assert verify_response.status_code == 200
    assert verify_response.json()["access_token"]


def test_verify_2fa_rejected_in_dev(auth_client):
    _override_settings("dev")

    response = auth_client.post(
        "/auth/verify-2fa",
        json={"challenge_token": "invalid", "code": "123456"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "La double authentification est désactivée."
