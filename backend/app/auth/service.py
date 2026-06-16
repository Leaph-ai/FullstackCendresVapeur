from dataclasses import dataclass, field

from fastapi import HTTPException, status

from app.auth.schemas import MessageResponse, TokenResponse
from app.config import Settings
from app.security.jwt import create_access_token
from app.security.password import hash_password, verify_password


@dataclass
class UserRecord:
    id: int
    email: str
    password_hash: str
    role: str
    role_level: int
    is_active: bool = True


@dataclass
class AuthStore:
    users: dict[str, UserRecord] = field(default_factory=dict)
    revoked_access_tokens: set[str] = field(default_factory=set)
    next_user_id: int = 1


_store = AuthStore(
    users={
        "admin@example.com": UserRecord(
            id=1,
            email="admin@example.com",
            password_hash=hash_password("Admin123!"),
            role="admin",
            role_level=3,
        )
    }
)


class AuthService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def register(self, email: str, password: str) -> MessageResponse:
        normalized_email = email.lower()
        if normalized_email in _store.users:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Un compte existe déjà avec cet email.",
            )

        user = UserRecord(
            id=_store.next_user_id,
            email=normalized_email,
            password_hash=hash_password(password),
            role="user",
            role_level=0,
        )
        _store.users[normalized_email] = user
        _store.next_user_id += 1
        return MessageResponse(message="Inscription réussie. Vous pouvez vous connecter.")

    def login(self, email: str, password: str) -> TokenResponse:
        normalized_email = email.lower()
        user = _store.users.get(normalized_email)

        if user is None or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou mot de passe incorrect.",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Compte désactivé.",
            )

        extra = {"email": user.email, "role": user.role, "role_level": user.role_level}
        return TokenResponse(
            access_token=create_access_token(str(user.id), self.settings, extra),
        )

    def logout(self, access_token: str) -> MessageResponse:
        _store.revoked_access_tokens.add(access_token)
        return MessageResponse(message="Déconnexion réussie.")

    def is_token_revoked(self, access_token: str) -> bool:
        return access_token in _store.revoked_access_tokens
