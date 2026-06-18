from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+psycopg://cendres:cendres@localhost:5432/cendres_vapeur"
    jwt_secret: str = "changez-moi-en-production"
    jwt_algorithm: str = "HS256"
    jwt_access_expire_minutes: int = 30
    jwt_refresh_expire_days: int = 7
    allowed_origins: str = "http://localhost:5173"
    smtp_from: str = "noreply@zone-franche.local"
<<<<<<< HEAD
    mailtrap_api_token: str = ""
    mailtrap_use_sandbox: bool = True
    mailtrap_inbox_id: str = ""
    two_factor_code_expire_minutes: int = 10
=======
>>>>>>> 5188e43 (feat(auth): implement user authentication service with registration, login, and token management)

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
