from models.contact_message import ContactMessage


def test_post_contact_creates_message_in_db(client, db_session):
    payload = {
        "name": "Citoyen Test",
        "email": "citoyen@example.com",
        "subject": "Demande de renseignements",
        "message": "Bonjour, je souhaite rejoindre la guilde.",
    }

    resp = client.post("/contact", json=payload)

    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == payload["name"]
    assert body["email"] == payload["email"]
    assert body["subject"] == payload["subject"]
    assert body["message"] == payload["message"]
    assert body["id"] > 0
    assert "created_at" in body

    stored = db_session.get(ContactMessage, body["id"])
    assert stored is not None
    assert stored.email == payload["email"]


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
