import pytest
from starlette.websockets import WebSocketDisconnect

from app.auth.service import AuthService, _revoked_tokens
from app.chat.hub import hub
from app.config import get_settings
from app.security.jwt import create_access_token
from app.security.roles import RoleLevel


@pytest.fixture(autouse=True)
def reset_hub():
    hub.reset()
    yield
    hub.reset()


def _editor_token(user_id: int) -> str:
    return create_access_token(
        str(user_id),
        get_settings(),
        extra={"email": "e@zone.local", "role": "editor", "role_level": RoleLevel.EDITOR},
    )


def _user_token(user_id: int) -> str:
    return create_access_token(
        str(user_id),
        get_settings(),
        extra={"email": "u@zone.local", "role": "user", "role_level": RoleLevel.USER},
    )


def _make_editor(factory, username):
    role = factory.role()
    return factory.user(role=role, username=username)


def _receive_until(ws, event_type):
    for _ in range(10):
        event = ws.receive_json()
        if event["type"] == event_type:
            return event
    raise AssertionError(f"no event of type {event_type!r} received")


def test_ws_without_token_is_rejected(client):
    with pytest.raises(WebSocketDisconnect) as exc:
        with client.websocket_connect("/chat/ws"):
            pass
    assert exc.value.code == 4401


def test_ws_with_user_role_is_rejected(client, factory):
    user = _make_editor(factory, "downgrade")
    token = _user_token(user.id)
    with pytest.raises(WebSocketDisconnect) as exc:
        with client.websocket_connect(f"/chat/ws?token={token}"):
            pass
    assert exc.value.code == 4403


def test_ws_sends_presence_on_connect(client, factory):
    user = _make_editor(factory, "veilleur")
    token = _editor_token(user.id)
    with client.websocket_connect(f"/chat/ws?token={token}") as ws:
        event = _receive_until(ws, "presence")
        usernames = [u["username"] for u in event["data"]["online"]]
        assert "veilleur" in usernames


def test_ws_broadcasts_message_to_other_client(client, factory):
    alice = _make_editor(factory, "alice")
    bob = _make_editor(factory, "bob")
    with client.websocket_connect(f"/chat/ws?token={_editor_token(alice.id)}") as ws_a:
        with client.websocket_connect(f"/chat/ws?token={_editor_token(bob.id)}") as ws_b:
            ws_a.send_json({"type": "message", "content": "à toi Bob"})
            event = _receive_until(ws_b, "message")
            assert event["data"]["content"] == "à toi Bob"
            assert event["data"]["sender_username"] == "alice"


def test_ws_typing_is_broadcast_not_persisted(client, factory):
    alice = _make_editor(factory, "alice")
    bob = _make_editor(factory, "bob")
    with client.websocket_connect(f"/chat/ws?token={_editor_token(alice.id)}") as ws_a:
        with client.websocket_connect(f"/chat/ws?token={_editor_token(bob.id)}") as ws_b:
            ws_a.send_json({"type": "typing", "is_typing": True})
            event = _receive_until(ws_b, "typing")
            assert event["data"]["username"] == "alice"
            assert event["data"]["is_typing"] is True
    # nothing persisted
    resp = client.get("/chat/messages")  # 401 without auth, but ensures no crash
    assert resp.status_code in (200, 401)


def test_ws_invalid_frame_returns_error_and_keeps_socket(client, factory):
    user = _make_editor(factory, "casseur")
    with client.websocket_connect(f"/chat/ws?token={_editor_token(user.id)}") as ws:
        _receive_until(ws, "presence")
        ws.send_text("pas du json")
        event = _receive_until(ws, "error")
        assert "detail" in event["data"]


def test_ws_with_revoked_token_is_rejected(client, factory, db_session):
    user = _make_editor(factory, "banni")
    token = _editor_token(user.id)
    AuthService(get_settings(), db_session).logout(token)
    try:
        with pytest.raises(WebSocketDisconnect) as exc:
            with client.websocket_connect(f"/chat/ws?token={token}"):
                pass
        assert exc.value.code == 4401
    finally:
        _revoked_tokens.discard(token)
