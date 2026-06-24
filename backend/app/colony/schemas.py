from pydantic import BaseModel


class AirQualityBrief(BaseModel):
    sulfur: float
    monoxide: float
    particulate: float
    boiler_pressure: float
    alert_red: bool


class ColonyStatsResponse(BaseModel):
    citizens: int
    orders: int
    air: AirQualityBrief
