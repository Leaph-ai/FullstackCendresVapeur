import logging

from sqlalchemy.orm import Session

from app.config import Settings
from app.contact.schemas import ContactMessageCreate, ContactMessageResponse
from app.services.mail import send_email
from models.contact_message import ContactMessage

logger = logging.getLogger(__name__)


class ContactService:
    def __init__(self, db: Session, settings: Settings) -> None:
        self.db = db
        self.settings = settings

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
        self._send_contact_notifications(message)
        return ContactMessageResponse.model_validate(message)

    def _send_contact_notifications(self, message: ContactMessage) -> None:
        self._send_admin_notification(message)
        self._send_user_acknowledgement(message)

    def _send_admin_notification(self, message: ContactMessage) -> None:
        admin_email = self.settings.contact_admin_email.strip()
        if not admin_email:
            logger.warning(
                "CONTACT_ADMIN_EMAIL non configuré — notification admin ignorée pour le message %s.",
                message.id,
            )
            return

        try:
            send_email(
                self.settings,
                to=admin_email,
                subject=f"Nouveau message de contact — {message.subject}",
                body=self._build_admin_email_body(message),
            )
        except Exception:
            logger.exception(
                "Échec de l'envoi de la notification admin pour le message %s à %s.",
                message.id,
                admin_email,
            )

    def _send_user_acknowledgement(self, message: ContactMessage) -> None:
        try:
            send_email(
                self.settings,
                to=message.email,
                subject="Votre message a bien été reçu — Cendres & Vapeur",
                body=self._build_user_email_body(message),
            )
        except Exception:
            logger.exception(
                "Échec de l'envoi de l'accusé de réception pour le message %s à %s.",
                message.id,
                message.email,
            )

    def _build_admin_email_body(self, message: ContactMessage) -> str:
        return "\n".join(
            [
                "Un nouveau message a été reçu via le bureau de poste.",
                "",
                f"De : {message.name} <{message.email}>",
                f"Sujet : {message.subject}",
                f"Référence : #{message.id}",
                "",
                "Message :",
                message.message,
            ]
        )

    def _build_user_email_body(self, message: ContactMessage) -> str:
        return "\n".join(
            [
                f"Bonjour {message.name},",
                "",
                f'Nous avons bien reçu votre message concernant « {message.subject} ».',
                "Un membre de la guilde vous répondra dans les meilleurs délais.",
                "",
                f"Référence : #{message.id}",
                "",
                "— Cendres & Vapeur",
            ]
        )
