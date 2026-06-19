from app.chat.hub import ChatHub


def test_publish_delivers_event_to_all_subscribers():
    hub = ChatHub()
    q1 = hub.subscribe()
    q2 = hub.subscribe()

    hub.publish({"type": "message", "data": {"id": 1}})

    assert q1.get_nowait() == {"type": "message", "data": {"id": 1}}
    assert q2.get_nowait() == {"type": "message", "data": {"id": 1}}


def test_unsubscribe_stops_delivery():
    hub = ChatHub()
    q = hub.subscribe()
    hub.unsubscribe(q)

    hub.publish({"type": "message", "data": {}})

    assert q.empty()


def test_subscription_context_manager_cleans_up():
    hub = ChatHub()
    with hub.subscription() as q:
        hub.publish({"type": "x", "data": {}})
        assert q.get_nowait() == {"type": "x", "data": {}}
    hub.publish({"type": "y", "data": {}})
    assert q.empty()


def test_presence_dedupes_multiple_sockets_for_same_user():
    hub = ChatHub()
    assert hub.add_presence(7, "engrenage") is True   # 0 -> 1
    assert hub.add_presence(7, "engrenage") is False  # 1 -> 2
    assert hub.online_users() == [{"user_id": 7, "username": "engrenage"}]

    assert hub.remove_presence(7) is False  # 2 -> 1
    assert hub.online_users() == [{"user_id": 7, "username": "engrenage"}]
    assert hub.remove_presence(7) is True   # 1 -> 0
    assert hub.online_users() == []


def test_reset_clears_state():
    hub = ChatHub()
    hub.subscribe()
    hub.add_presence(1, "a")
    hub.reset()
    assert hub.online_users() == []
