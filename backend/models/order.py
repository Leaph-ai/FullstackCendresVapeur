from sqlalchemy import Column, Integer, ForeignKey, Numeric, String, DateTime, func

from app.core.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    discount_code_id = Column(Integer, ForeignKey("discount_codes.id", ondelete="RESTRICT"), nullable=True)
    total_amount = Column(Numeric(10, 2), nullable=False)
    status = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())