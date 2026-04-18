from enum import Enum
import secrets
from typing import Dict, Optional
import asyncio
from pydantic import BaseModel

from .engine import GamePhase, MafiaEngine, Player


class GameMode(str, Enum):
    HUMANS_ONLY = "humans_only"      # Только люди
    MIXED = "mixed"                  # Люди + ИИ
    AI_ONLY = "ai_only"              # Только ИИ (хост - наблюдатель)


class RoomSettings(BaseModel):
    mode: GameMode = GameMode.MIXED
    max_players: int = 10            # Максимальное число игроков (включая ИИ)
    ai_count: Optional[int] = None   # Фиксированное число ИИ (для mixed)
    mafia_count: int = 1
    detective: bool = True
    doctor: bool = True
    night_duration_seconds: int = 20
    day_duration_seconds: int = 60
    voting_duration_seconds: int = 30


class RoomManager:
    def __init__(self):
        self.rooms: Dict[str, MafiaEngine] = {}
        self.settings: Dict[str, RoomSettings] = {}
        self.hosts: Dict[str, str] = {}
        self.observers: Dict[str, str] = {}
        self.room_locks: Dict[str, asyncio.Lock] = {}

    def create_room(
        self,
        host_name: str,
        settings: RoomSettings,
    ) -> tuple[str, str, MafiaEngine]:
        room_code = secrets.token_hex(3).upper()
        engine = MafiaEngine()
        host_id = secrets.token_hex(8)

        # В режиме AI_ONLY хост не игрок, а наблюдатель
        if settings.mode == GameMode.AI_ONLY:
            self.observers[room_code] = host_id
            # Хост не добавляется в игроки
        else:
            host = Player(host_id, host_name, is_ai=False)
            engine.add_player(host)

        self.rooms[room_code] = engine
        self.settings[room_code] = settings
        self.hosts[room_code] = host_id
        self.room_locks[room_code] = asyncio.Lock()
        return room_code, host_id, engine

    def join_room(
        self,
        room_code: str,
        player_name: str,
    ) -> Optional[tuple[str, MafiaEngine]]:
        engine = self.rooms.get(room_code)
        settings = self.settings.get(room_code)
        if (
            not engine
            or not settings
            or engine.current_phase != GamePhase.LOBBY
        ):
            return None
        if settings.mode == GameMode.AI_ONLY:
            return None
        human_count = sum(1 for p in engine.players.values() if not p.is_ai)
        max_humans = (
            settings.max_players
            if settings.mode == GameMode.HUMANS_ONLY
            else (settings.max_players - (settings.ai_count or 0))
        )
        if human_count >= max_humans:
            return None
        player_id = secrets.token_hex(8)
        player = Player(player_id, player_name, is_ai=False)
        engine.add_player(player)
        return player_id, engine

    def get_settings(self, room_code: str) -> Optional[RoomSettings]:
        return self.settings.get(room_code)

    def is_host(self, room_code: str, player_id: str) -> bool:
        return self.hosts.get(room_code) == player_id

    def get_engine(self, room_code: str) -> Optional[MafiaEngine]:
        return self.rooms.get(room_code)

    def get_room_lock(self, room_code: str) -> asyncio.Lock:
        lock = self.room_locks.get(room_code)
        if lock is None:
            lock = asyncio.Lock()
            self.room_locks[room_code] = lock
        return lock


# Глобальный экземпляр менеджера комнат — его мы будем импортировать
room_manager = RoomManager()
