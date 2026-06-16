from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth.service import AuthService
from app.config import Settings, get_settings
from app.security.jwt import decode_token

security_scheme = HTTPBearer(auto_error=False)


def get_auth_service(settings: Annotated[Settings, Depends(get_settings)]) -> AuthService:
    return AuthService(settings)


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security_scheme)],
    settings: Annotated[Settings, Depends(get_settings)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> dict:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentification requise.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if auth_service.is_token_revoked(credentials.credentials):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token révoqué.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_token(credentials.credentials, settings, expected_type="access")
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    return {
        "id": int(payload["sub"]),
        "email": payload.get("email"),
        "role": payload.get("role"),
        "role_level": payload.get("role_level", 0),
    }
