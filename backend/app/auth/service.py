import secrets
from datetime import UTC, datetime, timedelta

import jwt
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.auth.schemas import LoginResponse, MessageResponse, TokenResponse
from app.config import Settings
from app.errors.codes import ErrorCode
from app.errors.exceptions import AppError
from app.security.jwt import create_2fa_challenge_token, create_access_token, decode_token
from app.security.password import hash_password, verify_password
from app.security.roles import RoleLevel
from app.services.mail import send_email
from models.colony_log import ColonyLog
from models.two_factor_code import TwoFactorCode
from models.user import User

# Révocation de tokens (en mémoire — pas de table dédiée en DB)
_revoked_tokens: set[str] = set()

# Role IDs (correspondent au seed DB : 1=Guest, 2=User, 3=Editor, 4=Admin)
_ROLE_ID_USER = 2
_ROLE_ID_ADMIN = 4


class AuthService:
    def __init__(self, settings: Settings, db: Session) -> None:
        self.settings = settings
        self.db = db

    def register(self, email: str, password: str) -> MessageResponse:
        normalized_email = email.lower()

        existing = self.db.query(User).filter(User.email == normalized_email).first()
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Un compte existe déjà avec cet email.",
            )

        # Dérive un username unique à partir de l'email
        base_username = normalized_email.split("@")[0]
        username = base_username
        suffix = 1
        while self.db.query(User).filter(User.username == username).first() is not None:
            username = f"{base_username}{suffix}"
            suffix += 1

        user = User(
            username=username,
            email=normalized_email,
            password_hash=hash_password(password),
            role_id=_ROLE_ID_USER,
        )
        self.db.add(user)
        self.db.commit()
        self._log(user.id, f"Nouvel arrivant accrédité — {user.username}")
        return MessageResponse(message="Inscription réussie. Vous pouvez vous connecter.")

    def login(self, email: str, password: str) -> LoginResponse:
        user = self._authenticate_user(email, password)
        role_name = user.role.name if user.role else "user"
        role_level = self._role_level(role_name)
        extra = {"email": user.email, "role": role_name.lower(), "role_level": role_level}

        if not self.settings.two_factor_enabled:
            self._log(user.id, f"Connexion accréditée — {user.username}")
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
        record = (
            self.db.query(TwoFactorCode)
            .filter(
                TwoFactorCode.user_id == user_id,
                TwoFactorCode.used.is_(False),
                TwoFactorCode.expires_at > datetime.now(UTC).replace(tzinfo=None),
            )
            .order_by(TwoFactorCode.expires_at.desc())
            .first()
        )

        if record is None or not verify_password(code, record.code_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Code invalide ou expiré.",
            )

        record.used = True
        self.db.commit()

        user = self.db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Utilisateur introuvable.",
            )

        role_name = user.role.name if user.role else "user"
        role_level = self._role_level(role_name)
        extra = {"email": user.email, "role": role_name.lower(), "role_level": role_level}
        self._log(user.id, f"Double sceau validé — {user.username}")
        return TokenResponse(
            access_token=create_access_token(str(user.id), self.settings, extra),
        )

    def logout(self, access_token: str) -> MessageResponse:
        _revoked_tokens.add(access_token)
        try:
            payload = decode_token(access_token, self.settings, expected_type="access")
            user = self.db.query(User).filter(User.id == int(payload["sub"])).first()
            if user is not None:
                self._log(user.id, f"Sas de sortie franchi — {user.username}")
        except Exception:
            pass
        return MessageResponse(message="Déconnexion réussie.")

    def is_token_revoked(self, access_token: str) -> bool:
        return access_token in _revoked_tokens

    # ── helpers ──────────────────────────────────────────────────────────────

    def _authenticate_user(self, email: str, password: str) -> User:
        user = self.db.query(User).filter(User.email == email.lower()).first()
        if user is None or not verify_password(password, user.password_hash):
            self._log(user.id if user else None, "Tentative d'accès refusée")
            raise AppError.unauthorized(
                ErrorCode.INVALID_CREDENTIALS, "Email ou mot de passe incorrect."
            )
        return user

    def _log(self, user_id: int | None, action: str) -> None:
        """Consigne un événement dans le journal des survivants (best-effort)."""
        try:
            self.db.add(ColonyLog(user_id=user_id, action=action))
            self.db.commit()
        except Exception:
            self.db.rollback()

    @staticmethod
    def _generate_2fa_code() -> str:
        return f"{secrets.randbelow(1_000_000):06d}"

    def _store_2fa_code(self, user_id: int, code: str) -> None:
        record = TwoFactorCode(
            user_id=user_id,
            code_hash=hash_password(code),
            expires_at=datetime.now(UTC).replace(tzinfo=None)
            + timedelta(minutes=self.settings.two_factor_code_expire_minutes),
        )
        self.db.add(record)
        self.db.commit()

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

    @staticmethod
    def _role_level(role_name: str) -> int:
        mapping = {
            "guest": RoleLevel.GUEST,
            "user": RoleLevel.USER,
            "editor": RoleLevel.EDITOR,
            "admin": RoleLevel.ADMIN,
        }
        return mapping.get(role_name.lower(), RoleLevel.USER)



