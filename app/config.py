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

    APP_CORS_ORIGINS: str = "http://localhost:5173,https://slot-time.vercel.app,https://volunteer-shed-girlfriend-app.trycloudflare.com"

    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    POWER_AUTOMATE_URL: str = "https://default5fe04b4b7f7347cd93a86c5d873fb2.77.environment.api.powerplatform.com/powerautomate/automations/direct/workflows/418f33bf51b3467ca2ee018cb1f87c68/triggers/manual/paths/invoke?api-version=1"

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.APP_CORS_ORIGINS.split(",") if o.strip()]

settings = Settings()
