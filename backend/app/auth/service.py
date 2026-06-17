import re
import secrets
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.auth.schemas import LoginPendingResponse, MessageResponse, TokenResponse
from app.config import Settings
from app.security.jwt import create_2fa_challenge_token, create_access_token, decode_token
from app.security.password import hash_password, verify_password
from app.services.mail import send_email
from models.role import Role
from models.two_factor_code import TwoFactorCode
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


def _generate_2fa_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def _utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def _build_token_response(user: User, settings: Settings) -> TokenResponse:
    role_name = user.role.name if user.role else DEFAULT_ROLE_NAME
    extra = {
        "email": user.email,
        "role": role_name,
        "role_level": ROLE_LEVELS.get(role_name, 0),
    }
    return TokenResponse(
        access_token=create_access_token(str(user.id), settings, extra),
    )


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

    def login(self, email: str, password: str) -> LoginPendingResponse:
        normalized_email = email.lower()
        user = self.db.query(User).filter(User.email == normalized_email).first()

        if user is None or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou mot de passe incorrect.",
            )

        code = _generate_2fa_code()
        expires_at = _utcnow() + timedelta(minutes=self.settings.two_factor_code_expire_minutes)

        self.db.query(TwoFactorCode).filter(
            TwoFactorCode.user_id == user.id,
            TwoFactorCode.used.is_(False),
        ).update({"used": True})

        self.db.add(
            TwoFactorCode(
                user_id=user.id,
                code_hash=hash_password(code),
                expires_at=expires_at,
            )
        )
        self.db.commit()

        try:
            send_email(
                self.settings,
                to=user.email,
                subject="Votre code de vérification — Cendres et Vapeur",
                body=(
                    f"Votre code de vérification : {code}\n\n"
                    f"Ce code expire dans {self.settings.two_factor_code_expire_minutes} minutes.\n"
                    "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email."
                ),
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Impossible d'envoyer le code de vérification.",
            ) from exc

        return LoginPendingResponse(
            message="Un code de vérification a été envoyé à votre adresse email.",
            challenge_token=create_2fa_challenge_token(str(user.id), self.settings),
        )

    def verify_2fa(self, challenge_token: str, code: str) -> TokenResponse:
        try:
            payload = decode_token(challenge_token, self.settings, expected_type="2fa_challenge")
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session de vérification invalide ou expirée.",
            ) from exc

        user_id = int(payload["sub"])
        user = self.db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session de vérification invalide ou expirée.",
            )

        now = _utcnow()
        pending_codes = (
            self.db.query(TwoFactorCode)
            .filter(
                TwoFactorCode.user_id == user_id,
                TwoFactorCode.used.is_(False),
                TwoFactorCode.expires_at > now,
            )
            .order_by(TwoFactorCode.id.desc())
            .all()
        )

        matched_code = next(
            (entry for entry in pending_codes if verify_password(code, entry.code_hash)),
            None,
        )
        if matched_code is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Code de vérification invalide ou expiré.",
            )

        matched_code.used = True
        self.db.commit()
        return _build_token_response(user, self.settings)

    def logout(self, access_token: str) -> MessageResponse:
        _revoked_access_tokens.add(access_token)
        return MessageResponse(message="Déconnexion réussie.")

    def is_token_revoked(self, access_token: str) -> bool:
        return access_token in _revoked_access_tokens
