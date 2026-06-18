from models.product_vote import ProductVote


def test_listing_includes_likes_count_zero(factory, client):
    factory.product()
    resp = client.get("/products/")
    assert resp.status_code == 200
    assert resp.json()[0]["likes_count"] == 0


def test_default_order_is_by_id(factory, client):
    cat = factory.category()
    p1 = factory.product(category=cat, name="A")
    p2 = factory.product(category=cat, name="B")
    ids = [p["id"] for p in client.get("/products/").json()]
    assert ids == [p1.id, p2.id]


def test_sort_likes_orders_by_count_desc(factory, db_session, client):
    cat = factory.category()
    p1 = factory.product(category=cat, name="A")
    p2 = factory.product(category=cat, name="B")
    db_session.add_all([
        ProductVote(user_id=1, product_id=p1.id),
        ProductVote(user_id=1, product_id=p2.id),
        ProductVote(user_id=2, product_id=p2.id),
    ])
    db_session.commit()
    ids = [p["id"] for p in client.get("/products/?sort=likes").json()]
    assert ids == [p2.id, p1.id]
    counts = {p["id"]: p["likes_count"] for p in client.get("/products/?sort=likes").json()}
    assert counts == {p2.id: 2, p1.id: 1}
