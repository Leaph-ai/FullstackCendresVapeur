from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: Literal["dev", "prod"] = "dev"
    database_url: str = "postgresql+psycopg://cendres:cendres@localhost:5432/cendres_vapeur"
    jwt_secret: str = "changez-moi-en-production"
    jwt_algorithm: str = "HS256"
    jwt_access_expire_minutes: int = 30
    jwt_refresh_expire_days: int = 7
    allowed_origins: str = "http://localhost:5173"
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "noreply@zone-franche.local"
    contact_admin_email: str = ""
    two_factor_code_expire_minutes: int = 10
    copper_base_index: float = 248.0
    copper_min_index: float = 180.0
    copper_max_index: float = 320.0
    copper_tick_seconds: float = 3.0
    copper_spark_length: int = 14
    copper_volatility: float = 6.0

    # OAuth – Google
    google_client_id: str = ""
    google_client_secret: str = ""
    backend_base_url: str = "http://localhost:8000"   # redirect_uri envoyé à Google
    oauth_redirect_base_url: str = "http://localhost:5173"  # frontend, cible après callback

    @property
    def two_factor_enabled(self) -> bool:
        return self.app_env == "prod"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
