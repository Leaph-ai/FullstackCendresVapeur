from __future__ import annotations

import asyncio
from collections.abc import Iterator
from contextlib import contextmanager

from app.copper.schemas import CopperSnapshot


class CopperHub:
    """Pub/sub in-process pour diffuser les ticks de la bourse du cuivre (SSE)."""

    def __init__(self) -> None:
        self._subscribers: dict[asyncio.Queue, asyncio.AbstractEventLoop | None] = {}

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

    def publish(self, snapshot: CopperSnapshot) -> None:
        for queue, loop in list(self._subscribers.items()):
            if loop is None or loop.is_closed():
                queue.put_nowait(snapshot)
                continue
            try:
                loop.call_soon_threadsafe(queue.put_nowait, snapshot)
            except RuntimeError:
                pass

    def reset(self) -> None:
        self._subscribers.clear()


hub = CopperHub()
