from app.services.ai.ai_service import GigaChatService
from app.services.game.engine import Role, GamePhase
import random

ai_service = GigaChatService()

class MafiaAIAgent:
    def __init__(self, player_id: str, name: str, role: Role):
        self.player_id = player_id
        self.name = name
        self.role = role

    def _get_system_prompt(self) -> str:
        """Формирует характер бота в зависимости от его роли"""
        base_prompt = f"Ты играешь в текстовую игру 'Мафия'. Твое имя: {self.name}. " \
                      f"Отвечай кратко, как живой человек в чате (1-2 предложения). Не пиши действия в звездочках. "
        
        if self.role == Role.MAFIA:
            return base_prompt + "Твоя роль: МАФИЯ. Твоя цель — убить всех мирных. В чате ты должен притворяться мирным жителем, отводить от себя подозрения и аккуратно обвинять других."
        elif self.role == Role.DETECTIVE:
            return base_prompt + "Твоя роль: КОМИССАР. Твоя цель — найти мафию. Ты можешь намекать, что знаешь правду, но не кричи о своей роли сразу, иначе мафия убьет тебя ночью."
        elif self.role == Role.DOCTOR:
            return base_prompt + "Твоя роль: ДОКТОР. Твоя цель — защищать мирных. Старайся вычислить логику мафии."
        else:
            return base_prompt + "Твоя роль: МИРНЫЙ ЖИТЕЛЬ. Твоя цель — вычислить мафию по их словам и поведению. Будь подозрительным."

    async def generate_chat_message(self, chat_history: str) -> str:
        """Генерация сообщения для дневного обсуждения"""
        system_prompt = self._get_system_prompt()
        prompt = f"Контекст чата:\n{chat_history}\n\nНапиши свое следующее сообщение в чат:"
        
        return await ai_service.get_response(prompt, system_prompt)

    async def make_night_action(self, alive_players: list[dict]) -> str:
        """Логика выбора цели ночью (для мафии, доктора, комиссара)"""
        # Исключаем себя из списка возможных целей
        targets = [p for p in alive_players if p['player_id'] != self.player_id]
        if not targets:
            return ""
            
        system_prompt = f"Ты играешь в 'Мафию'. Твоя роль: {self.role.value}. Сейчас НОЧЬ."
        prompt = f"Список живых игроков: {', '.join([p['name'] for p in targets])}. " \
                 f"Напиши ТОЛЬКО ИМЯ игрока, против которого ты применяешь свое ночное действие."
        
        response = await ai_service.get_response(prompt, system_prompt)
        
        # Простая эвристика: ищем имя в ответе (так как LLM может написать лишнего)
        for target in targets:
            if target['name'].lower() in response.lower():
                return target['player_id']

        return random.choice(targets)['player_id']