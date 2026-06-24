from datetime import datetime

from pydantic import BaseModel, Field


class GaugeReading(BaseModel):
    id: str
    label: str
    value: float
    unit: str
    warn: bool
    danger: bool


class AirSnapshot(BaseModel):
    gauges: list[GaugeReading] = Field(min_length=1)
    sulfur_spark: list[float] = Field(min_length=1)
    sulfur_level: float
    alert_red: bool
    threshold: float
    timestamp: datetime
