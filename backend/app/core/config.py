# backend/app/core/config.py
from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    # ... другие настройки вашего проекта ...
    
    # Настройки GigaChat
    GIGACHAT_CREDENTIALS: str = ""  # Ваш ключ API
    GIGACHAT_SCOPE: str = "GIGACHAT_API_PERS"
    GIGACHAT_MODEL: str = "GigaChat-2"
    GIGACHAT_VERIFY_SSL_CERTS: bool = False  # Временно отключаем проверку сертификатов (только для разработки!)[reference:6]
    GIGACHAT_TEMPERATURE: float = 0.7  # Уровень "креативности" ответов
    GIGACHAT_MAX_TOKENS: int = 300  # Максимальная длина ответа в токенах

    model_config = ConfigDict(env_file=".env", extra="ignore")

settings = Settings()