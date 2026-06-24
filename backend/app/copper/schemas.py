from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class CopperSnapshot(BaseModel):
    index: float
    delta: float
    trend: Literal["up", "down", "flat"]
    spark: list[float] = Field(min_length=1)
    timestamp: datetime
