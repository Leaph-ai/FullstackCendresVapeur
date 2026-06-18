def test_delete_product_returns_204(factory, as_user):
    product = factory.product()
    editor = as_user(role_level=2)
    resp = editor.delete(f"/products/{product.id}")
    assert resp.status_code == 204
