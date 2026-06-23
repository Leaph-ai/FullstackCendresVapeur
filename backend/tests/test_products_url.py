def test_listing_includes_product_url(factory, client):
    product = factory.product(url="https://example.com/engrenage.jpg")
    factory.product()

    resp = client.get("/products/")

    assert resp.status_code == 200
    assert resp.json()[0]["url"] == product.url


def test_create_product_accepts_url(factory, as_user):
    category = factory.category()
    editor = as_user(role_level=2)

    resp = editor.post(
        "/products/",
        json={
            "category_id": category.id,
            "name": "Lentille test",
            "description": "Image incluse",
            "url": "https://example.com/lentille.jpg",
            "stock": 4,
            "price": "21.50",
        },
    )

    assert resp.status_code == 201
    assert resp.json()["url"] == "https://example.com/lentille.jpg"


def test_update_product_accepts_url(factory, as_user):
    product = factory.product()
    editor = as_user(role_level=2)

    resp = editor.put(
        f"/products/{product.id}",
        json={"url": "https://example.com/engrenage-maj.jpg"},
    )

    assert resp.status_code == 200
    assert resp.json()["url"] == "https://example.com/engrenage-maj.jpg"
