from datetime import UTC, datetime

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import models  # noqa: F401 — enregistre tous les modèles
from app.air.schemas import AirSnapshot, GaugeReading
from app.air.ticker import persist_alert
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
