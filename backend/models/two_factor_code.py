from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Identity, Index, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class TwoFactorCode(Base):
    __tablename__ = "two_factor_codes"
    __table_args__ = (Index("ix_two_factor_codes_user_expires", "user_id", "expires_at"),)

    id = Column(Integer, Identity(always=True), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    code_hash = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="two_factor_codes")
