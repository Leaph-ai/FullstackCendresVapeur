from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.votes.schemas import VoteStatusResponse
from app.votes.service import VoteService

router = APIRouter(tags=["Votes"])


def get_vote_service(db: Annotated[Session, Depends(get_db)]) -> VoteService:
    return VoteService(db)


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
