from unittest.mock import patch

import pytest
from app.config import Settings, get_settings
from app.main import app


@pytest.fixture(autouse=True)
def dev_settings():
    app.dependency_overrides[get_settings] = lambda: Settings(app_env="dev")
    yield
    app.dependency_overrides.pop(get_settings, None)


@patch("app.auth.service.send_email")
def test_forgot_password_sends_code_for_existing_user(mock_send_email, client):
    client.post(
        "/auth/register",
        json={"email": "reset@example.com", "password": "secret1234"},
    )

    response = client.post(
        "/auth/forgot-password",
        json={"email": "reset@example.com"},
    )

    assert response.status_code == 200
    assert "code de récupération" in response.json()["message"].lower()
    mock_send_email.assert_called_once()


@patch("app.auth.service.send_email")
def test_forgot_password_unknown_email_same_response(mock_send_email, client):
    response = client.post(
        "/auth/forgot-password",
        json={"email": "inconnu@example.com"},
    )

    assert response.status_code == 200
    assert "code de récupération" in response.json()["message"].lower()
    mock_send_email.assert_not_called()


@patch("app.auth.service.send_email")
def test_reset_password_flow(mock_send_email, client):
    client.post(
        "/auth/register",
        json={"email": "reset-flow@example.com", "password": "ancien1234"},
    )

    forgot = client.post("/auth/forgot-password", json={"email": "reset-flow@example.com"})
    assert forgot.status_code == 200

    sent_code = mock_send_email.call_args.kwargs["body"].split(": ")[1].split("\n")[0]

    reset = client.post(
        "/auth/reset-password",
        json={
            "email": "reset-flow@example.com",
            "code": sent_code,
            "new_password": "NouveauMotDePasse1",
        },
    )
    assert reset.status_code == 200
    assert "réinitialisé" in reset.json()["message"].lower()

    login = client.post(
        "/auth/login",
        json={"email": "reset-flow@example.com", "password": "NouveauMotDePasse1"},
    )
    assert login.status_code == 200
    assert login.json()["access_token"]


def test_reset_password_invalid_code(client):
    client.post(
        "/auth/register",
        json={"email": "reset-invalid@example.com", "password": "secret1234"},
    )

    response = client.post(
        "/auth/reset-password",
        json={
            "email": "reset-invalid@example.com",
            "code": "000000",
            "new_password": "NouveauMotDePasse1",
        },
    )

    assert response.status_code == 401
