from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    # Application
    app_env: str = "development"
    app_secret_key: str

    # Database
    database_url: str

    # JWT
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60

    # IntaSend
    intasend_publishable_key: str
    intasend_secret_key: str
    intasend_test_mode: bool = True

    # Payment
    registration_fee_kes: int = 100
    payment_redirect_url: str
    payment_webhook_secret: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    """Cached settings — reads .env once per process lifetime."""
    return Settings()
