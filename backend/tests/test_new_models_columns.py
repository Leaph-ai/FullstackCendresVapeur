"""Colonnes des 12 nouveaux modèles, conformes à schema.sql."""
from models import (
    Role, User, TwoFactorCode, PasswordResetCode, PriceHistory, ProductVote, ColonyEvent,
    ShiftNote, ChatMessage, ContactMessage, ColonyLog, AirQuality,
)

EXPECTED = {
    Role: {"id", "name"},
    User: {"id", "username", "email", "password_hash", "role_id",
           "oauth_provider", "oauth_provider_id", "created_at"},
    TwoFactorCode: {"id", "user_id", "code_hash", "expires_at", "used"},
    PasswordResetCode: {"id", "user_id", "code_hash", "expires_at", "used"},
    PriceHistory: {"id", "product_id", "price", "created_at"},
    ProductVote: {"id", "user_id", "product_id", "created_at"},
    ColonyEvent: {"id", "title", "description", "event_date", "priority"},
    ShiftNote: {"id", "user_id", "note_date", "shift", "content"},
    ChatMessage: {"id", "sender_id", "content", "created_at"},
    ContactMessage: {"id", "name", "email", "subject", "message", "created_at"},
    ColonyLog: {"id", "user_id", "action", "created_at"},
    AirQuality: {"id", "sulfur_level", "monoxide_level", "particulate_level",
                 "boiler_pressure", "alert_red", "created_at"},
}


def test_new_models_columns():
    for model, cols in EXPECTED.items():
        assert set(model.__table__.columns.keys()) == cols, model.__name__


def test_new_models_constraints():
    assert User.__table__.c.email.unique is True
    assert User.__table__.c.password_hash.nullable is True  # nullable: OAuth users have no password
    assert User.__table__.c.oauth_provider.nullable is True
    assert ColonyLog.__table__.c.user_id.nullable is True  # ON DELETE SET NULL
    # Unicité composite product_votes(user_id, product_id)
    pv_uniques = {
        tuple(sorted(c.columns.keys()))
        for c in ProductVote.__table__.constraints
        if c.__class__.__name__ == "UniqueConstraint"
    }
    assert ("product_id", "user_id") in pv_uniques
    # Unicité composite shift_notes(user_id, note_date, shift)
    sn_uniques = {
        tuple(sorted(c.columns.keys()))
        for c in ShiftNote.__table__.constraints
        if c.__class__.__name__ == "UniqueConstraint"
    }
    assert ("note_date", "shift", "user_id") in sn_uniques
