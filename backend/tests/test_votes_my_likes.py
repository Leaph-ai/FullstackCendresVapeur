def test_my_votes_lists_only_liked_products(factory, as_user):
    user = factory.user()
    cat = factory.category()
    p1 = factory.product(category=cat, name="A")
    p2 = factory.product(category=cat, name="B")
    c = as_user(user_id=user.id)
    c.post(f"/products/{p1.id}/vote")
    resp = c.get("/me/votes")
    assert resp.status_code == 200
    ids = [p["id"] for p in resp.json()]
    assert ids == [p1.id]
    assert p2.id not in ids


def test_my_votes_includes_likes_count(factory, as_user):
    user = factory.user()
    product = factory.product()
    c = as_user(user_id=user.id)
    c.post(f"/products/{product.id}/vote")
    body = c.get("/me/votes").json()
    assert body[0]["likes_count"] == 1


def test_my_votes_ordered_by_recency(factory, as_user):
    user = factory.user()
    cat = factory.category()
    p1 = factory.product(category=cat, name="A")
    p2 = factory.product(category=cat, name="B")
    c = as_user(user_id=user.id)
    c.post(f"/products/{p1.id}/vote")
    c.post(f"/products/{p2.id}/vote")
    ids = [p["id"] for p in c.get("/me/votes").json()]
    assert ids == [p2.id, p1.id]


def test_my_votes_requires_authentication(client):
    resp = client.get("/me/votes")
    assert resp.status_code == 401
