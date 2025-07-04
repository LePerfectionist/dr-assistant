from pydantic import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./dr_app.db"  # Relative path to DB file
    DEBUG: bool = True

settings = Settings()
