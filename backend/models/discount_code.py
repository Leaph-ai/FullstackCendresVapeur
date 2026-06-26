from sqlalchemy import Column, Integer, String, Numeric, Boolean
from sqlalchemy.orm import relationship

from app.core.database import Base


class DiscountCode(Base):
    __tablename__ = "discount_codes"

    id = Column(Integer, primary_key=True)
    code = Column(String, unique=True, nullable=False)
    percentage = Column(Numeric(5, 2), nullable=False)
    active = Column(Boolean, default=True)

    orders = relationship("Order", back_populates="discount_code")
