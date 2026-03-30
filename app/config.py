from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl
from typing import List

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', extra="ignore")

    APP_ENV: str = "dev"
    DATABASE_URL: str = "sqlite:///./app.db"

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 8
    JWT_REFRESH_DAYS: int = 7

    APP_CORS_ORIGINS: str = "http://localhost:5173,https://slot-time.vercel.app"

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.APP_CORS_ORIGINS.split(",") if o.strip()]

settings = Settings()
