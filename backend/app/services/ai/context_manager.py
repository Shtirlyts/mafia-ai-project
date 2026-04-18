# Контекстный менеджер для AI-агентов
# Управляет индивидуальными контекстами агентов, изолируя их знания
from typing import Dict, List, Any, Optional
from app.services.game.engine import Role, Player as GamePlayer
import json


class AgentContext:
    """Контекст отдельного агента."""
    
    def __init__(self, agent_id: str, agent_name: str, role: Role):
        self.agent_id = agent_id
        self.agent_name = agent_name
        self.role = role
        
        # История сообщений, которые агент видел (отфильтрованная)
        self.message_history: List[Dict[str, Any]] = []  # каждый элемент: {"sender": name, "text": str, "phase": "day/night"}
        
        # Знание о других игроках: словарь player_id -> { "name": str, "is_alive": bool, "suspicion": float }
        self.players_knowledge: Dict[str, Dict[str, Any]] = {}
        
        # Результаты ночных действий (если агент комиссар или доктор)
        self.night_action_results: List[Dict[str, Any]] = []
        
        # Знание о сокомандниках (для мафии)
        self.teammates: List[str] = []
        
        # Внутренние подозрения (вероятность того, что игрок мафия) 0..1
        self.suspicions: Dict[str, float] = {}
        
        # Флаги видимости ночного чата (только для мафии)
        self.can_see_night_chat = (role == Role.MAFIA)
        
        # Индексы последних обработанных сообщений для синхронизации
        self.last_day_index = 0
        self.last_night_index = 0
        
    def add_message(self, sender_name: str, text: str, phase: str):
        """Добавить сообщение в историю."""
        self.message_history.append({
            "sender": sender_name,
            "text": text,
            "phase": phase
        })
        # Ограничим размер истории, чтобы не росла бесконечно
        if len(self.message_history) > 50:
            self.message_history.pop(0)
    
    def update_player_knowledge(self, player_id: str, name: str, is_alive: bool):
        """Обновить информацию об игроке."""
        if player_id not in self.players_knowledge:
            self.players_knowledge[player_id] = {"name": name, "is_alive": is_alive, "suspicion": 0.5}
        else:
            self.players_knowledge[player_id]["name"] = name
            self.players_knowledge[player_id]["is_alive"] = is_alive
    
    def set_suspicion(self, player_id: str, value: float):
        """Установить уровень подозрения (0 - точно мирный, 1 - точно мафия)."""
        if player_id in self.players_knowledge:
            self.players_knowledge[player_id]["suspicion"] = max(0.0, min(1.0, value))
        self.suspicions[player_id] = value
    
    def get_filtered_chat_history(self, include_night: bool = False) -> str:
        """Возвращает отфильтрованную историю чата в виде строки для промпта."""
        lines = []
        for msg in self.message_history:
            if msg["phase"] == "night" and not (self.can_see_night_chat and include_night):
                continue
            lines.append(f"{msg['sender']}: {msg['text']}")
        return "\n".join(lines[-20:])  # последние 20 сообщений
    
    def get_public_player_info(self) -> List[Dict[str, Any]]:
        """Возвращает публичную информацию об игроках (без ролей и AI)."""
        info = []
        for player_id, data in self.players_knowledge.items():
            info.append({
                "player_id": player_id,
                "name": data["name"],
                "is_alive": data["is_alive"],
                "suspicion": data.get("suspicion", 0.5)
            })
        return info


class ContextManager:
    """Менеджер контекстов всех агентов в игре."""
    
    def __init__(self):
        # room_code -> { agent_id: AgentContext }
        self.room_contexts: Dict[str, Dict[str, AgentContext]] = {}
    
    def create_agent_context(self, room_code: str, agent_id: str, agent_name: str, role: Role) -> AgentContext:
        """Создать контекст для агента в комнате."""
        if room_code not in self.room_contexts:
            self.room_contexts[room_code] = {}
        
        context = AgentContext(agent_id, agent_name, role)
        self.room_contexts[room_code][agent_id] = context
        return context
    
    def get_agent_context(self, room_code: str, agent_id: str) -> Optional[AgentContext]:
        """Получить контекст агента."""
        if room_code not in self.room_contexts:
            return None
        return self.room_contexts[room_code].get(agent_id)
    
    def remove_agent_context(self, room_code: str, agent_id: str):
        """Удалить контекст агента (при выходе из игры)."""
        if room_code in self.room_contexts and agent_id in self.room_contexts[room_code]:
            del self.room_contexts[room_code][agent_id]
    
    def clear_room(self, room_code: str):
        """Очистить все контексты комнаты (при завершении игры)."""
        if room_code in self.room_contexts:
            del self.room_contexts[room_code]
    
    def sync_filtered_chat_history(self, room_code: str, engine):
        """Синхронизировать историю чата для всех агентов с фильтрацией по ролям."""
        if room_code not in self.room_contexts:
            return
        
        for agent_id, context in self.room_contexts[room_code].items():
            # Дневные сообщения видят все
            for i in range(context.last_day_index, len(engine.day_chat)):
                msg = engine.day_chat[i]
                context.add_message(msg['sender_name'], msg['text'], 'day')
            context.last_day_index = len(engine.day_chat)
            
            # Ночные сообщения видят только мафия
            if context.can_see_night_chat:
                for i in range(context.last_night_index, len(engine.night_chat)):
                    msg = engine.night_chat[i]
                    context.add_message(msg['sender_name'], msg['text'], 'night')
                context.last_night_index = len(engine.night_chat)
    
    def update_from_game_state(self, room_code: str, engine):
        """Обновить контексты всех агентов на основе текущего состояния игры."""
        if room_code not in self.room_contexts:
            return
        
        for agent_id, context in self.room_contexts[room_code].items():
            # Обновляем знания об игроках
            for player in engine.players.values():
                context.update_player_knowledge(
                    player.player_id,
                    player.name,
                    player.is_alive
                )
            
            # Если агент мафия, обновляем список сокомандников
            if context.role == Role.MAFIA:
                teammates = [p.player_id for p in engine.mafia_group if p.player_id != agent_id and p.is_alive]
                context.teammates = teammates


# Глобальный экземпляр менеджера контекстов
context_manager = ContextManager()