from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.chat.schemas import ChatMessageResponse
from models.chat_message import ChatMessage


class ChatService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_message(self, sender_id: int, content: str) -> ChatMessageResponse:
        message = ChatMessage(sender_id=sender_id, content=content)
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return self._to_response(message)

    def list_recent(
        self, after_id: int | None = None, limit: int = 50
    ) -> list[ChatMessageResponse]:
        stmt = select(ChatMessage).options(joinedload(ChatMessage.sender))
        if after_id is not None:
            stmt = stmt.where(ChatMessage.id > after_id).order_by(ChatMessage.id.asc()).limit(limit)
            rows = self.db.execute(stmt).scalars().all()
        else:
            stmt = stmt.order_by(ChatMessage.id.desc()).limit(limit)
            rows = list(reversed(self.db.execute(stmt).scalars().all()))
        return [self._to_response(message) for message in rows]

    def _to_response(self, message: ChatMessage) -> ChatMessageResponse:
        return ChatMessageResponse(
            id=message.id,
            sender_id=message.sender_id,
            sender_username=message.sender.username,
            content=message.content,
            created_at=message.created_at,
        )
