from __future__ import annotations

import asyncio
from collections.abc import Iterator
from contextlib import contextmanager


class ChatHub:
    """In-process pub/sub hub: single source of truth for chat real time.

    Holds one asyncio.Queue per subscriber (WebSocket socket or long-poller),
    remembering the event loop each queue was created in so publish() can wake
    waiters across loops/threads safely (Starlette's TestClient runs each WS
    connection in its own loop). Tracks presence as user_id -> {"username",
    "count"} so the same user opening several sockets counts as online once.
    """

    def __init__(self) -> None:
        # queue -> the loop it was created in (None if created outside a loop)
        self._subscribers: dict[asyncio.Queue, asyncio.AbstractEventLoop | None] = {}
        self._presence: dict[int, dict] = {}

    def subscribe(self) -> asyncio.Queue:
        queue: asyncio.Queue = asyncio.Queue()
        try:
            loop: asyncio.AbstractEventLoop | None = asyncio.get_running_loop()
        except RuntimeError:
            loop = None
        self._subscribers[queue] = loop
        return queue

    def unsubscribe(self, queue: asyncio.Queue) -> None:
        self._subscribers.pop(queue, None)

    @contextmanager
    def subscription(self) -> Iterator[asyncio.Queue]:
        queue = self.subscribe()
        try:
            yield queue
        finally:
            self.unsubscribe(queue)

    def publish(self, event: dict) -> None:
        for queue, loop in list(self._subscribers.items()):
            if loop is None or loop.is_closed():
                queue.put_nowait(event)
                continue
            try:
                loop.call_soon_threadsafe(queue.put_nowait, event)
            except RuntimeError:
                pass

    def add_presence(self, user_id: int, username: str) -> bool:
        entry = self._presence.get(user_id)
        if entry is None:
            self._presence[user_id] = {"username": username, "count": 1}
            return True
        entry["count"] += 1
        return False

    def remove_presence(self, user_id: int) -> bool:
        entry = self._presence.get(user_id)
        if entry is None:
            return False
        entry["count"] -= 1
        if entry["count"] <= 0:
            del self._presence[user_id]
            return True
        return False

    def online_users(self) -> list[dict]:
        return [
            {"user_id": uid, "username": entry["username"]}
            for uid, entry in self._presence.items()
        ]

    def reset(self) -> None:
        self._subscribers.clear()
        self._presence.clear()


hub = ChatHub()
