"""Vérifie les relations bidirectionnelles entre modèles."""
from sqlalchemy.orm import configure_mappers

from models import (
    Cart, CartItem, Category, ChatMessage, DiscountCode, Order, OrderItem,
    PriceHistory, Product, ProductVote, Role, ShiftNote, TwoFactorCode, PasswordResetCode, User,
)


def _target(model, attr):
    configure_mappers()
    return model.__mapper__.relationships[attr].mapper.class_


def test_relationship_targets():
    assert _target(Product, "category") is Category
    assert _target(Category, "products") is Product
    assert _target(User, "orders") is Order
    assert _target(Order, "user") is User
    assert _target(Order, "items") is OrderItem
    assert _target(OrderItem, "order") is Order
    assert _target(Order, "discount_code") is DiscountCode
    assert _target(DiscountCode, "orders") is Order
    assert _target(Cart, "items") is CartItem
    assert _target(CartItem, "cart") is Cart
    assert _target(Cart, "user") is User
    assert _target(Product, "price_history") is PriceHistory
    assert _target(Product, "votes") is ProductVote
    assert _target(ProductVote, "user") is User
    assert _target(Role, "users") is User
    assert _target(User, "role") is Role
    assert _target(User, "two_factor_codes") is TwoFactorCode
    assert _target(TwoFactorCode, "user") is User
    assert _target(User, "password_reset_codes") is PasswordResetCode
    assert _target(PasswordResetCode, "user") is User
    assert _target(User, "shift_notes") is ShiftNote
    assert _target(ShiftNote, "user") is User
    assert _target(ChatMessage, "sender") is User
    assert _target(User, "chat_messages") is ChatMessage


def test_cart_user_is_scalar():
    # carts.user_id est UNIQUE → relation 1-1 côté User.
    assert User.__mapper__.relationships["cart"].uselist is False
