# flake8: noqa
# backend/app/services/game/engine.py
from enum import Enum
from datetime import datetime
from typing import Any, List, Dict, Optional
import random
from collections import Counter


class GamePhase(Enum):
    LOBBY = "lobby"
    NIGHT = "night"
    DAY = "day"
    VOTING = "voting"
    GAME_OVER = "game_over"


class Role(Enum):
    CITIZEN = "citizen"
    MAFIA = "mafia"
    DETECTIVE = "detective"
    DOCTOR = "doctor"


class Player:
    def __init__(self, player_id: str, name: str, is_ai: bool = False):
        self.player_id = player_id
        self.name = name
        self.is_ai = is_ai
        self.role: Optional[Role] = None
        self.is_alive = True
        self.last_will = ""
        self.last_saved_self = False  # True, если доктор лечил себя в прошлую ночь

    def assign_role(self, role: Role):
        self.role = role

    def to_dict(self) -> dict[str, Any]:
        base = {
            "player_id": self.player_id,
            "name": self.name,
            "is_alive": self.is_alive
        }
        if hasattr(self, '_reveal_all') and self._reveal_all:
            base.update({
                "role": self.role.value if self.role else None,
                "is_ai": self.is_ai
            })
        else:
            base["role"] = self.role.value if self.role else None
        return base


