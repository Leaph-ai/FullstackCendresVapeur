from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.chat.hub import hub
from app.chat.schemas import ChatMessageCreate, ChatMessageResponse
from app.chat.service import ChatService
from app.core.database import get_db
from app.security.rbac import require_role
from app.security.roles import RoleLevel

router = APIRouter(prefix="/chat", tags=["Chat"])


def get_chat_service(db: Annotated[Session, Depends(get_db)]) -> ChatService:
    return ChatService(db)


@router.get("/messages", response_model=list[ChatMessageResponse])
def get_messages(
    service: Annotated[ChatService, Depends(get_chat_service)],
    _: Annotated[dict, Depends(require_role(RoleLevel.EDITOR))],
    after_id: int | None = None,
    limit: int = 50,
) -> list[ChatMessageResponse]:
    return service.list_recent(after_id=after_id, limit=limit)


@router.post(
    "/messages",
    response_model=ChatMessageResponse,
    status_code=status.HTTP_201_CREATED,
)
def post_message(
    payload: ChatMessageCreate,
    service: Annotated[ChatService, Depends(get_chat_service)],
    user: Annotated[dict, Depends(require_role(RoleLevel.EDITOR))],
) -> ChatMessageResponse:
    message = service.create_message(user["id"], payload.content)
    hub.publish({"type": "message", "data": message.model_dump(mode="json")})
    return message
