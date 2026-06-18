from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.products.schemas import ProductCreate, ProductUpdate
from models.category import Category
from models.price_history import PriceHistory
from models.product import Product


class ProductService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_products(self) -> list[Product]:
        return (
            self.db.query(Product)
            .options(joinedload(Product.category))
            .order_by(Product.id)
            .all()
        )

    def get_product(self, product_id: int) -> Product:
        product = (
            self.db.query(Product)
            .options(joinedload(Product.category))
            .filter(Product.id == product_id)
            .first()
        )
        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Produit introuvable.",
            )
        return product

    def create_product(self, payload: ProductCreate) -> Product:
        self._ensure_category_exists(payload.category_id)

        product = Product(
            category_id=payload.category_id,
            name=payload.name,
            description=payload.description,
            stock=payload.stock,
            price=payload.price,
        )
        self.db.add(product)
        self.db.flush()
        self.db.add(PriceHistory(product_id=product.id, price=payload.price))
        self.db.commit()
        self.db.refresh(product)
        return self.get_product(product.id)

    def update_product(self, product_id: int, payload: ProductUpdate) -> Product:
        product = self.get_product(product_id)
        data = payload.model_dump(exclude_unset=True)

        if "category_id" in data:
            self._ensure_category_exists(data["category_id"])
            product.category_id = data["category_id"]

        if "name" in data:
            product.name = data["name"]

        if "description" in data:
            product.description = data["description"]

        if "stock" in data:
            product.stock = data["stock"]

        if "price" in data:
            new_price = Decimal(str(data["price"]))
            if new_price != product.price:
                product.previous_price = product.price
                product.price = new_price
                self.db.add(PriceHistory(product_id=product.id, price=new_price))

        self.db.commit()
        return self.get_product(product.id)

    def delete_product(self, product_id: int) -> None:
        product = self.get_product(product_id)
        try:
            self.db.delete(product)
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Impossible de supprimer ce produit : il est référencé par un panier ou une commande.",
            ) from exc

    def _ensure_category_exists(self, category_id: int) -> None:
        exists = self.db.query(Category.id).filter(Category.id == category_id).first()
        if exists is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Catégorie introuvable.",
            )
