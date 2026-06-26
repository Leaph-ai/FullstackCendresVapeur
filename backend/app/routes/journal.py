from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.journal.schemas import JournalEntryResponse
from app.journal.service import JournalService

router = APIRouter(
    prefix="/journal",
    tags=["Journal"],
)


def get_journal_service(
    db: Annotated[Session, Depends(get_db)],
) -> JournalService:
    return JournalService(db)


@router.get("/", response_model=list[JournalEntryResponse])
def get_journal(
    service: Annotated[JournalService, Depends(get_journal_service)],
    limit: Annotated[int, Query(ge=1, le=50)] = 12,
) -> list[JournalEntryResponse]:
    return service.list_recent(limit=limit)
