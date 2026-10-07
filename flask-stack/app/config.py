"""
Application configuration using Pydantic Settings
Environment-based configuration management
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings"""

    # Database
    DATABASE_URL: str = "postgresql://social_user:social_pass_2026@localhost:5432/social_audit"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 10

    # Security
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    SESSION_COOKIE_SECURE: bool = False  # Set to True when served over HTTPS

    # Application
    FLASK_DEBUG: bool = False
    SQL_ECHO: bool = False
    PAGE_SIZE: int = 20

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
