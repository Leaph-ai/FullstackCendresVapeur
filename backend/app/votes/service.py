from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models.product import Product
from models.product_vote import ProductVote


class VoteService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def add_vote(self, user_id: int, product_id: int) -> dict:
        self._ensure_product_exists(product_id)
        existing = (
            self.db.query(ProductVote)
            .filter_by(user_id=user_id, product_id=product_id)
            .first()
        )
        if existing is None:
            self.db.add(ProductVote(user_id=user_id, product_id=product_id))
            try:
                self.db.commit()
            except IntegrityError:
                self.db.rollback()  # doublon concurrent → idempotent
        return self._status(product_id, liked=True)

    def remove_vote(self, user_id: int, product_id: int) -> None:
        vote = (
            self.db.query(ProductVote)
            .filter_by(user_id=user_id, product_id=product_id)
            .first()
        )
        if vote is not None:
            self.db.delete(vote)
            self.db.commit()

    def _count(self, product_id: int) -> int:
        return (
            self.db.query(func.count(ProductVote.id))
            .filter(ProductVote.product_id == product_id)
            .scalar()
        )

    def _status(self, product_id: int, liked: bool) -> dict:
        return {
            "product_id": product_id,
            "likes_count": self._count(product_id),
            "liked": liked,
        }

    def _ensure_product_exists(self, product_id: int) -> None:
        exists = self.db.query(Product.id).filter(Product.id == product_id).first()
        if exists is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Produit introuvable.",
            )
