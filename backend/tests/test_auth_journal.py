def test_register_records_journal_entry(client):
    resp = client.post(
        "/auth/register",
        json={"email": "survivant@example.com", "password": "VapeurSecret123"},
    )
    assert resp.status_code == 201

    actions = [e["action"] for e in client.get("/journal/").json()]
    assert any("Nouvel arrivant" in a for a in actions)


def test_login_records_access_entry(client):
    client.post(
        "/auth/register",
        json={"email": "pilote@example.com", "password": "VapeurSecret123"},
    )
    resp = client.post(
        "/auth/login",
        json={"email": "pilote@example.com", "password": "VapeurSecret123"},
    )
    assert resp.status_code == 200

    entries = client.get("/journal/").json()
    access = [e for e in entries if "Connexion accréditée" in e["action"]]
    assert access and access[0]["type"] == "acces"


def test_failed_login_records_alert(client):
    client.post(
        "/auth/register",
        json={"email": "garde@example.com", "password": "VapeurSecret123"},
    )
    resp = client.post(
        "/auth/login",
        json={"email": "garde@example.com", "password": "mauvaisecle"},
    )
    assert resp.status_code == 401

    assert any(e["type"] == "alert" for e in client.get("/journal/").json())
