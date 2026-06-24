def test_list_categories_empty(client):
    resp = client.get("/categories/")
    assert resp.status_code == 200
    assert resp.json() == []


def test_list_categories_with_product_counts(factory, client):
    cat_a = factory.category(name="Mécanismes")
    cat_b = factory.category(name="Alambics")
    factory.category(name="Reliques")
    factory.product(category=cat_a, name="Engrenage")
    factory.product(category=cat_a, name="Roue")
    factory.product(category=cat_b, name="Alambic")

    resp = client.get("/categories/")
    assert resp.status_code == 200
    by_name = {c["name"]: c for c in resp.json()}

    assert by_name["Mécanismes"]["product_count"] == 2
    assert by_name["Alambics"]["product_count"] == 1
    assert by_name["Reliques"]["product_count"] == 0


def test_categories_sorted_by_name(factory, client):
    factory.category(name="Reliques")
    factory.category(name="Alambics")
    factory.category(name="Mécanismes")

    names = [c["name"] for c in client.get("/categories/").json()]
    assert names == sorted(names)
