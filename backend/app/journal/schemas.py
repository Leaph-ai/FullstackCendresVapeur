from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

JournalType = Literal["troc", "acces", "chaudiere", "vote", "alert"]


class JournalEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: JournalType
    action: str
    created_at: datetime
