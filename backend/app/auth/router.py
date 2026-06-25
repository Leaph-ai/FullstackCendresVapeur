from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.dependencies import get_auth_service, get_current_user
from app.auth.schemas import (
    LoginRequest,
    LoginResponse,
    MessageResponse,
    OAuthRedirectResponse,
    RegisterRequest,
    TokenResponse,
    Verify2FARequest,
)
from app.auth.service import AuthService
from app.config import Settings, get_settings
from app.security.rbac import RoleLevel, require_role

router = APIRouter(prefix="/auth", tags=["auth"])
security_scheme = HTTPBearer()


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> MessageResponse:
    """Inscription d'un nouvel utilisateur (rôle user par défaut)."""
    return auth_service.register(payload.email, payload.password)


@router.post("/login", response_model=LoginResponse)
async def login(
    payload: LoginRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> LoginResponse:
    """Connexion : en prod, envoie un code 2FA ; en dev, retourne directement un JWT."""
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


@router.get("/me")
async def me(
    current_user: Annotated[dict, Depends(get_current_user)],
) -> dict:
    """Profil de l'utilisateur courant (accessible à tout compte authentifié)."""
    return current_user


@router.get(
    "/admin/ping",
    dependencies=[Depends(require_role(RoleLevel.ADMIN))],
)
async def admin_ping() -> MessageResponse:
    """ réservée aux comptes de niveau Administrateur.

    Pattern à réutiliser dans les autres routeurs :
        dependencies=[Depends(require_role(RoleLevel.EDITOR))]
    pour exiger Éditeur ou plus, etc.
    """
    return MessageResponse(message="pong (accès admin confirmé).")


# ── OAuth ─────────────────────────────────────────────────────────────────────────────


@router.get("/google", response_model=OAuthRedirectResponse)
async def google_login(
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> OAuthRedirectResponse:
    """Retourne l’URL du consent screen Google.
    Le frontend redirige l’utilisateur vers cette URL.
    """
    return OAuthRedirectResponse(authorization_url=auth_service.get_google_authorization_url())


@router.get("/google/callback")
async def google_callback(
    code: Annotated[str, Query()],
    state: Annotated[str, Query()],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> RedirectResponse:
    """Callback Google : échange le code, crée/retrouve l’user,
    puis redirige vers le frontend avec le JWT en query param.
    """
    token_response = auth_service.handle_google_callback(code, state)
    redirect_url = (
        f"{settings.oauth_redirect_base_url}/auth/callback"
        f"?token={token_response.access_token}"
    )
    return RedirectResponse(url=redirect_url, status_code=status.HTTP_302_FOUND)