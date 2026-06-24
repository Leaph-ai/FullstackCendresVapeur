from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.colony.schemas import ColonyStatsResponse
from app.colony.service import ColonyService
from app.core.database import get_db

router = APIRouter(
    prefix="/colony",
    tags=["Colony"],
)


def get_colony_service(
    db: Annotated[Session, Depends(get_db)],
) -> ColonyService:
    return ColonyService(db)


@router.get("/stats", response_model=ColonyStatsResponse)
def get_colony_stats(
    service: Annotated[ColonyService, Depends(get_colony_service)],
) -> ColonyStatsResponse:
    return service.stats()
