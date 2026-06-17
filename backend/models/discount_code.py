from sqlalchemy import Column, Integer, String, Numeric, Boolean

from app.core.database import Base

class DiscountCode(Base):
    __tablename__ = "discount_codes"

    id = Column(Integer, primary_key=True)

    code = Column(String, unique=True)

    percentage = Column(Numeric(5,2))

    active = Column(Boolean, default=True)