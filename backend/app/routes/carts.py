from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.carts.schemas import CartItemCreate, CartItemUpdate, CartResponse
from app.carts.service import CartService
from app.core.database import get_db

router = APIRouter(
    prefix="/carts",
    tags=["Carts"],
)


def get_cart_service(
    db: Annotated[Session, Depends(get_db)],
) -> CartService:
    return CartService(db)


@router.get("/{user_id}", response_model=CartResponse)
def get_cart(
    user_id: int,
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[CartService, Depends(get_cart_service)],
) -> CartResponse:
    return service.get_cart(
        user_id,
        current_user["id"],
        current_user.get("role_level", 0),
    )


@router.post("/{user_id}/items", response_model=CartResponse, status_code=status.HTTP_201_CREATED)
def add_item(
    user_id: int,
    payload: CartItemCreate,
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[CartService, Depends(get_cart_service)],
) -> CartResponse:
    return service.add_item(
        user_id,
        payload,
        current_user["id"],
        current_user.get("role_level", 0),
    )


@router.patch("/{user_id}/items/{item_id}", response_model=CartResponse)
def update_item_quantity(
    user_id: int,
    item_id: int,
    payload: CartItemUpdate,
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[CartService, Depends(get_cart_service)],
) -> CartResponse:
    return service.update_item_quantity(
        user_id,
        item_id,
        payload.quantity,
        current_user["id"],
        current_user.get("role_level", 0),
    )


@router.delete("/{user_id}/items/{item_id}", response_model=CartResponse)
def remove_item(
    user_id: int,
    item_id: int,
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[CartService, Depends(get_cart_service)],
) -> CartResponse:
    return service.remove_item(
        user_id,
        item_id,
        current_user["id"],
        current_user.get("role_level", 0),
    )
