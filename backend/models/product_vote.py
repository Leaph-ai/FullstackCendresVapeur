from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint, func

from app.core.database import Base


class ProductVote(Base):
    __tablename__ = "product_votes"
    __table_args__ = (UniqueConstraint("user_id", "product_id"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
