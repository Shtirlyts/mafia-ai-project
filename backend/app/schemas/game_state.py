# Схема текущего состояния игры для фронта
from pydantic import BaseModel
from typing import List, Optional
from app.services.game.engine import GamePhase

class PlayerSchema(BaseModel):
    id: str
    name: str
    role: Optional[str] = "citizen"  # citizen, mafia, detective, doc.
    is_alive: bool = True
    is_ai: bool = False

class GameStateSchema(BaseModel):
    current_phase: GamePhase
    players: List[PlayerSchema]
    winner: Optional[str] = None

class ChatMessageSchema(BaseModel):
    sender_id: str
    sender_name: str
    text: str
    phase: GamePhase