import asyncio
from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.concurrency import run_in_threadpool
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


LONG_POLL_TIMEOUT_SECONDS = 25


def get_long_poll_timeout() -> float:
    return LONG_POLL_TIMEOUT_SECONDS


@router.get("/poll", response_model=list[ChatMessageResponse])
async def poll_messages(
    after_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[dict, Depends(require_role(RoleLevel.EDITOR))],
    timeout: Annotated[float, Depends(get_long_poll_timeout)],
) -> list:
    service = ChatService(db)
    # Subscribe BEFORE reading the DB so a message arriving in between is not lost.
    with hub.subscription() as queue:
        existing = await run_in_threadpool(service.list_recent, after_id, 50)
        if existing:
            return [m.model_dump(mode="json") for m in existing]
        try:
            while True:
                event = await asyncio.wait_for(queue.get(), timeout=timeout)
                if event.get("type") == "message" and event["data"]["id"] > after_id:
                    return [event["data"]]
        except asyncio.TimeoutError:
            return []
