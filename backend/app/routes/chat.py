import asyncio
import json
from typing import Annotated

import jwt
from fastapi import APIRouter, Depends, Query, WebSocket, status
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session
from starlette.websockets import WebSocketDisconnect

from app.auth.service import AuthService
from app.chat.hub import hub
from app.chat.schemas import ChatMessageCreate, ChatMessageResponse
from app.chat.service import ChatService
from app.config import get_settings
from app.core.database import get_db
from app.security.jwt import decode_token
from app.security.rbac import require_role
from app.security.roles import RoleLevel
from models.user import User

router = APIRouter(prefix="/chat", tags=["Chat"])


def get_chat_service(db: Annotated[Session, Depends(get_db)]) -> ChatService:
    return ChatService(db)


@router.get("/messages", response_model=list[ChatMessageResponse])
def get_messages(
    service: Annotated[ChatService, Depends(get_chat_service)],
    _: Annotated[dict, Depends(require_role(RoleLevel.EDITOR))],
    after_id: Annotated[int | None, Query(ge=0)] = None,
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
    after_id: Annotated[int, Query(ge=0)],
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


def _authenticate_ws_token(token: str | None, db: Session) -> dict | None:
    if not token:
        return None
    settings = get_settings()
    if AuthService(settings, db).is_token_revoked(token):
        return None
    try:
        payload = decode_token(token, settings, expected_type="access")
    except jwt.PyJWTError:
        return None
    return {
        "id": int(payload["sub"]),
        "role_level": payload.get("role_level", 0),
    }


async def _receive_loop(websocket: WebSocket, service: ChatService, user: dict) -> None:
    while True:
        raw = await websocket.receive_text()
        try:
            frame = json.loads(raw)
        except json.JSONDecodeError:
            await websocket.send_json(
                {"type": "error", "data": {"detail": "Trame JSON invalide."}}
            )
            continue
        frame_type = frame.get("type")
        if frame_type == "message":
            content = (frame.get("content") or "").strip()
            if not content or len(content) > 2000:
                await websocket.send_json(
                    {"type": "error", "data": {"detail": "Message invalide."}}
                )
                continue
            message = await run_in_threadpool(service.create_message, user["id"], content)
            hub.publish({"type": "message", "data": message.model_dump(mode="json")})
        elif frame_type == "typing":
            hub.publish(
                {
                    "type": "typing",
                    "data": {
                        "user_id": user["id"],
                        "username": user["username"],
                        "is_typing": bool(frame.get("is_typing")),
                    },
                }
            )
        else:
            await websocket.send_json(
                {"type": "error", "data": {"detail": "Type de trame inconnu."}}
            )


async def _broadcast_loop(websocket: WebSocket, queue) -> None:
    while True:
        event = await queue.get()
        await websocket.send_json(event)


@router.websocket("/ws")
async def chat_ws(
    websocket: WebSocket,
    db: Annotated[Session, Depends(get_db)],
    token: str | None = None,
) -> None:
    auth = _authenticate_ws_token(token, db)
    if auth is None:
        await websocket.close(code=4401)
        return
    if auth["role_level"] < RoleLevel.EDITOR:
        await websocket.close(code=4403)
        return

    db_user = await run_in_threadpool(lambda: db.get(User, auth["id"]))
    if db_user is None:
        await websocket.close(code=4401)
        return
    user = {"id": auth["id"], "username": db_user.username}

    await websocket.accept()
    service = ChatService(db)
    became_online = hub.add_presence(user["id"], user["username"])
    await websocket.send_json(
        {"type": "presence", "data": {"online": hub.online_users()}}
    )
    if became_online:
        hub.publish({"type": "presence", "data": {"online": hub.online_users()}})

    with hub.subscription() as queue:
        receive_task = asyncio.create_task(_receive_loop(websocket, service, user))
        broadcast_task = asyncio.create_task(_broadcast_loop(websocket, queue))
        try:
            _, pending = await asyncio.wait(
                {receive_task, broadcast_task},
                return_when=asyncio.FIRST_COMPLETED,
            )
            for task in pending:
                task.cancel()
        except WebSocketDisconnect:
            pass
        finally:
            if hub.remove_presence(user["id"]):
                hub.publish(
                    {"type": "presence", "data": {"online": hub.online_users()}}
                )