class MafiaEngine:
    def __init__(self):
        self.current_phase = GamePhase.LOBBY
        self.players: Dict[str, Player] = {}
        self.mafia_group: List[Player] = []
        self.detective: Optional[Player] = None
        self.doctor: Optional[Player] = None
        self.role_config = {
            "mafia_count": 1,
            "has_detective": True,
            "has_doctor": True,
        }

        # Чаты
        self.day_chat: list[dict] = []
        self.night_chat: list[dict] = []

        # Ночные действия: мафия голосует (словарь voter_id -> target_id)
        self.mafia_votes: Dict[str, str] = {}
        # Остальные действия одиночные
        self.night_actions = {
            "detective_check": None,   # { "target_id": str, "result": bool }
            "doctor_save": None        # str (player_id)
        }
        # Результат голосования мафии после подсчёта
        self.mafia_kill_target: Optional[str] = None

        # Дневное голосование всех живых
        self.votes: Dict[str, str] = {}          # voter_id -> target_id
        self.vote_results: Dict[str, int] = {}   # target_id -> count
        self.eliminated_player: Optional[Player] = None

        self.start_time = datetime.now()
        self.game_log: list[str] = []

    def add_player(self, player: Player):
        self.players[player.player_id] = player

    def remove_player(self, player_id: str):
        if player_id in self.players:
            del self.players[player_id]

    def _auto_mafia_count(self, player_count: int) -> int:
        if player_count <= 6:
            return 1
        if player_count <= 10:
            return 2
        if player_count <= 14:
            return 3
        return 4

    def configure_roles(
        self,
        player_count: int,
        mafia_count: Optional[int] = None,
        detective: Optional[bool] = None,
        doctor: Optional[bool] = None,
    ):
        self.role_config = {
            "mafia_count": max(1, mafia_count if mafia_count is not None else self._auto_mafia_count(player_count)),
            "has_detective": player_count >= 5 if detective is None else detective,
            "has_doctor": player_count >= 6 if doctor is None else doctor,
        }

    def assign_roles(self):
        """Распределение ролей среди живых игроков."""
        alive_players = [p for p in self.players.values() if p.is_alive]
        if not alive_players:
            return

        # Сбрасываем предыдущие назначения перед новой игрой.
        self.mafia_group = []
        self.detective = None
        self.doctor = None

        for p in self.players.values():
            p.role = None

        mafia_count = self.role_config["mafia_count"]
        max_mafia = max(1, len(alive_players) // 2)
        mafia_count = min(mafia_count, max_mafia)

        random.shuffle(alive_players)

        # Назначаем мафию
        for i in range(mafia_count):
            if i < len(alive_players):
                alive_players[i].assign_role(Role.MAFIA)
                self.mafia_group.append(alive_players[i])

        # Назначаем комиссара
        detective_idx = mafia_count
        if self.role_config["has_detective"] and detective_idx < len(alive_players):
            alive_players[detective_idx].assign_role(Role.DETECTIVE)
            self.detective = alive_players[detective_idx]

        # Назначаем доктора
        doctor_idx = detective_idx + (1 if self.detective else 0)
        if self.role_config["has_doctor"] and doctor_idx < len(alive_players):
            alive_players[doctor_idx].assign_role(Role.DOCTOR)
            self.doctor = alive_players[doctor_idx]

        # Остальные — мирные жители
        start_citizen_idx = doctor_idx + (1 if self.doctor else 0)
        for i in range(start_citizen_idx, len(alive_players)):
            alive_players[i].assign_role(Role.CITIZEN)

    def switch_phase(self) -> GamePhase:
        """Логика переключения фаз игры."""
        if self.current_phase == GamePhase.LOBBY:
            if len(self.players) < 1:
                return self.current_phase
            self.current_phase = GamePhase.NIGHT
            self.assign_roles()

        elif self.current_phase == GamePhase.NIGHT:
            # Применяем ночные действия перед днём
            self._resolve_mafia_vote()
            self.apply_night_actions()
            self.current_phase = GamePhase.DAY
            # Сбрасываем временные данные ночи
            self.clear_night_actions()

        elif self.current_phase == GamePhase.DAY:
            self.current_phase = GamePhase.VOTING
            self.votes.clear()
            self.vote_results.clear()

        elif self.current_phase == GamePhase.VOTING:
            self.resolve_voting()
            if self.check_game_over():
                self.current_phase = GamePhase.GAME_OVER
            else:
                self.current_phase = GamePhase.NIGHT
                # Сбрасываем голосование
                self.votes.clear()
                self.vote_results.clear()
                self.eliminated_player = None

        return self.current_phase

    def clear_night_actions(self):
        """Сброс всех ночных действий для нового раунда."""
        self.mafia_votes.clear()
        self.night_actions = {
            "detective_check": None,
            "doctor_save": None
        }
        self.mafia_kill_target = None

    # Ночные действия

    def submit_mafia_vote(self, voter_id: str, target_id: str) -> bool:
        voter = self.players.get(voter_id)
        if (self.current_phase == GamePhase.NIGHT and
                voter and voter.is_alive and voter.role == Role.MAFIA):
            self.mafia_votes[voter_id] = target_id
            return True
        return False

    def _resolve_mafia_vote(self):
        if not self.mafia_votes:
            return

        # Подсчёт голосов по целям
        target_counts = Counter(self.mafia_votes.values())
        max_votes = max(target_counts.values())
        candidates = [tid for tid, cnt in target_counts.items()
                      if cnt == max_votes]

        # Выбираем случайного из лидеров
        self.mafia_kill_target = random.choice(candidates)

    def submit_detective_check(self, player_id: str, target_id: str) -> Optional[bool]:
        if (self.current_phase == GamePhase.NIGHT and
            self.detective and player_id == self.detective.player_id and
                self.detective.is_alive):
            target = self.players.get(target_id)
            if target and target.is_alive:
                is_mafia = (target.role == Role.MAFIA)
                self.night_actions["detective_check"] = {
                    "target_id": target_id,
                    "is_mafia": is_mafia
                }
                return is_mafia
        return None

    def submit_doctor_save(self, player_id: str, target_id: str) -> bool:
        if (self.current_phase == GamePhase.NIGHT and
            self.doctor and player_id == self.doctor.player_id and
                self.doctor.is_alive):
            target = self.players.get(target_id)
            if not target or not target.is_alive:
                return False
            # Проверка на самолечение подряд
            if target_id == self.doctor.player_id and self.doctor.last_saved_self:
                return False
            self.night_actions["doctor_save"] = target_id
            return True
        return False

    def apply_night_actions(self):

        kill_target = self.mafia_kill_target
        doctor_save = self.night_actions["doctor_save"]

        # Обработка убийства
        if kill_target and self.players[kill_target].is_alive:
            if doctor_save != kill_target:
                self.players[kill_target].is_alive = False
                # Удаляем из группы мафии, если это был мафиози
                killed_player = self.players[kill_target]
                if killed_player in self.mafia_group:
                    self.mafia_group.remove(killed_player)

        # Обновляем флаг самолечения доктора
        if self.doctor and self.doctor.is_alive:
            self.doctor.last_saved_self = (
                doctor_save == self.doctor.player_id)

    def add_night_message(self, sender_id: str, sender_name: str, text: str):
        """Добавить сообщение в ночной чат."""
        self.night_chat.append({
            "sender_id": sender_id,
            "sender_name": sender_name,
            "text": text,
            "timestamp": datetime.now().isoformat()
        })
    
    # Голосование днём
    def submit_vote(self, voter_id: str, target_id: str) -> bool:
        """Голосование на дневном голосовании."""
        voter = self.players.get(voter_id)
        target = self.players.get(target_id)
        if (self.current_phase == GamePhase.VOTING and
            voter and voter.is_alive and
                target and target.is_alive):
            self.votes[voter_id] = target_id
            return True
        return False

    def resolve_voting(self):
        """Подсчёт голосов и выбывание игрока."""
        self.vote_results.clear()
        for target_id in self.votes.values():
            self.vote_results[target_id] = self.vote_results.get(
                target_id, 0) + 1

        if self.vote_results:
            # Находим цель с максимальным числом голосов
            max_votes = max(self.vote_results.values())
            candidates = [tid for tid,
                          cnt in self.vote_results.items() if cnt == max_votes]
            eliminated_id = random.choice(candidates)

            self.eliminated_player = self.players[eliminated_id]
            self.eliminated_player.is_alive = False
            if self.eliminated_player in self.mafia_group:
                self.mafia_group.remove(self.eliminated_player)

    # Проверка завершения игры
    def check_game_over(self) -> bool:
        """Проверка условий победы."""
        alive = [p for p in self.players.values() if p.is_alive]
        alive_mafia = [p for p in alive if p.role == Role.MAFIA]
        alive_citizens = [p for p in alive if p.role in (
            Role.CITIZEN, Role.DETECTIVE, Role.DOCTOR)]

        if len(alive_mafia) >= len(alive_citizens):
            return True
        if not alive_mafia:
            return True
        return False

    def get_winner(self) -> str:
        """Возвращает 'mafia' или 'citizens'."""
        alive_mafia = [p for p in self.players.values(
        ) if p.is_alive and p.role == Role.MAFIA]
        return "mafia" if alive_mafia else "citizens"

    def to_dict(self):
        return {
            "phase": self.current_phase.value,
            "players": {pid: p.to_dict() for pid, p in self.players.items()},
            "votes": self.votes,
            "vote_results": self.vote_results,
            "eliminated_player": self.eliminated_player.to_dict() if self.eliminated_player else None,
            "winner": self.get_winner() if self.current_phase == GamePhase.GAME_OVER else None,
            "day_chat": self.day_chat,
            "night_chat": self.night_chat
        }


game_engine = MafiaEngine()
