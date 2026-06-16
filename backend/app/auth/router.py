from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.dependencies import get_auth_service, get_current_user
from app.auth.schemas import LoginRequest, MessageResponse, RegisterRequest, TokenResponse
from app.auth.service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])
security_scheme = HTTPBearer()


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> MessageResponse:
    """Inscription d'un nouvel utilisateur (rôle user par défaut)."""
    return auth_service.register(payload.email, payload.password)


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> TokenResponse:
    """Connexion : vérifie email/mot de passe et retourne un JWT."""
    return auth_service.login(payload.email, payload.password)


@router.post("/logout", response_model=MessageResponse)
async def logout(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security_scheme)],
    current_user: Annotated[dict, Depends(get_current_user)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> MessageResponse:
    """Déconnexion : invalide le token d'accès courant."""
    _ = current_user
    return auth_service.logout(credentials.credentials)
