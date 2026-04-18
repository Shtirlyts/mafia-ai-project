import logging
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

    async def get_response(self, message_text: str, system_prompt: str = None) -> str:
        """Асинхронно получает ответ от GigaChat на сообщение пользователя."""
        if not self.client:
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
        
        try:
            # Используем асинхронный метод achat для неблокирующего вызова[reference:7]
            response: ChatCompletion = await self.client.achat(payload)
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Error while calling GigaChat API: {e}")
            # Здесь можно добавить более специфичную обработку ошибок
            raise RuntimeError(f"GigaChat request failed: {e}")