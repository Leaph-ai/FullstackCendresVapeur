"""Les colonnes des 7 modèles e-commerce doivent correspondre à schema.sql."""
from models import (
    Cart, CartItem, Category, DiscountCode, Order, OrderItem, Product,
)

EXPECTED = {
    Category: {"id", "name"},
    Product: {"id", "category_id", "name", "description", "url", "stock",
              "price", "previous_price", "created_at"},
    Cart: {"id", "user_id"},
    CartItem: {"id", "cart_id", "product_id", "quantity"},
    DiscountCode: {"id", "code", "percentage", "active"},
    Order: {"id", "user_id", "discount_code_id", "total_amount",
            "status", "created_at"},
    OrderItem: {"id", "order_id", "product_id", "quantity", "unit_price"},
}


def test_existing_models_columns():
    for model, cols in EXPECTED.items():
        assert set(model.__table__.columns.keys()) == cols, model.__name__


def test_existing_models_constraints():
    assert Product.__table__.c.name.nullable is False
    assert Product.__table__.c.price.nullable is False
    assert Cart.__table__.c.user_id.unique is True
    assert Cart.__table__.c.user_id.nullable is False
    assert OrderItem.__table__.c.unit_price.nullable is False
    # Unicité composite cart_items(cart_id, product_id)
    uniques = {
        tuple(sorted(c.columns.keys()))
        for c in CartItem.__table__.constraints
        if c.__class__.__name__ == "UniqueConstraint"
    }
    assert ("cart_id", "product_id") in uniques
