from __future__ import annotations

import asyncio
import logging

from app.config import Settings
from app.copper.hub import hub
from app.copper.market import market
from app.copper.schemas import CopperSnapshot
from app.core.database import SessionLocal
from models.colony_log import ColonyLog

logger = logging.getLogger(__name__)

# Mouvement minimal (en points d'indice) pour qu'un tick mérite une entrée de journal.
COPPER_LOG_THRESHOLD = 5.0


def describe_copper_move(
    snapshot: CopperSnapshot,
    *,
    floor: float,
    ceiling: float,
    threshold: float = COPPER_LOG_THRESHOLD,
) -> str | None:
    """Renvoie le message de journal d'un mouvement notable, ou None si le tick
    est trop calme pour être journalisé (anti-flood)."""
    if snapshot.index <= floor:
        return "événement: Krach du cuivre — indice au plancher"
    if snapshot.index >= ceiling:
        return "événement: Le cuivre flambe — indice au plafond"
    if abs(snapshot.delta) >= threshold:
        verbe = "bondit" if snapshot.delta > 0 else "chute"
        return (
            f"événement: Le cours du cuivre {verbe} de {abs(snapshot.delta)} pts "
            f"(indice à {snapshot.index})"
        )
    return None


def log_copper_move(snapshot: CopperSnapshot, session_factory=SessionLocal) -> None:
    """Journalise un mouvement notable de la bourse (best-effort)."""
    action = describe_copper_move(
        snapshot, floor=market.min_index, ceiling=market.max_index
    )
    if action is None:
        return
    session = session_factory()
    try:
        session.add(ColonyLog(user_id=None, action=action))
        session.commit()
    except Exception:  # noqa: BLE001 — le ticker ne doit jamais crasher
        session.rollback()
        logger.exception("Échec de journalisation d'un mouvement du cuivre")
    finally:
        session.close()


async def run_copper_ticker(settings: Settings) -> None:
    interval = settings.copper_tick_seconds
    while True:
        await asyncio.sleep(interval)
        snapshot = market.tick()
        hub.publish(snapshot)
        log_copper_move(snapshot)
