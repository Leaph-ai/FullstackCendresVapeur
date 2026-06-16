import re

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.auth.schemas import MessageResponse, TokenResponse
from app.config import Settings
from app.security.jwt import create_access_token
from app.security.password import hash_password, verify_password
from models.role import Role
from models.user import User

ROLE_LEVELS = {
    "Guest": 0,
    "User": 1,
    "Editor": 2,
    "Admin": 3,
}

DEFAULT_ROLE_NAME = "User"
_revoked_access_tokens: set[str] = set()


def _derive_username(email: str, db: Session) -> str:
    base = re.sub(r"[^a-z0-9_]", "_", email.split("@")[0].lower()) or "user"
    candidate = base
    suffix = 1
    while db.query(User).filter(User.username == candidate).first() is not None:
        candidate = f"{base}{suffix}"
        suffix += 1
    return candidate


class AuthService:
    def __init__(self, settings: Settings, db: Session) -> None:
        self.settings = settings
        self.db = db

    def register(self, email: str, password: str) -> MessageResponse:
        normalized_email = email.lower()
        if self.db.query(User).filter(User.email == normalized_email).first() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Un compte existe déjà avec cet email.",
            )

        role = self.db.query(Role).filter(Role.name == DEFAULT_ROLE_NAME).first()
        if role is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Rôle User introuvable en base. Exécutez db/seed.sql.",
            )

        user = User(
            username=_derive_username(normalized_email, self.db),
            email=normalized_email,
            password_hash=hash_password(password),
            role_id=role.id,
        )
        self.db.add(user)
        self.db.commit()
        return MessageResponse(message="Inscription réussie. Vous pouvez vous connecter.")

    def login(self, email: str, password: str) -> TokenResponse:
        normalized_email = email.lower()
        user = self.db.query(User).filter(User.email == normalized_email).first()

        if user is None or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou mot de passe incorrect.",
            )

        role_name = user.role.name if user.role else DEFAULT_ROLE_NAME
        extra = {
            "email": user.email,
            "role": role_name,
            "role_level": ROLE_LEVELS.get(role_name, 0),
        }
        return TokenResponse(
            access_token=create_access_token(str(user.id), self.settings, extra),
        )

    def logout(self, access_token: str) -> MessageResponse:
        _revoked_access_tokens.add(access_token)
        return MessageResponse(message="Déconnexion réussie.")

    def is_token_revoked(self, access_token: str) -> bool:
        return access_token in _revoked_access_tokens
