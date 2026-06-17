from sqlalchemy import Column, Integer, String, Text, ForeignKey, Numeric

from app.core.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True)

    category_id = Column(
        Integer,
        ForeignKey("categories.id")
    )

    name = Column(String, nullable=False)

    description = Column(Text)

    stock = Column(Integer)

    price = Column(Numeric(10, 2))