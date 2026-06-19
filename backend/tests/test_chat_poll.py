import pytest

import app.routes.chat as chat_routes
from app.chat.hub import hub
from app.main import app
from app.security.roles import RoleLevel


@pytest.fixture(autouse=True)
def reset_hub():
    hub.reset()
    yield
    hub.reset()


@pytest.fixture
def fast_timeout():
    app.dependency_overrides[chat_routes.get_long_poll_timeout] = lambda: 0.1
    yield
    app.dependency_overrides.pop(chat_routes.get_long_poll_timeout, None)


def _seed_editor(factory):
    role = factory.role(name="editor")
    return factory.user(role=role, username="engrenage")


def test_poll_returns_existing_messages_immediately(factory, as_user):
    user = _seed_editor(factory)
    editor = as_user(user_id=user.id, role_level=RoleLevel.EDITOR, role="editor")
    editor.post("/chat/messages", json={"content": "déjà là"})

    resp = editor.get("/chat/poll", params={"after_id": 0})

    assert resp.status_code == 200
    assert [m["content"] for m in resp.json()] == ["déjà là"]


def test_poll_returns_empty_on_timeout(factory, as_user, fast_timeout):
    user = _seed_editor(factory)
    editor = as_user(user_id=user.id, role_level=RoleLevel.EDITOR, role="editor")
    created = editor.post("/chat/messages", json={"content": "vu"}).json()

    resp = editor.get("/chat/poll", params={"after_id": created["id"]})

    assert resp.status_code == 200
    assert resp.json() == []


def test_poll_rejected_for_user_role(factory, as_user, fast_timeout):
    user = _seed_editor(factory)
    plain = as_user(user_id=user.id, role_level=RoleLevel.USER, role="user")

    resp = plain.get("/chat/poll", params={"after_id": 0})

    assert resp.status_code == 403
