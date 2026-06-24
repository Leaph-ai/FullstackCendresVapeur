from datetime import UTC, datetime

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import models  # noqa: F401 — enregistre tous les modèles
from app.air.schemas import AirSnapshot, GaugeReading
from app.air.ticker import persist_alert
from app.copper.schemas import CopperSnapshot
from app.copper.ticker import (
    COPPER_LOG_THRESHOLD,
    describe_copper_move,
    log_copper_move,
)
from app.core.database import Base
from models.colony_log import ColonyLog


def _memory_sessionmaker():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, autoflush=False, autocommit=False)


def _alert_snapshot(level=82.0):
    return AirSnapshot(
        gauges=[GaugeReading(id="soufre", label="Soufre", value=int(level), unit="ppm", warn=True, danger=True)],
        sulfur_spark=[level],
        sulfur_level=level,
        alert_red=True,
        threshold=70.0,
        timestamp=datetime.now(UTC),
    )


def test_persist_alert_writes_event_log():
    Session = _memory_sessionmaker()
    persist_alert(_alert_snapshot(level=82.0), session_factory=Session)
    session = Session()
    logs = session.query(ColonyLog).filter(ColonyLog.action.like("événement:%")).all()
    assert len(logs) == 1
    assert "soufre" in logs[0].action.lower()
    assert "82" in logs[0].action
    assert logs[0].user_id is None
    session.close()


def _copper_snapshot(index, delta):
    trend = "up" if delta > 0 else "down" if delta < 0 else "flat"
    return CopperSnapshot(
        index=index, delta=delta, trend=trend, spark=[10.0], timestamp=datetime.now(UTC)
    )


def test_describe_big_jump_up():
    msg = describe_copper_move(
        _copper_snapshot(254.0, 6.0), floor=180.0, ceiling=320.0, threshold=5.0
    )
    assert msg.startswith("événement:")
    assert "bondit" in msg


def test_describe_small_delta_is_none():
    assert (
        describe_copper_move(
            _copper_snapshot(250.0, 2.0), floor=180.0, ceiling=320.0, threshold=5.0
        )
        is None
    )


def test_describe_floor_is_krach():
    msg = describe_copper_move(
        _copper_snapshot(180.0, -1.0), floor=180.0, ceiling=320.0, threshold=5.0
    )
    assert "plancher" in msg.lower()


def test_log_copper_move_persists_notable_event():
    Session = _memory_sessionmaker()
    log_copper_move(_copper_snapshot(254.0, 6.0), session_factory=Session)
    session = Session()
    logs = session.query(ColonyLog).filter(ColonyLog.action.like("événement:%")).all()
    assert len(logs) == 1
    session.close()


def test_log_copper_move_skips_small_delta():
    Session = _memory_sessionmaker()
    log_copper_move(_copper_snapshot(250.0, 1.0), session_factory=Session)
    session = Session()
    assert session.query(ColonyLog).count() == 0
    session.close()


def test_copper_log_threshold_default():
    assert COPPER_LOG_THRESHOLD == 5.0
