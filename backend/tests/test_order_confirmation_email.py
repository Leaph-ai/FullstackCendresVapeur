from decimal import Decimal
from unittest.mock import patch

from models.cart import Cart
from models.cart_item import CartItem


@patch("app.orders.service.send_email")
def test_create_order_sends_confirmation_email(mock_send_email, client, factory, as_user, db_session):
    user = factory.user(email="client@zone.local")
    product = factory.product(name="Engrenage laiton", price="12.50", stock=3)
    cart = Cart(user_id=user.id)
    db_session.add(cart)
    db_session.flush()
    db_session.add(CartItem(cart_id=cart.id, product_id=product.id, quantity=2))
    db_session.commit()

    response = as_user(user_id=user.id, email=user.email).post("/orders/", json={})

    assert response.status_code == 201
    order = response.json()
    mock_send_email.assert_called_once()
    kwargs = mock_send_email.call_args.kwargs
    assert kwargs["to"] == "client@zone.local"
    assert f"#{order['id']}" in kwargs["subject"]
    assert "Engrenage laiton x2" in kwargs["body"]
    assert "25.00 €" in kwargs["body"]


@patch("app.orders.service.send_email", side_effect=RuntimeError("SMTP indisponible"))
def test_create_order_succeeds_when_confirmation_email_fails(
    _mock_send_email,
    client,
    factory,
    as_user,
    db_session,
):
    user = factory.user()
    product = factory.product(stock=1)
    cart = Cart(user_id=user.id)
    db_session.add(cart)
    db_session.flush()
    db_session.add(CartItem(cart_id=cart.id, product_id=product.id, quantity=1))
    db_session.commit()

    response = as_user(user_id=user.id).post("/orders/", json={})

    assert response.status_code == 201
    assert Decimal(response.json()["total_amount"]) == Decimal("10.00")
