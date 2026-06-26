from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.products.schemas import ProductCreate, ProductUpdate
from models.cart_item import CartItem
from models.category import Category
from models.price_history import PriceHistory
from models.product import Product
from models.product_vote import ProductVote


class ProductService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def _likes_count_column(self):
        return (
            select(func.count(ProductVote.id))
            .where(ProductVote.product_id == Product.id)
            .correlate(Product)
            .scalar_subquery()
            .label("likes_count")
        )

    def list_products(
        self,
        sort: str = "default",
        order: str = "desc",
        liked_by_user_id: int | None = None,
        category_id: int | None = None,
        search: str | None = None,
        limit: int | None = None,
    ) -> list[Product]:
        likes_count = self._likes_count_column()
        query = (
            self.db.query(Product, likes_count)
            .options(joinedload(Product.category))
        )

        if category_id is not None:
            query = query.filter(Product.category_id == category_id)

        if search:
            pattern = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Product.name.ilike(pattern),
                    Product.description.ilike(pattern),
                )
            )

        if liked_by_user_id is not None:
            query = query.filter(
                select(ProductVote.id)
                .where(
                    ProductVote.user_id == liked_by_user_id,
                    ProductVote.product_id == Product.id,
                )
                .correlate(Product)
                .exists()
            )
            latest_like = (
                select(func.max(ProductVote.created_at))
                .where(
                    ProductVote.user_id == liked_by_user_id,
                    ProductVote.product_id == Product.id,
                )
                .correlate(Product)
                .scalar_subquery()
            )
            query = query.order_by(latest_like.desc(), Product.id.desc())
        elif sort == "likes":
            likes_order = likes_count.desc() if order == "desc" else likes_count.asc()
            id_order = Product.id.desc() if order == "desc" else Product.id.asc()
            query = query.order_by(likes_order, id_order)
        elif sort == "price":
            price_order = Product.price.desc() if order == "desc" else Product.price.asc()
            query = query.order_by(price_order, Product.id)
        elif sort == "new":
            date_order = (
                Product.created_at.desc() if order == "desc" else Product.created_at.asc()
            )
            query = query.order_by(date_order, Product.id.desc())
        else:
            query = query.order_by(Product.id)

        if limit is not None:
            query = query.limit(limit)

        products = []
        for product, count in query.all():
            product.likes_count = count
            products.append(product)
        return products

    def get_product(self, product_id: int) -> Product:
        row = (
            self.db.query(Product, self._likes_count_column())
            .options(joinedload(Product.category))
            .filter(Product.id == product_id)
            .first()
        )
        if row is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Produit introuvable.",
            )
        product, count = row
        product.likes_count = count
        return product

    def create_product(self, payload: ProductCreate) -> Product:
        self._ensure_category_exists(payload.category_id)

        product = Product(
            category_id=payload.category_id,
            name=payload.name,
            description=payload.description,
            url=payload.url,
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

        if "url" in data:
            product.url = data["url"]

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
        # Les lignes de panier sont transitoires : on les purge automatiquement
        # (la FK cart_items est en ON DELETE RESTRICT, donc suppression manuelle requise).
        # price_history et product_votes sont en CASCADE, donc supprimés par la DB.
        self.db.query(CartItem).filter(CartItem.product_id == product.id).delete(
            synchronize_session=False
        )
        try:
            self.db.delete(product)
            self.db.commit()
        except IntegrityError as exc:
            # Reste bloquant : le produit figure dans une commande (order_items, RESTRICT).
            # On préserve l'historique des ventes plutôt que de le supprimer.
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Impossible de supprimer ce produit : il figure dans une commande passée.",
            ) from exc

    def _ensure_category_exists(self, category_id: int) -> None:
        exists = self.db.query(Category.id).filter(Category.id == category_id).first()
        if exists is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Catégorie introuvable.",
            )
