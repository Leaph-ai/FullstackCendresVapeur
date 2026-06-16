from sqlalchemy import (
    Column,
    Integer,
    ForeignKey,
    Numeric,
    String
)

from app.core.database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id")
    )

    discount_code_id = Column(
        Integer,
        ForeignKey("discount_codes.id"),
        nullable=True
    )

    total_amount = Column(Numeric(10,2))

    status = Column(String)