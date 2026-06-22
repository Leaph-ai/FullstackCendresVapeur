from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.security.rbac import require_role
from app.security.roles import RoleLevel

from .schemas import ColonyEventCreate, ColonyEventResponse, ShiftNoteResponse, ShiftNoteUpsert
from .service import PlanningService

router = APIRouter(prefix="/planning", tags=["Planning"])


def get_planning_service(db: Annotated[Session, Depends(get_db)]) -> PlanningService:
    return PlanningService(db)



@router.get("/events", response_model=list[ColonyEventResponse])
def list_events(
    year: int = Query(..., ge=2000, le=2100, description="Année (ex: 2026)"),
    month: int = Query(..., ge=1, le=12, description="Mois (1-12)"),
    service: Annotated[PlanningService, Depends(get_planning_service)] = ...,
) -> list[ColonyEventResponse]:
    return service.list_events(year, month)


@router.post(
    "/events",
    response_model=ColonyEventResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(RoleLevel.EDITOR))],
)
def create_event(
    payload: ColonyEventCreate,
    service: Annotated[PlanningService, Depends(get_planning_service)] = ...,
) -> ColonyEventResponse:
    """Crée un événement. Réservé aux éditeurs et administrateurs."""
    return service.create_event(payload)


@router.delete(
    "/events/{event_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role(RoleLevel.ADMIN))],
)
def delete_event(
    event_id: int,
    service: Annotated[PlanningService, Depends(get_planning_service)] = ...,
) -> None:
    """Supprime un événement. Réservé aux administrateurs."""
    service.delete_event(event_id)



@router.get("/notes", response_model=list[ShiftNoteResponse])
def list_shift_notes(
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    current_user: Annotated[dict, Depends(get_current_user)] = ...,
    service: Annotated[PlanningService, Depends(get_planning_service)] = ...,
) -> list[ShiftNoteResponse]:
    """Retourne les notes de quart de l'utilisateur courant pour le mois demandé."""
    return service.list_shift_notes(current_user["id"], year, month)


@router.put("/notes", response_model=ShiftNoteResponse)
def upsert_shift_note(
    payload: ShiftNoteUpsert,
    current_user: Annotated[dict, Depends(get_current_user)] = ...,
    service: Annotated[PlanningService, Depends(get_planning_service)] = ...,
) -> ShiftNoteResponse:
    """Crée ou met à jour une note de quart (une seule note par quart par jour).
    Utilise PUT car l'opération est idempotente.
    """
    return service.upsert_shift_note(current_user["id"], payload)