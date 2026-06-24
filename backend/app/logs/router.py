from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.core.database import get_db

from .schemas import (
    ColonyLogCreate,
    ColonyLogResponse,
    ColonyLogUpdate,
    PublicLogResponse,
)
from .service import LogService

router = APIRouter(prefix="/logs", tags=["Logs"])

ADMIN_ROLE_LEVEL = 3


def get_log_service(db: Annotated[Session, Depends(get_db)]) -> LogService:
    return LogService(db)


def require_admin(
    current_user: Annotated[dict, Depends(get_current_user)],
) -> dict:
    if current_user.get("role_level", 0) < ADMIN_ROLE_LEVEL:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs.",
        )
    return current_user


@router.get("/", response_model=list[ColonyLogResponse])
def list_logs(
    limit: int = Query(default=50, ge=1, le=200, description="Nombre de logs à retourner"),
    _: Annotated[dict, Depends(require_admin)] = ...,
    service: Annotated[LogService, Depends(get_log_service)] = ...,
) -> list[ColonyLogResponse]:
    """Journal des survivants — dernières actions de la colonie.
    Réservé aux administrateurs uniquement.
    """
    return service.list_logs(limit=limit)


@router.get("/feed", response_model=list[PublicLogResponse])
def public_feed(
    limit: int = Query(default=20, ge=1, le=50, description="Nombre d'entrées dans le feed"),
    service: Annotated[LogService, Depends(get_log_service)] = ...,
) -> list[PublicLogResponse]:
    """Live feed public — dernières activités visibles par tous les visiteurs.
    Aucune authentification requise.

    Le frontend poll cette route toutes les X secondes pour afficher
    le défilement d'activité en temps réel.
    """
    return service.public_feed(limit=limit)


@router.post("/", response_model=ColonyLogResponse, status_code=status.HTTP_201_CREATED)
def create_log(
    payload: ColonyLogCreate,
    admin: Annotated[dict, Depends(require_admin)],
    service: Annotated[LogService, Depends(get_log_service)],
) -> ColonyLogResponse:
    """Crée une entrée de journal (saisie manuelle admin, incl. entrées « fun »).
    L'auteur enregistré est l'administrateur authentifié.
    """
    return service.add_log(user_id=admin["id"], action=payload.action)


@router.patch("/{log_id}", response_model=ColonyLogResponse)
def update_log(
    log_id: int,
    payload: ColonyLogUpdate,
    _: Annotated[dict, Depends(require_admin)],
    service: Annotated[LogService, Depends(get_log_service)],
) -> ColonyLogResponse:
    """Modifie le texte d'une entrée. Réservé aux administrateurs."""
    return service.update_log(log_id, payload.action)


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_log(
    log_id: int,
    _: Annotated[dict, Depends(require_admin)],
    service: Annotated[LogService, Depends(get_log_service)],
) -> None:
    """Supprime une entrée. Réservé aux administrateurs."""
    service.delete_log(log_id)