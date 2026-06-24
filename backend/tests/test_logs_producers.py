from unittest.mock import patch

from models.cart import Cart
from models.cart_item import CartItem
from models.colony_log import ColonyLog


def _seed_cart(db_session, factory, quantity=2, price="10.00", stock=5):
    user = factory.user()
    product = factory.product(price=price, stock=stock)
    cart = Cart(user_id=user.id)
    db_session.add(cart)
    db_session.flush()
    db_session.add(CartItem(cart_id=cart.id, product_id=product.id, quantity=quantity))
    db_session.commit()
    return user, product


@patch("app.orders.service.send_email")
def test_creating_order_writes_commande_log(_mail, client, factory, as_user, db_session):
    user, _ = _seed_cart(db_session, factory)
    resp = as_user(user_id=user.id).post("/orders/", json={})
    assert resp.status_code == 201
    order_id = resp.json()["id"]
    logs = db_session.query(ColonyLog).filter(ColonyLog.action.like("commande:%")).all()
    assert len(logs) == 1
    assert f"#{order_id}" in logs[0].action
    assert logs[0].user_id == user.id


@patch("app.orders.service.send_email")
@patch("app.orders.service.LogService.add_log", side_effect=RuntimeError("journal HS"))
def test_order_succeeds_when_logging_fails(_log, _mail, client, factory, as_user, db_session):
    user, _ = _seed_cart(db_session, factory, quantity=1)
    resp = as_user(user_id=user.id).post("/orders/", json={})
    assert resp.status_code == 201  # le logging best-effort ne casse pas la commande
