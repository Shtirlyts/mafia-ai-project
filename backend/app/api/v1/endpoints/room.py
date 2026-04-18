from typing import Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.services.game.room_manager import GameMode, RoomSettings, room_manager
from app.services.game.engine import GamePhase, Player

router = APIRouter()

class CreateRoomRequest(BaseModel):
    player_name: str
    mode: GameMode = GameMode.MIXED
    max_players: int = 10
    ai_count: Optional[int] = None
    mafia_count: int = 1
    detective: bool = True
    doctor: bool = True

class CreateRoomResponse(BaseModel):
    room_code: str
    player_id: str

class JoinRoomRequest(BaseModel):
    room_code: str
    player_name: str

class JoinRoomResponse(BaseModel):
    player_id: str
    room_state: dict

class RoomStateResponse(BaseModel):
    phase: str
    players: list
    winner: str | None = None


@router.post("/create", response_model=CreateRoomResponse)
async def create_room(request: CreateRoomRequest):
    settings = RoomSettings(
        mode=request.mode,
        max_players=request.max_players,
        ai_count=request.ai_count,
        mafia_count=request.mafia_count,
        detective=request.detective,
        doctor=request.doctor
    )
    room_code, player_id, engine = room_manager.create_room(request.player_name, settings)
    # Применяем настройки ролей к движку
    engine.configure_roles(settings.mafia_count, settings.detective, settings.doctor)
    return CreateRoomResponse(room_code=room_code, player_id=player_id)


@router.post("/join", response_model=JoinRoomResponse)
async def join_room(request: JoinRoomRequest):
    result = room_manager.join_room(request.room_code, request.player_name)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Room not found or game already started"
        )
    player_id, engine = result
    # Возвращаем базовое состояние комнаты
    state = {
        "phase": engine.current_phase.value,
        "players": [p.to_dict() for p in engine.players.values()],
        "winner": None
    }
    return JoinRoomResponse(player_id=player_id, room_state=state)


@router.get("/{room_code}/state", response_model=RoomStateResponse)
async def get_room_state(room_code: str):
    engine = room_manager.get_engine(room_code)
    if not engine:
        raise HTTPException(status_code=404, detail="Room not found")
    return RoomStateResponse(
        phase=engine.current_phase.value,
        players=[p.to_dict() for p in engine.players.values()],
        winner=engine.get_winner() if engine.current_phase == GamePhase.GAME_OVER else None
    )


@router.post("/{room_code}/start")
async def start_game(room_code: str, player_id: str):
    if not room_manager.is_host(room_code, player_id):
        raise HTTPException(status_code=403, detail="Only host can start")
    
    engine = room_manager.get_engine(room_code)
    settings = room_manager.get_settings(room_code)
    if not engine or engine.current_phase != GamePhase.LOBBY:
        raise HTTPException(status_code=400, detail="Game already started or room not found")
    
    human_players = [p for p in engine.players.values() if not p.is_ai]
    
    if settings.mode == GameMode.HUMANS_ONLY:
        if len(human_players) < 5:
            raise HTTPException(status_code=400, detail="Not enough human players (min 5)")

    elif settings.mode == GameMode.MIXED:
        target_ai = settings.ai_count if settings.ai_count is not None else max(0, 5 - len(human_players))
        current_ai = sum(1 for p in engine.players.values() if p.is_ai)
        needed_ai = target_ai - current_ai
        for i in range(needed_ai):
            bot_id = f"bot_{i+1}_{room_code}"
            bot_name = f"Bot_{i+1}"
            engine.add_player(Player(bot_id, bot_name, is_ai=True))
    elif settings.mode == GameMode.AI_ONLY:
        engine.players.clear()
        total_ai = max(5, settings.max_players)  # Минимум 5
        for i in range(total_ai):
            bot_id = f"bot_{i+1}_{room_code}"
            bot_name = f"Bot_{i+1}"
            engine.add_player(Player(bot_id, bot_name, is_ai=True))
    
    engine.configure_roles(settings.mafia_count, settings.detective, settings.doctor)
    
    engine.switch_phase()
    
    from app.api.v1.websockets.game_ws import room_tasks, run_game_loop
    import asyncio
    if room_code not in room_tasks:
        task = asyncio.create_task(run_game_loop(room_code, engine))
        room_tasks[room_code] = task
    
    return {"status": "started", "phase": engine.current_phase.value}
