from sqlalchemy import Column, Integer, String, Text, ForeignKey, Numeric, DateTime, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    url = Column(String(2048))
    stock = Column(Integer, nullable=False, default=0)
    price = Column(Numeric(10, 2), nullable=False)
    previous_price = Column(Numeric(10, 2))
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    category = relationship("Category", back_populates="products")
    cart_items = relationship("CartItem", back_populates="product")
    order_items = relationship("OrderItem", back_populates="product")
    price_history = relationship("PriceHistory", back_populates="product")
    votes = relationship("ProductVote", back_populates="product")
