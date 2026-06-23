from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


class ColonyEventResponse(BaseModel):
    id: int
    title: str
    description: str | None
    event_date: date
    priority: str

    model_config = {"from_attributes": True}


class ColonyEventCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    event_date: date
    priority: Literal["low", "medium", "high", "critical"]


class ShiftNoteUpsert(BaseModel):
    note_date: date
    shift: Literal["matin", "soir"]
    content: str = Field(max_length=2000)


class ShiftNoteResponse(BaseModel):
    id: int
    note_date: date
    shift: str
    content: str | None

    model_config = {"from_attributes": True}


class MonthPlanningResponse(BaseModel):
    """Réponse unique pour le calendrier complet d'un mois.
    Permet au frontend de tout charger en une seule requête.
    """
    year: int
    month: int
    events: list[ColonyEventResponse]
    shift_notes: list[ShiftNoteResponse]