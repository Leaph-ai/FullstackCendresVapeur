def test_bad_token_returns_token_expired_code(client):
    resp = client.get("/carts/1", headers={"Authorization": "Bearer not-a-real-jwt"})
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "TOKEN_EXPIRED"
