from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.dependencies import get_auth_service, get_current_user
from app.auth.schemas import (
    LoginPendingResponse,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    TokenResponse,
    Verify2FARequest,
)
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


@router.post("/login", response_model=LoginPendingResponse)
async def login(
    payload: LoginRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> LoginPendingResponse:
    """Connexion : vérifie email/mot de passe et envoie un code 2FA par email."""
    return auth_service.login(payload.email, payload.password)


@router.post("/verify-2fa", response_model=TokenResponse)
async def verify_2fa(
    payload: Verify2FARequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> TokenResponse:
    """Valide le code 2FA et retourne un JWT d'accès."""
    return auth_service.verify_2fa(payload.challenge_token, payload.code)


@router.post("/logout", response_model=MessageResponse)
async def logout(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security_scheme)],
    current_user: Annotated[dict, Depends(get_current_user)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> MessageResponse:
    """Déconnexion : invalide le token d'accès courant."""
    _ = current_user
    return auth_service.logout(credentials.credentials)
