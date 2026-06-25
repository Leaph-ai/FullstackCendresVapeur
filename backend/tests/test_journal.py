def test_journal_empty(client):
    resp = client.get("/journal/")
    assert resp.status_code == 200
    assert resp.json() == []


def test_journal_returns_most_recent_first(factory, client):
    factory.colony_log(action="Connexion accréditée — alpha")
    factory.colony_log(action="Connexion accréditée — beta")
    last = factory.colony_log(action="Connexion accréditée — gamma")

    body = client.get("/journal/").json()
    assert body[0]["id"] == last.id
    assert len(body) == 3


def test_journal_limit(factory, client):
    for i in range(5):
        factory.colony_log(action=f"Connexion accréditée — n{i}")

    body = client.get("/journal/?limit=2").json()
    assert len(body) == 2


def test_journal_classifies_entry_types(factory, client):
    factory.colony_log(action="Tentative d'accès refusée")
    factory.colony_log(action="Troc validé — bordereau CV-2026-00012")
    factory.colony_log(action="Maintenance chaudière 3 — pression rétablie")
    factory.colony_log(action="Pression populaire — Lanterne d'éther au classement")
    factory.colony_log(action="Connexion accréditée — citoyen")

    by_action = {e["action"]: e["type"] for e in client.get("/journal/").json()}
    assert by_action["Tentative d'accès refusée"] == "alert"
    assert by_action["Troc validé — bordereau CV-2026-00012"] == "troc"
    assert by_action["Maintenance chaudière 3 — pression rétablie"] == "chaudiere"
    assert by_action["Pression populaire — Lanterne d'éther au classement"] == "vote"
    assert by_action["Connexion accréditée — citoyen"] == "acces"
