ADMIN = 3
USER = 1


def test_admin_can_create_log(as_user):
    resp = as_user(role_level=ADMIN, user_id=5).post(
        "/logs/", json={"action": "événement: Citoyen #42 n'a pas réglé sa commande"}
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["action"] == "événement: Citoyen #42 n'a pas réglé sa commande"
    assert body["user_id"] == 5


def test_admin_can_update_log(as_user):
    c = as_user(role_level=ADMIN, user_id=5)
    created = c.post("/logs/", json={"action": "événement: brouillon"}).json()
    resp = c.patch(f"/logs/{created['id']}", json={"action": "événement: corrigé"})
    assert resp.status_code == 200
    assert resp.json()["action"] == "événement: corrigé"


def test_admin_can_delete_log(as_user):
    c = as_user(role_level=ADMIN, user_id=5)
    created = c.post("/logs/", json={"action": "événement: jetable"}).json()
    resp = c.delete(f"/logs/{created['id']}")
    assert resp.status_code == 204


def test_update_missing_log_returns_404(as_user):
    resp = as_user(role_level=ADMIN, user_id=5).patch("/logs/9999", json={"action": "x"})
    assert resp.status_code == 404


def test_non_admin_cannot_create_log(as_user):
    resp = as_user(role_level=USER, user_id=2).post("/logs/", json={"action": "événement: x"})
    assert resp.status_code == 403


def test_feed_is_public(client):
    resp = client.get("/logs/feed")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
