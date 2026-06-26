from models.product import Product


def test_root_endpoint(client):
    resp = client.get("/")
    assert resp.status_code == 200


def test_factory_inserts_product(factory, db_session):
    product = factory.product()
    assert product.id is not None
    assert db_session.query(Product).count() == 1
