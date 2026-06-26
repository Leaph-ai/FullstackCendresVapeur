from models.cart import Cart
from models.cart_item import CartItem


def test_delete_product_returns_204(factory, as_user):
    product = factory.product()
    editor = as_user(role_level=2)
    resp = editor.delete(f"/products/{product.id}")
    assert resp.status_code == 204


def test_delete_product_purges_cart_items(factory, as_user, db_session):
    """Les lignes de panier (transitoires) sont supprimées avec le produit."""
    product = factory.product()
    user = factory.user()
    cart = Cart(user_id=user.id)
    db_session.add(cart)
    db_session.commit()
    db_session.add(CartItem(cart_id=cart.id, product_id=product.id, quantity=2))
    db_session.commit()

    editor = as_user(role_level=2)
    resp = editor.delete(f"/products/{product.id}")

    assert resp.status_code == 204
    remaining = (
        db_session.query(CartItem).filter(CartItem.product_id == product.id).count()
    )
    assert remaining == 0
