from sqlalchemy.orm import Session

from app.contact.schemas import ContactMessageCreate, ContactMessageResponse
from models.contact_message import ContactMessage


class ContactService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_message(self, payload: ContactMessageCreate) -> ContactMessageResponse:
        message = ContactMessage(
            name=payload.name,
            email=str(payload.email),
            subject=payload.subject,
            message=payload.message,
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return ContactMessageResponse.model_validate(message)
