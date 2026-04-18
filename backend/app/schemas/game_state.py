# Схема текущего состояния игры для фронта
from pydantic import BaseModel, Field
from typing import List, Optional
from app.services.game.engine import GamePhase


class PlayerSchema(BaseModel):
    player_id: str
    name: str
    role: Optional[str] = None
    is_alive: bool = True
    is_ai: Optional[bool] = None


class GameStateSchema(BaseModel):
    phase: GamePhase
    players: List[PlayerSchema]
    winner: Optional[str] = None
    eliminated_player: Optional[str] = None
    vote_results: dict[str, int] = Field(default_factory=dict)


class ChatMessageSchema(BaseModel):
    sender_id: str
    sender_name: str
    text: str
    phase: GamePhase
