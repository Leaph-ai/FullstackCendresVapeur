def test_like_returns_201_with_status(factory, as_user):
    user = factory.user()
    product = factory.product()
    resp = as_user(user_id=user.id).post(f"/products/{product.id}/vote")
    assert resp.status_code == 201
    assert resp.json() == {
        "product_id": product.id,
        "likes_count": 1,
        "liked": True,
    }


def test_like_is_idempotent(factory, as_user):
    user = factory.user()
    product = factory.product()
    c = as_user(user_id=user.id)
    c.post(f"/products/{product.id}/vote")
    resp = c.post(f"/products/{product.id}/vote")
    assert resp.status_code == 201
    assert resp.json()["likes_count"] == 1


def test_unlike_returns_204_and_decrements(factory, as_user, client):
    user = factory.user()
    product = factory.product()
    c = as_user(user_id=user.id)
    c.post(f"/products/{product.id}/vote")
    resp = c.delete(f"/products/{product.id}/vote")
    assert resp.status_code == 204
    listing = client.get("/products/").json()
    assert listing[0]["likes_count"] == 0


def test_unlike_without_prior_like_is_204(factory, as_user):
    user = factory.user()
    product = factory.product()
    resp = as_user(user_id=user.id).delete(f"/products/{product.id}/vote")
    assert resp.status_code == 204


def test_like_nonexistent_product_returns_404(factory, as_user):
    user = factory.user()
    resp = as_user(user_id=user.id).post("/products/9999/vote")
    assert resp.status_code == 404


def test_delete_nonexistent_product_returns_204(factory, as_user):
    user = factory.user()
    resp = as_user(user_id=user.id).delete("/products/9999/vote")
    assert resp.status_code == 204


def test_like_requires_authentication(factory, client):
    product = factory.product()
    resp = client.post(f"/products/{product.id}/vote")
    assert resp.status_code == 401
