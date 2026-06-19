from app.chat.service import ChatService


def _make_editor(factory):
    role = factory.role(name="editor")
    return factory.user(role=role, username="engrenage")


def test_create_message_persists_and_returns_dto(db_session, factory):
    user = _make_editor(factory)
    service = ChatService(db_session)

    result = service.create_message(user.id, "Vapeur en hausse")

    assert result.id is not None
    assert result.sender_id == user.id
    assert result.sender_username == "engrenage"
    assert result.content == "Vapeur en hausse"
    assert result.created_at is not None


def test_list_recent_returns_ascending_order(db_session, factory):
    user = _make_editor(factory)
    service = ChatService(db_session)
    service.create_message(user.id, "premier")
    service.create_message(user.id, "second")

    result = service.list_recent()

    assert [m.content for m in result] == ["premier", "second"]


def test_list_recent_respects_limit_and_keeps_latest(db_session, factory):
    user = _make_editor(factory)
    service = ChatService(db_session)
    for i in range(5):
        service.create_message(user.id, f"msg-{i}")

    result = service.list_recent(limit=2)

    assert [m.content for m in result] == ["msg-3", "msg-4"]


def test_list_recent_filters_by_after_id(db_session, factory):
    user = _make_editor(factory)
    service = ChatService(db_session)
    first = service.create_message(user.id, "ancien")
    service.create_message(user.id, "nouveau")

    result = service.list_recent(after_id=first.id)

    assert [m.content for m in result] == ["nouveau"]
