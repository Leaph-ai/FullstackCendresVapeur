from sqlalchemy import (
    Column,
    Integer,
    ForeignKey,
    Numeric
)

from app.core.database import Base

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True)

    order_id = Column(
        Integer,
        ForeignKey("orders.id")
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id")
    )

    quantity = Column(Integer)

    unit_price = Column(Numeric(10,2))