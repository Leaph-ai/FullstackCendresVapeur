# Route paths verified from:
#   app/routes/products.py  → prefix="/products", /{product_id}
#   app/routes/carts.py     → prefix="/carts",    /{user_id}  (requires auth)


def test_unknown_product_returns_enveloped_404(client, as_user):
    api = as_user(role_level=1)
    resp = api.get("/products/999999")
    assert resp.status_code == 404
    err = resp.json()["error"]
    assert err["status"] == 404
    assert err["code"] == "NOT_FOUND"
    assert isinstance(err["message"], str) and err["message"]


def test_protected_endpoint_without_token_returns_enveloped_401(client):
    resp = client.get("/carts/1")
    assert resp.status_code == 401
    err = resp.json()["error"]
    assert err["code"] == "UNAUTHORIZED"
    assert err["status"] == 401


def test_no_bare_detail_key_at_top_level(client, as_user):
    api = as_user(role_level=1)
    resp = api.get("/products/999999")
    assert "detail" not in resp.json()
    assert "error" in resp.json()
