from __future__ import annotations

import asyncio
import logging

from app.air.hub import hub
from app.air.monitor import monitor
from app.air.schemas import AirSnapshot
from app.config import Settings
from app.core.database import SessionLocal
from models.air_quality import AirQuality

logger = logging.getLogger(__name__)


def persist_alert(snapshot: AirSnapshot, session_factory=SessionLocal) -> None:
    """Enregistre un incident d'alerte rouge (appelé au front montant uniquement)."""
    session = session_factory()
    try:
        session.add(
            AirQuality(sulfur_level=snapshot.sulfur_level, alert_red=True)
        )
        session.commit()
    except Exception:  # noqa: BLE001 — le ticker ne doit jamais crasher
        session.rollback()
        logger.exception("Échec de persistance d'une alerte de toxicité")
    finally:
        session.close()


async def run_air_ticker(settings: Settings) -> None:
    interval = settings.air_tick_seconds
    while True:
        await asyncio.sleep(interval)
        snapshot, alert_edge = monitor.tick()
        hub.publish(snapshot)
        if alert_edge:
            persist_alert(snapshot)
