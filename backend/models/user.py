from sqlalchemy import Column, DateTime, ForeignKey, Identity, Integer, String, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, Identity(always=True), primary_key=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="RESTRICT"), nullable=False)
    oauth_provider = Column(String, nullable=True)
    oauth_provider_id = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    role = relationship("Role", back_populates="users")
    cart = relationship("Cart", back_populates="user", uselist=False)
    orders = relationship("Order", back_populates="user")
    votes = relationship("ProductVote", back_populates="user")
    two_factor_codes = relationship("TwoFactorCode", back_populates="user")
    shift_notes = relationship("ShiftNote", back_populates="user")
    chat_messages = relationship("ChatMessage", back_populates="sender")
    colony_logs = relationship("ColonyLog", back_populates="user")

