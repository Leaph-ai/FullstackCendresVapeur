from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.orders.schemas import OrderCreate, OrderResponse
from app.orders.service import OrderService

router = APIRouter(
    prefix="/orders",
    tags=["Orders"],
)


def get_order_service(
    db: Annotated[Session, Depends(get_db)],
) -> OrderService:
    return OrderService(db)


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreate,
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[OrderService, Depends(get_order_service)],
) -> OrderResponse:
    return service.create_order(current_user["id"], payload)


@router.get("/user/{user_id}", response_model=list[OrderResponse])
def get_user_orders(
    user_id: int,
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[OrderService, Depends(get_order_service)],
) -> list[OrderResponse]:
    return service.list_user_orders(
        user_id,
        current_user["id"],
        current_user.get("role_level", 0),
    )


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[OrderService, Depends(get_order_service)],
) -> OrderResponse:
    return service.get_order(
        order_id,
        current_user["id"],
        current_user.get("role_level", 0),
    )


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(
    order_id: int,
    current_user: Annotated[dict, Depends(get_current_user)],
    service: Annotated[OrderService, Depends(get_order_service)],
) -> None:
    service.delete_order(order_id, current_user.get("role_level", 0))
