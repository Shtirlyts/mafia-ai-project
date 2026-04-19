from typing import Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.schemas.game_state import PlayerSchema
from app.services.game.room_manager import GameMode, RoomSettings, room_manager
from app.services.game.engine import GamePhase, MafiaEngine
from app.services.game.game_service import (
    GameServiceError,
    start_game as start_game_service,
)

router = APIRouter()


def _serialize_players(engine: MafiaEngine) -> list[PlayerSchema]:
    players = engine.players.values()
    return [PlayerSchema.model_validate(p.to_dict(reveal_role=False, reveal_ai=False)) for p in players]


class CreateRoomRequest(BaseModel):
    player_name: str
    mode: GameMode = GameMode.MIXED
    max_players: int = 10
    ai_count: Optional[int] = None
    mafia_count: int = 1
    detective: bool = True
    doctor: bool = True
    night_duration_seconds: int = 20
    day_duration_seconds: int = 60
    voting_duration_seconds: int = 30


class CreateRoomResponse(BaseModel):
    room_code: str
    player_id: str


class RoomStateResponse(BaseModel):
    phase: str
    players: list[PlayerSchema]
    winner: str | None = None


class JoinRoomRequest(BaseModel):
    room_code: str
    player_name: str


class JoinRoomResponse(BaseModel):
    player_id: str
    room_state: RoomStateResponse


class UpdateRoomSettingsRequest(BaseModel):
    mode: Optional[GameMode] = None
    max_players: Optional[int] = None
    ai_count: Optional[int] = None
    mafia_count: Optional[int] = None
    detective: Optional[bool] = None
    doctor: Optional[bool] = None
    night_duration_seconds: Optional[int] = None
    day_duration_seconds: Optional[int] = None
    voting_duration_seconds: Optional[int] = None


@router.post("/create", response_model=CreateRoomResponse)
async def create_room(request: CreateRoomRequest) -> CreateRoomResponse:
    settings = RoomSettings(
        mode=request.mode,
        max_players=request.max_players,
        ai_count=request.ai_count,
        mafia_count=request.mafia_count,
        detective=request.detective,
        doctor=request.doctor,
        night_duration_seconds=request.night_duration_seconds,
        day_duration_seconds=request.day_duration_seconds,
        voting_duration_seconds=request.voting_duration_seconds,
    )
    room_code, player_id, engine = room_manager.create_room(
        request.player_name,
        settings,
    )
    return CreateRoomResponse(room_code=room_code, player_id=player_id)


@router.post("/join", response_model=JoinRoomResponse)
async def join_room(request: JoinRoomRequest) -> JoinRoomResponse:
    result = room_manager.join_room(request.room_code, request.player_name)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Room not found or game already started",
        )
    player_id, engine = result
    # Возвращаем базовое состояние комнаты
    state = RoomStateResponse(
        phase=engine.current_phase.value,
        players=_serialize_players(engine),
        winner=None,
    )
    return JoinRoomResponse(player_id=player_id, room_state=state)


@router.get("/{room_code}/state", response_model=RoomStateResponse)
async def get_room_state(room_code: str) -> RoomStateResponse:
    engine = room_manager.get_engine(room_code)
    if not engine:
        raise HTTPException(status_code=404, detail="Room not found")
    return RoomStateResponse(
        phase=engine.current_phase.value,
        players=_serialize_players(engine),
        winner=(
            engine.get_winner()
            if engine.current_phase == GamePhase.GAME_OVER
            else None
        ),
    )


@router.patch("/{room_code}/settings")
async def update_room_settings(
    room_code: str,
    player_id: str,
    request: UpdateRoomSettingsRequest,
) -> dict[str, str]:
    """Обновить настройки комнаты (только хост)."""
    if not room_manager.is_host(room_code, player_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only host can update settings",
        )
    engine = room_manager.get_engine(room_code)
    settings = room_manager.get_settings(room_code)
    if not engine or not settings:
        raise HTTPException(status_code=404, detail="Room not found")
    if engine.current_phase != GamePhase.LOBBY:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update settings after game started",
        )
    # Обновляем только переданные поля
    update_data = request.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(settings, key, value)
    # Сохраняем обновленные настройки
    room_manager.settings[room_code] = settings
    return {"status": "settings updated"}


@router.post("/{room_code}/start")
async def start_game(room_code: str, player_id: str) -> dict[str, str]:
    try:
        engine, phase = await start_game_service(room_code, player_id)
    except GameServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message) from e

    return {"status": "started", "phase": phase.value}