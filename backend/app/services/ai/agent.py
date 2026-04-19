# flake8: noqa
from app.services.ai.ai_service import GigaChatService
from app.services.ai.context_manager import context_manager, AgentContext
from app.services.game.engine import Role
from typing import Any, Optional
import random

ai_service = GigaChatService()

class MafiaAIAgent:
    def __init__(self, player_id: str, name: str, role: Role, room_code: str):
        self.player_id = player_id
        self.name = name
        self.role = role
        self.room_code = room_code
        self.context: Optional[AgentContext] = None
        self._ensure_context()
    
    def _ensure_context(self):
        """Создать или получить контекст агента."""
        self.context = context_manager.get_agent_context(self.room_code, self.player_id)
        if self.context is None:
            self.context = context_manager.create_agent_context(
                self.room_code, self.player_id, self.name, self.role
            )

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

    async def generate_chat_message(self) -> str:
        """Генерация сообщения для дневного обсуждения на основе контекста агента."""
        self._ensure_context()
        system_prompt = self._get_system_prompt()
        # Добавляем информацию о подозрениях, если есть
        suspicion_text = ""
        if self.context.suspicions:
            suspicion_lines = []
            for player_id, suspicion in self.context.suspicions.items():
                player_name = self.context.players_knowledge.get(player_id, {}).get("name", "unknown")
                suspicion_lines.append(f"{player_name}: {suspicion:.1f}")
            if suspicion_lines:
                suspicion_text = "\nТвои текущие подозрения (0 - мирный, 1 - мафия):\n" + "\n".join(suspicion_lines)
        
        chat_history = self.context.get_filtered_chat_history(include_night=False)
        prompt = f"Контекст чата:\n{chat_history}\n{suspicion_text}\n\nНапиши свое следующее сообщение в чат:"
        
        response = await ai_service.get_response(prompt, system_prompt)
        # Сохраняем своё сообщение в контекст
        self.context.add_message(self.name, response, "day")
        return response

    async def generate_night_chat_message(self) -> str:
        """Генерация сообщения для ночного чата мафии (координация)."""
        self._ensure_context()
        # Только мафия может видеть ночной чат
        if self.role != Role.MAFIA:
            return ""
        system_prompt = self._get_system_prompt() + " Сейчас НОЧЬ. Ты общаешься только со своей командой мафии. " \
                     "Обсудите, кого убить этой ночью. Будь кратким и конкретным."
        # Включаем ночные сообщения в историю
        chat_history = self.context.get_filtered_chat_history(include_night=True)
        # Добавляем информацию о подозрениях
        suspicion_text = ""
        if self.context.suspicions:
            suspicion_lines = []
            for player_id, suspicion in self.context.suspicions.items():
                player_name = self.context.players_knowledge.get(player_id, {}).get("name", "unknown")
                suspicion_lines.append(f"{player_name}: {suspicion:.1f}")
            if suspicion_lines:
                suspicion_text = "\nТвои подозрения (0 - мирный, 1 - мафия):\n" + "\n".join(suspicion_lines)
        
        prompt = f"Контекст ночного чата (видят только мафия):\n{chat_history}\n{suspicion_text}\n\n" \
                 f"Напиши сообщение для обсуждения с напарниками:"
        
        response = await ai_service.get_response(prompt, system_prompt)
        # Сохраняем сообщение в контекст с фазой "night"
        self.context.add_message(self.name, response, "night")
        return response

    async def make_night_action(self) -> str:
        """Логика выбора цели ночью (для мафии, доктора, комиссара) на основе контекста."""
        self._ensure_context()
        # Получаем публичную информацию об игроках из контекста
        players_info = self.context.get_public_player_info()
        # Исключаем себя и мертвых
        targets = [p for p in players_info if p['player_id'] != self.player_id and p['is_alive']]
        if not targets:
            return ""
        
        # Для мафии исключаем сокомандников (не убиваем своих)
        if self.role == Role.MAFIA:
            targets = [p for p in targets if p['player_id'] not in self.context.teammates]
        
        # Если после фильтрации не осталось целей, вернуть пустую строку (не должно происходить)
        if not targets:
            return ""
        
        # Формируем промпт с учетом подозрений
        suspicion_text = ""
        if self.context.suspicions:
            suspicion_lines = []
            for player_id, suspicion in self.context.suspicions.items():
                player = next((p for p in players_info if p['player_id'] == player_id), None)
                if player:
                    suspicion_lines.append(f"{player['name']}: {suspicion:.1f}")
            if suspicion_lines:
                suspicion_text = "\nТвои подозрения (0 - мирный, 1 - мафия):\n" + "\n".join(suspicion_lines)
        
        system_prompt = f"Ты играешь в 'Мафию'. Твоя роль: {self.role.value}. Сейчас НОЧЬ."
        prompt = f"Список живых игроков: {', '.join([p['name'] for p in targets])}. {suspicion_text}\n" \
                 f"Напиши ТОЛЬКО ИМЯ игрока, против которого ты применяешь свое ночное действие."
        
        response = await ai_service.get_response(prompt, system_prompt)
        
        # Ищем имя в ответе
        for target in targets:
            if target['name'].lower() in response.lower():
                return target['player_id']

        # Если не нашли, выбираем случайного из целей
        return random.choice(targets)['player_id']
    
    async def decide_vote(self) -> str:
        """Принять решение за кого голосовать (исключить) на основе подозрений."""
        self._ensure_context()
        players_info = self.context.get_public_player_info()
        # Исключаем себя и мертвых
        targets = [p for p in players_info if p['player_id'] != self.player_id and p['is_alive']]
        if not targets:
            return ""
        
        # Если есть подозрения, выбираем игрока с максимальным подозрением
        if self.context.suspicions:
            # Сортируем по подозрению (убывание)
            sorted_targets = sorted(targets, key=lambda p: self.context.suspicions.get(p['player_id'], 0.5), reverse=True)
            # Берем первого (наибольшее подозрение)
            return sorted_targets[0]['player_id']
        
        # Иначе случайный выбор
        return random.choice(targets)['player_id']
    
    def update_context_with_message(self, sender_name: str, text: str, phase: str):
        """Обновить контекст новым сообщением от другого игрока."""
        self._ensure_context()
        self.context.add_message(sender_name, text, phase)
        # Можно добавить логику обновления подозрений на основе сообщения
        # Пока просто сохраняем
    
    def update_context_with_game_state(self, engine):
        """Обновить контекст на основе состояния игры (вызывается извне)."""
        self._ensure_context()
        # Делегируем ContextManager
        context_manager.update_from_game_state(self.room_code, engine)