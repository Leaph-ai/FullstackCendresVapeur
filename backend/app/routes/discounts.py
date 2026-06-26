from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.discounts.schemas import DiscountCodeCreate, DiscountCodeResponse
from app.discounts.service import DiscountService

router = APIRouter(
    prefix="/discounts",
    tags=["Discounts"],
)

EDITOR_ROLE_LEVEL = 2


def get_discount_service(
    db: Annotated[Session, Depends(get_db)],
) -> DiscountService:
    return DiscountService(db)


def require_editor(
    current_user: Annotated[dict, Depends(get_current_user)],
) -> dict:
    if current_user.get("role_level", 0) < EDITOR_ROLE_LEVEL:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux éditeurs et administrateurs.",
        )
    return current_user


@router.get("/", response_model=list[DiscountCodeResponse])
def get_discount_codes(
    service: Annotated[DiscountService, Depends(get_discount_service)],
    _: Annotated[dict, Depends(require_editor)],
) -> list[DiscountCodeResponse]:
    return service.list_discount_codes()


@router.get("/{code}", response_model=DiscountCodeResponse)
def get_discount_code(
    code: str,
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[DiscountService, Depends(get_discount_service)],
) -> DiscountCodeResponse:
    _ = current_user
    return service.get_discount_code(code)


@router.post("/", response_model=DiscountCodeResponse, status_code=status.HTTP_201_CREATED)
def create_discount_code(
    payload: DiscountCodeCreate,
    service: Annotated[DiscountService, Depends(get_discount_service)],
    _: Annotated[dict, Depends(require_editor)],
) -> DiscountCodeResponse:
    return service.create_discount_code(payload)
