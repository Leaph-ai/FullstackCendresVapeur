from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.discounts.schemas import DiscountCodeCreate
from models.discount_code import DiscountCode


class DiscountService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_discount_codes(self) -> list[DiscountCode]:
        return (
            self.db.query(DiscountCode)
            .order_by(DiscountCode.code)
            .all()
        )

    def get_discount_code(self, code: str) -> DiscountCode:
        discount = (
            self.db.query(DiscountCode)
            .filter(DiscountCode.code == code.upper())
            .first()
        )
        if discount is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Code de réduction introuvable.",
            )
        return discount

    def create_discount_code(self, payload: DiscountCodeCreate) -> DiscountCode:
        normalized_code = payload.code.upper()
        existing = (
            self.db.query(DiscountCode)
            .filter(DiscountCode.code == normalized_code)
            .first()
        )
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ce code de réduction existe déjà.",
            )

        discount = DiscountCode(
            code=normalized_code,
            percentage=payload.percentage,
            active=payload.active,
        )
        self.db.add(discount)
        try:
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ce code de réduction existe déjà.",
            ) from exc

        self.db.refresh(discount)
        return discount
