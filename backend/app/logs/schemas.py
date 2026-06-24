from datetime import datetime

from pydantic import BaseModel


class ColonyLogResponse(BaseModel):
    id: int
    user_id: int | None
    action: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ColonyLogCreate(BaseModel):
    action: str


class PublicLogResponse(BaseModel):
    """Log formaté pour l'affichage public (live feed).
    Pas d'user_id exposé — on affiche juste le message et la date.
    """
    message: str
    created_at: datetime