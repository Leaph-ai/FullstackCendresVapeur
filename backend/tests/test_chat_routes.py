import pytest

from app.chat.hub import hub
from app.security.roles import RoleLevel


@pytest.fixture(autouse=True)
def reset_hub():
    hub.reset()
    yield
    hub.reset()


def _seed_editor(factory):
    role = factory.role(name="editor")
    return factory.user(role=role, username="engrenage")


def test_get_messages_returns_history(factory, as_user, client):
    user = _seed_editor(factory)
    editor = as_user(user_id=user.id, role_level=RoleLevel.EDITOR, role="editor")
    editor.post("/chat/messages", json={"content": "salut la zone"})

    resp = client.get("/chat/messages")

    assert resp.status_code == 200
    assert [m["content"] for m in resp.json()] == ["salut la zone"]


def test_post_message_creates_and_returns_201(factory, as_user):
    user = _seed_editor(factory)
    editor = as_user(user_id=user.id, role_level=RoleLevel.EDITOR, role="editor")

    resp = editor.post("/chat/messages", json={"content": "vapeur"})

    assert resp.status_code == 201
    body = resp.json()
    assert body["content"] == "vapeur"
    assert body["sender_username"] == "engrenage"


def test_post_message_publishes_to_hub(factory, as_user):
    user = _seed_editor(factory)
    editor = as_user(user_id=user.id, role_level=RoleLevel.EDITOR, role="editor")
    queue = hub.subscribe()

    editor.post("/chat/messages", json={"content": "diffusé"})

    event = queue.get_nowait()
    assert event["type"] == "message"
    assert event["data"]["content"] == "diffusé"


def test_post_message_rejected_for_user_role(factory, as_user):
    user = _seed_editor(factory)
    plain = as_user(user_id=user.id, role_level=RoleLevel.USER, role="user")

    resp = plain.post("/chat/messages", json={"content": "interdit"})

    assert resp.status_code == 403


def test_post_message_requires_auth(client):
    resp = client.post("/chat/messages", json={"content": "anon"})
    assert resp.status_code == 401


def test_post_message_rejects_empty_content(factory, as_user):
    user = _seed_editor(factory)
    editor = as_user(user_id=user.id, role_level=RoleLevel.EDITOR, role="editor")

    resp = editor.post("/chat/messages", json={"content": ""})

    assert resp.status_code == 422
