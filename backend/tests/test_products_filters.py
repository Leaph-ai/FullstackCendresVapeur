def test_filter_by_category(factory, client):
    cat_a = factory.category(name="Mécanismes")
    cat_b = factory.category(name="Alambics")
    p1 = factory.product(category=cat_a, name="Engrenage")
    factory.product(category=cat_b, name="Alambic")

    resp = client.get(f"/products/?category_id={cat_a.id}")
    assert resp.status_code == 200
    body = resp.json()
    assert [p["id"] for p in body] == [p1.id]
    assert body[0]["category"]["name"] == "Mécanismes"


def test_search_matches_name(factory, client):
    cat = factory.category()
    p1 = factory.product(category=cat, name="Lanterne d'éther")
    factory.product(category=cat, name="Engrenage en laiton")

    resp = client.get("/products/?search=lanterne")
    assert resp.status_code == 200
    assert [p["id"] for p in resp.json()] == [p1.id]


def test_search_no_match_returns_empty(factory, client):
    factory.product(name="Engrenage")
    resp = client.get("/products/?search=inexistant")
    assert resp.status_code == 200
    assert resp.json() == []


def test_sort_by_price_asc(factory, client):
    cat = factory.category()
    cheap = factory.product(category=cat, name="Fiole", price="6.50")
    mid = factory.product(category=cat, name="Clé", price="27.90")
    pricey = factory.product(category=cat, name="Montre", price="250.00")

    ids = [p["id"] for p in client.get("/products/?sort=price&order=asc").json()]
    assert ids == [cheap.id, mid.id, pricey.id]


def test_sort_by_price_desc(factory, client):
    cat = factory.category()
    cheap = factory.product(category=cat, name="Fiole", price="6.50")
    pricey = factory.product(category=cat, name="Montre", price="250.00")

    ids = [p["id"] for p in client.get("/products/?sort=price&order=desc").json()]
    assert ids == [pricey.id, cheap.id]


def test_sort_new_desc_returns_latest_first(factory, client):
    cat = factory.category()
    first = factory.product(category=cat, name="A")
    second = factory.product(category=cat, name="B")

    ids = [p["id"] for p in client.get("/products/?sort=new&order=desc").json()]
    assert ids == [second.id, first.id]


def test_limit_caps_results(factory, client):
    cat = factory.category()
    for i in range(5):
        factory.product(category=cat, name=f"P{i}")

    resp = client.get("/products/?limit=3")
    assert resp.status_code == 200
    assert len(resp.json()) == 3


def test_category_filter_and_search_combine(factory, client):
    cat_a = factory.category(name="Mécanismes")
    cat_b = factory.category(name="Alambics")
    target = factory.product(category=cat_a, name="Roue dentée")
    factory.product(category=cat_a, name="Clé à molette")
    factory.product(category=cat_b, name="Roue de secours")

    resp = client.get(f"/products/?category_id={cat_a.id}&search=roue")
    assert resp.status_code == 200
    assert [p["id"] for p in resp.json()] == [target.id]
