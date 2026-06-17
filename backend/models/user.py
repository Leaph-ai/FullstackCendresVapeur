from sqlalchemy import Column, DateTime, ForeignKey, Identity, Integer, String, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, Identity(always=True), primary_key=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    oauth_provider = Column(String, nullable=True)
    oauth_provider_id = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    role = relationship("Role", back_populates="users")
