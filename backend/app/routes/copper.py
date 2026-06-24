import asyncio
import json
from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.config import Settings, get_settings
from app.copper.hub import hub
from app.copper.market import market
from app.copper.schemas import CopperSnapshot

router = APIRouter(prefix="/copper", tags=["Copper"])


def _sse_event(snapshot: CopperSnapshot) -> str:
    payload = snapshot.model_dump(mode="json")
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


@router.get("/current", response_model=CopperSnapshot)
def get_copper_current() -> CopperSnapshot:
    return market.snapshot()


@router.get("/stream")
async def stream_copper(
    settings: Annotated[Settings, Depends(get_settings)],
) -> StreamingResponse:
    async def event_generator():
        queue = hub.subscribe()
        try:
            yield _sse_event(market.snapshot())
            while True:
                try:
                    snapshot = await asyncio.wait_for(
                        queue.get(),
                        timeout=settings.copper_tick_seconds,
                    )
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"
                    continue
                yield _sse_event(snapshot)
        finally:
            hub.unsubscribe(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
