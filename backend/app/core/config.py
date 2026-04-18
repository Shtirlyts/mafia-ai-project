# backend/app/core/config.py
from pydantic_settings import BaseSettings
from pydantic import ConfigDict


class Settings(BaseSettings):
    # ... другие настройки вашего проекта ...
    SECRET_KEY: str = "change-me-in-env"

    # Настройки GigaChat
    GIGACHAT_CREDENTIALS: str = ""  # Ваш ключ API
    GIGACHAT_SCOPE: str = "GIGACHAT_API_PERS"
    GIGACHAT_MODEL: str = "GigaChat-2"
    GIGACHAT_VERIFY_SSL_CERTS: bool = False
    GIGACHAT_TEMPERATURE: float = 0.7  # Уровень "креативности" ответов
    GIGACHAT_MAX_TOKENS: int = 300  # Максимальная длина ответа в токенах
    GIGACHAT_TIMEOUT_SECONDS: float = 20.0
    GIGACHAT_MAX_RETRIES: int = 2
    GIGACHAT_RETRY_DELAY_SECONDS: float = 0.75
    GIGACHAT_FALLBACK_ENABLED: bool = True

    model_config = ConfigDict(env_file=".env", extra="ignore")


settings = Settings()
