from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Index

from app.core.database import Base


class TwoFactorCode(Base):
    __tablename__ = "two_factor_codes"
    __table_args__ = (Index("ix_two_factor_codes_user_expires", "user_id", "expires_at"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    code_hash = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
