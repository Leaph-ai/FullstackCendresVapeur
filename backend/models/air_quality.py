from sqlalchemy import Column, Integer, Numeric, Boolean, DateTime, func

from app.core.database import Base


class AirQuality(Base):
    __tablename__ = "air_quality"

    id = Column(Integer, primary_key=True)
    sulfur_level = Column(Numeric(5, 2), nullable=False)
    monoxide_level = Column(Numeric(5, 2))
    particulate_level = Column(Numeric(5, 2))
    boiler_pressure = Column(Numeric(5, 2))
    alert_red = Column(Boolean, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
