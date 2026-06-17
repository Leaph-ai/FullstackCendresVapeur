from sqlalchemy import Column, Identity, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, Identity(always=True), primary_key=True)
    name = Column(String, unique=True, nullable=False)

    users = relationship("User", back_populates="role")
