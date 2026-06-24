from sqlalchemy import func
from sqlalchemy.orm import Session

from models.category import Category
from models.product import Product


class CategoryService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_categories(self) -> list[Category]:
        rows = (
            self.db.query(Category, func.count(Product.id))
            .outerjoin(Product, Product.category_id == Category.id)
            .group_by(Category.id)
            .order_by(Category.name)
            .all()
        )
        categories = []
        for category, count in rows:
            category.product_count = count
            categories.append(category)
        return categories
