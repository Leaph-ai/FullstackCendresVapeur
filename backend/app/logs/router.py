from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.core.database import get_db

from .schemas import ColonyLogResponse, PublicLogResponse
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