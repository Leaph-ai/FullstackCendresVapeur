from __future__ import annotations

import asyncio

from app.config import Settings
from app.copper.hub import hub
from app.copper.market import market


async def run_copper_ticker(settings: Settings) -> None:
    interval = settings.copper_tick_seconds
    while True:
        await asyncio.sleep(interval)
        hub.publish(market.tick())
