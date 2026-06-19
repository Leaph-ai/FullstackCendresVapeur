import secrets
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta

import jwt
from fastapi import HTTPException, status

from app.auth.schemas import LoginResponse, MessageResponse, TokenResponse
from app.config import Settings
from app.security.jwt import create_2fa_challenge_token, create_access_token, decode_token
from app.security.password import hash_password, verify_password
from app.security.roles import RoleLevel
from app.services.mail import send_email


@dataclass
class UserRecord:
    id: int
    email: str
    password_hash: str
    role: str
    role_level: int
    is_active: bool = True


@dataclass
class TwoFactorCodeRecord:
    user_id: int
    code_hash: str
    expires_at: datetime
    used: bool = False


@dataclass
class AuthStore:
    users: dict[str, UserRecord] = field(default_factory=dict)
    two_factor_codes: dict[int, TwoFactorCodeRecord] = field(default_factory=dict)
    revoked_access_tokens: set[str] = field(default_factory=set)
    next_user_id: int = 1


_store = AuthStore(
    users={
        "admin@example.com": UserRecord(
            id=1,
            email="admin@example.com",
            password_hash=hash_password("Admin123!"),
            role="admin",
            role_level=RoleLevel.ADMIN,
        )
    },
    next_user_id=2,
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
            role_level=RoleLevel.USER,
        )
        _store.users[normalized_email] = user
        _store.next_user_id += 1
        return MessageResponse(message="Inscription réussie. Vous pouvez vous connecter.")

    def login(self, email: str, password: str) -> LoginResponse:
        user = self._authenticate_user(email, password)
        extra = {"email": user.email, "role": user.role, "role_level": user.role_level}

        if not self.settings.two_factor_enabled:
            return LoginResponse(
                message="Connexion réussie.",
                requires_2fa=False,
                access_token=create_access_token(str(user.id), self.settings, extra),
            )

        code = self._generate_2fa_code()
        self._store_2fa_code(user.id, code)
        self._send_2fa_email(user.email, code)

        return LoginResponse(
            message="Code de vérification envoyé par email.",
            requires_2fa=True,
            challenge_token=create_2fa_challenge_token(str(user.id), self.settings),
        )

    def verify_2fa(self, challenge_token: str, code: str) -> TokenResponse:
        if not self.settings.two_factor_enabled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La double authentification est désactivée.",
            )

        try:
            payload = decode_token(challenge_token, self.settings, expected_type="2fa_challenge")
        except jwt.PyJWTError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Jeton de vérification invalide ou expiré.",
            ) from exc

        user_id = int(payload["sub"])
        record = _store.two_factor_codes.get(user_id)

        if record is None or record.used or datetime.now(UTC) > record.expires_at:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Code invalide ou expiré.",
            )

        if not verify_password(code, record.code_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Code invalide ou expiré.",
            )

        record.used = True
        user = self._get_user_by_id(user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Utilisateur introuvable.",
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

    def _authenticate_user(self, email: str, password: str) -> UserRecord:
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

        return user

    def _get_user_by_id(self, user_id: int) -> UserRecord | None:
        for user in _store.users.values():
            if user.id == user_id:
                return user
        return None

    @staticmethod
    def _generate_2fa_code() -> str:
        return f"{secrets.randbelow(1_000_000):06d}"

    def _store_2fa_code(self, user_id: int, code: str) -> None:
        _store.two_factor_codes[user_id] = TwoFactorCodeRecord(
            user_id=user_id,
            code_hash=hash_password(code),
            expires_at=datetime.now(UTC) + timedelta(minutes=self.settings.two_factor_code_expire_minutes),
        )

    def _send_2fa_email(self, email: str, code: str) -> None:
        try:
            send_email(
                self.settings,
                to=email,
                subject="Code de vérification — Cendres & Vapeur",
                body=(
                    "Votre code de double authentification est : "
                    f"{code}\n\n"
                    f"Il expire dans {self.settings.two_factor_code_expire_minutes} minutes."
                ),
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Impossible d'envoyer le code de vérification par email.",
            ) from exc
