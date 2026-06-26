from unittest.mock import patch

from app.config import Settings
from app.contact.service import ContactService
from app.main import app
from app.routes.contact import get_contact_service
from models.contact_message import ContactMessage

CONTACT_PAYLOAD = {
    "name": "Citoyen Test",
    "email": "citoyen@example.com",
    "subject": "Demande de renseignements",
    "message": "Bonjour, je souhaite rejoindre la guilde.",
}


def _override_contact_service(db_session, admin_email: str = "admin@example.com"):
    settings = Settings(contact_admin_email=admin_email)

    def _factory() -> ContactService:
        return ContactService(db_session, settings)

    app.dependency_overrides[get_contact_service] = _factory


@patch("app.contact.service.send_email")
def test_post_contact_creates_message_in_db(mock_send_email, client, db_session):
    _override_contact_service(db_session)
    try:
        resp = client.post("/contact", json=CONTACT_PAYLOAD)
    finally:
        app.dependency_overrides.pop(get_contact_service, None)

    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == CONTACT_PAYLOAD["name"]
    assert body["email"] == CONTACT_PAYLOAD["email"]
    assert body["subject"] == CONTACT_PAYLOAD["subject"]
    assert body["message"] == CONTACT_PAYLOAD["message"]
    assert body["id"] > 0
    assert "created_at" in body

    stored = db_session.get(ContactMessage, body["id"])
    assert stored is not None
    assert stored.email == CONTACT_PAYLOAD["email"]


def test_post_contact_rejects_invalid_email(client):
    resp = client.post(
        "/contact",
        json={
            "name": "Citoyen Test",
            "email": "pas-un-email",
            "subject": "Sujet",
            "message": "Message",
        },
    )

    assert resp.status_code == 422


def test_post_contact_rejects_empty_message(client):
    resp = client.post(
        "/contact",
        json={
            "name": "Citoyen Test",
            "email": "citoyen@example.com",
            "subject": "Sujet",
            "message": "",
        },
    )

    assert resp.status_code == 422


@patch("app.contact.service.send_email")
def test_post_contact_sends_admin_and_user_emails(mock_send_email, client, db_session):
    _override_contact_service(db_session)
    try:
        resp = client.post("/contact", json=CONTACT_PAYLOAD)
    finally:
        app.dependency_overrides.pop(get_contact_service, None)

    assert resp.status_code == 201
    assert mock_send_email.call_count == 2

    recipients = {call.kwargs["to"] for call in mock_send_email.call_args_list}
    assert recipients == {"admin@example.com", "citoyen@example.com"}

    admin_call = next(
        call for call in mock_send_email.call_args_list if call.kwargs["to"] == "admin@example.com"
    )
    user_call = next(
        call for call in mock_send_email.call_args_list if call.kwargs["to"] == "citoyen@example.com"
    )

    assert "Nouveau message de contact" in admin_call.kwargs["subject"]
    assert CONTACT_PAYLOAD["message"] in admin_call.kwargs["body"]
    assert "Votre message a bien été reçu" in user_call.kwargs["subject"]
    assert CONTACT_PAYLOAD["subject"] in user_call.kwargs["body"]


@patch("app.contact.service.send_email")
def test_post_contact_skips_admin_email_when_not_configured(mock_send_email, client, db_session):
    _override_contact_service(db_session, admin_email="")
    try:
        resp = client.post("/contact", json=CONTACT_PAYLOAD)
    finally:
        app.dependency_overrides.pop(get_contact_service, None)

    assert resp.status_code == 201
    mock_send_email.assert_called_once()
    assert mock_send_email.call_args.kwargs["to"] == "citoyen@example.com"


@patch("app.contact.service.send_email", side_effect=RuntimeError("SMTP indisponible"))
def test_post_contact_succeeds_when_emails_fail(_mock_send_email, client, db_session):
    _override_contact_service(db_session)
    try:
        resp = client.post("/contact", json=CONTACT_PAYLOAD)
    finally:
        app.dependency_overrides.pop(get_contact_service, None)

    assert resp.status_code == 201
    assert resp.json()["email"] == CONTACT_PAYLOAD["email"]
