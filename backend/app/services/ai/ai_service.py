import logging
import asyncio
from gigachat import GigaChat
from gigachat.models import Chat, Messages, ChatCompletion
from app.core.config import settings

logger = logging.getLogger(__name__)


class GigaChatService:
    """Сервис для взаимодействия с GigaChat API."""
    def __init__(self):
        self.client = None
        self._init_client()

    def _init_client(self):
        """Инициализирует клиент GigaChat с настройками из config."""
        try:
            self.client = GigaChat(
                credentials=settings.GIGACHAT_CREDENTIALS,
                scope=settings.GIGACHAT_SCOPE,
                model=settings.GIGACHAT_MODEL,
                verify_ssl_certs=settings.GIGACHAT_VERIFY_SSL_CERTS,
            )
            logger.info("GigaChat client successfully initialized.")
        except Exception as e:
            logger.error(f"Failed to initialize GigaChat client: {e}")
            self.client = None

    async def get_response(
        self,
        message_text: str,
        system_prompt: str = None,
    ) -> str:
        """Асинхронно получает ответ от GigaChat на сообщение пользователя."""
        if not self.client:
            if settings.GIGACHAT_FALLBACK_ENABLED:
                return self._fallback_response()
            raise ConnectionError("GigaChat client is not initialized.")

        # Подготавливаем список сообщений
        messages = []
        if system_prompt:
            messages.append(Messages(role="system", content=system_prompt))
        messages.append(Messages(role="user", content=message_text))

        # Формируем запрос
        payload = Chat(
            messages=messages,
            temperature=settings.GIGACHAT_TEMPERATURE,
            max_tokens=settings.GIGACHAT_MAX_TOKENS,
        )

        attempts = max(1, settings.GIGACHAT_MAX_RETRIES + 1)
        for attempt in range(1, attempts + 1):
            try:
                response: ChatCompletion = await asyncio.wait_for(
                    self.client.achat(payload),
                    timeout=settings.GIGACHAT_TIMEOUT_SECONDS,
                )
                content = response.choices[0].message.content
                if content:
                    return content
                raise RuntimeError("Empty response from GigaChat")
            except Exception as e:
                logger.warning(
                    "GigaChat request failed on attempt %s/%s: %s",
                    attempt,
                    attempts,
                    e,
                )
                if attempt < attempts:
                    await asyncio.sleep(settings.GIGACHAT_RETRY_DELAY_SECONDS)

        if settings.GIGACHAT_FALLBACK_ENABLED:
            logger.warning(
                "Using fallback AI response after all GigaChat retries."
            )
            return self._fallback_response()

        raise RuntimeError("GigaChat request failed after retries")

    @staticmethod
    def _fallback_response() -> str:
        return (
            "Давайте продолжим обсуждение. Пока недостаточно данных, "
            "но я присматриваюсь к поведению игроков."
        )
