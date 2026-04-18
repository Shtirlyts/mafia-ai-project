# State Machine: смена фаз (Night/Day)
from enum import Enum
from datetime import datetime

class GamePhase(Enum):
    LOBBY = "lobby"
    NIGHT = "night"
    DAY = "day"
    VOTING = "voting"
    GAME_OVER = "game_over"

class MafiaEngine:
    def __init__(self):
        self.current_phase = GamePhase.LOBBY
        self.players = []
        self.start_time = datetime.now()

    def switch_phase(self) -> GamePhase:
        """Логика переключения фаз игры"""
        if self.current_phase == GamePhase.LOBBY:
            self.current_phase = GamePhase.NIGHT
        elif self.current_phase == GamePhase.NIGHT:
            self.current_phase = GamePhase.DAY
        elif self.current_phase == GamePhase.DAY:
            self.current_phase = GamePhase.VOTING
        elif self.current_phase == GamePhase.VOTING:
            # После голосования снова наступает ночь (пока не пропишем условия победы)
            self.current_phase = GamePhase.NIGHT
            
        return self.current_phase

# Для тестов создаем глобальный инстанс движка
game_engine = MafiaEngine()