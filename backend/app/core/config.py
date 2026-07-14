from pydantic_settings import BaseSettings
from functools import lru_cache
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class Settings(BaseSettings):
    APP_NAME: str = "T-Shirt Central 365"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    DATABASE_URL: str = f"sqlite+aiosqlite:///{os.path.join(BASE_DIR, 'tshirtcentral365.db')}"
    REDIS_URL: str = "redis://localhost:6379"

    SECRET_KEY: str = ""
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    ALGORITHM: str = "HS256"

    SQUARE_APPLICATION_ID: str = ""
    SQUARE_ACCESS_TOKEN: str = ""
    SQUARE_LOCATION_ID: str = ""
    SQUARE_ENVIRONMENT: str = "sandbox"
    SQUARE_WEBHOOK_SIGNATURE_KEY: str = ""

    PRINTIFY_API_TOKEN: str = ""
    PRINTIFY_SHOP_ID: str = ""
    PRINTIFY_WEBHOOK_SECRET: str = ""

    WIX_APP_ID: str = ""
    WIX_APP_SECRET: str = ""
    WIX_API_TOKEN: str = ""
    WIX_ACCOUNT_ID: str = ""

    GOOGLE_CLIENT_ID: str = ""

    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    S3_BUCKET: str = "tshirtcentral365-assets"
    S3_REGION: str = "us-east-1"

    CORS_ORIGINS: list[str] = [
        "http://localhost:3000", "http://localhost:3001",
        "http://localhost:3002", "http://localhost:3003",
        "http://localhost:3005",
        "https://www.tshirtcentral365.com",
        "https://tshirtcentral365.com",
        "https://api.tshirtcentral365.com",
    ]

    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
