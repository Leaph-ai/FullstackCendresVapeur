"""Vérifie que tous les modèles se chargent et que leurs mappers se configurent."""
from sqlalchemy.orm import configure_mappers

import models  # noqa: F401  importe et enregistre tous les modèles


def test_all_mappers_configure():
    # Lève si une relation/FK est mal nommée ou si un back_populates est orphelin.
    configure_mappers()


def test_metadata_registers_all_tables():
    expected = {
        "roles", "users", "two_factor_codes", "password_reset_codes", "categories", "products",
        "price_history", "product_votes", "carts", "cart_items",
        "discount_codes", "orders", "order_items", "colony_events",
        "shift_notes", "chat_messages", "contact_messages", "colony_logs",
        "air_quality",
    }
    from app.core.database import Base
    assert expected <= set(Base.metadata.tables.keys())
