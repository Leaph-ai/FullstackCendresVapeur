from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.products.schemas import ProductResponse
from app.products.service import ProductService
from app.votes.schemas import VoteStatusResponse
from app.votes.service import VoteService

router = APIRouter(tags=["Votes"])


def get_vote_service(db: Annotated[Session, Depends(get_db)]) -> VoteService:
    return VoteService(db)


def get_product_service(db: Annotated[Session, Depends(get_db)]) -> ProductService:
    return ProductService(db)


@router.post(
    "/products/{product_id}/vote",
    response_model=VoteStatusResponse,
    status_code=status.HTTP_201_CREATED,
)
def like_product(
    product_id: int,
    service: Annotated[VoteService, Depends(get_vote_service)],
    user: Annotated[dict, Depends(get_current_user)],
) -> VoteStatusResponse:
    return service.add_vote(user["id"], product_id)


@router.delete(
    "/products/{product_id}/vote",
    status_code=status.HTTP_204_NO_CONTENT,
)
def unlike_product(
    product_id: int,
    service: Annotated[VoteService, Depends(get_vote_service)],
    user: Annotated[dict, Depends(get_current_user)],
) -> None:
    service.remove_vote(user["id"], product_id)


@router.get("/me/votes", response_model=list[ProductResponse])
def my_liked_products(
    service: Annotated[ProductService, Depends(get_product_service)],
    user: Annotated[dict, Depends(get_current_user)],
) -> list[ProductResponse]:
    return service.list_products(liked_by_user_id=user["id"])
