from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.contact.schemas import ContactMessageCreate, ContactMessageResponse
from app.contact.service import ContactService
from app.config import Settings, get_settings
from app.core.database import get_db

router = APIRouter(tags=["Contact"])


def get_contact_service(
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> ContactService:
    return ContactService(db, settings)


@router.post(
    "/contact",
    response_model=ContactMessageResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_contact_message(
    payload: ContactMessageCreate,
    service: Annotated[ContactService, Depends(get_contact_service)],
) -> ContactMessageResponse:
    return service.create_message(payload)
