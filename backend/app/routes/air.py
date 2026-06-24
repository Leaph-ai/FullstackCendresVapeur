import asyncio
import json
from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.air.hub import hub
from app.air.monitor import monitor
from app.air.schemas import AirSnapshot
from app.config import Settings, get_settings

router = APIRouter(prefix="/air", tags=["Air"])


def _sse_event(snapshot: AirSnapshot) -> str:
    payload = snapshot.model_dump(mode="json")
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


@router.get("/current", response_model=AirSnapshot)
def get_air_current() -> AirSnapshot:
    return monitor.snapshot()


@router.get("/stream")
async def stream_air(
    settings: Annotated[Settings, Depends(get_settings)],
) -> StreamingResponse:
    async def event_generator():
        queue = hub.subscribe()
        try:
            yield _sse_event(monitor.snapshot())
            while True:
                try:
                    snapshot = await asyncio.wait_for(
                        queue.get(),
                        timeout=settings.air_tick_seconds,
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
