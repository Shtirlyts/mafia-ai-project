# flake8: noqa
# backend/app/api/v1/websockets/game_ws.py
import asyncio
from datetime import datetime
import json
from typing import Any, Dict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from app.services.game.engine import MafiaEngine, GamePhase, Role, Player
from app.services.ai.agent import MafiaAIAgent
from app.services.game.room_manager import room_manager, GameMode
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Таймеры для комнат (для возможности отмены при завершении игры)
room_tasks: Dict[str, asyncio.Task[None]] = {}

JSONDict = dict[str, Any]


class ConnectionManager:
    """Управляет WebSocket соединениями в комнатах."""

    def __init__(self):
        # room_code -> {player_id: websocket}
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}

    async def connect(self, room_code: str, client_id: str, websocket: WebSocket):
        await websocket.accept()
        if room_code not in self.active_connections:
            self.active_connections[room_code] = {}
        self.active_connections[room_code][client_id] = websocket
        logger.info(f"Client {client_id} connected to room {room_code}")

    def disconnect(self, room_code: str, client_id: str):
        if room_code in self.active_connections:
            if client_id in self.active_connections[room_code]:
                del self.active_connections[room_code][client_id]
            if not self.active_connections[room_code]:
                del self.active_connections[room_code]
        logger.info(f"Client {client_id} disconnected from room {room_code}")

    async def broadcast(self, room_code: str, message: JSONDict) -> None:
        """Отправить сообщение всем подключённым в комнате."""
        if room_code in self.active_connections:
            disconnected: list[str] = []
            for client_id, ws in self.active_connections[room_code].items():
                try:
                    await ws.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending to {client_id}: {e}")
                    disconnected.append(client_id)
            for cid in disconnected:
                self.disconnect(room_code, cid)

    async def send_personal(
        self,
        message: JSONDict,
        room_code: str,
        client_id: str,
    ) -> None:
        """Отправить сообщение конкретному клиенту."""
        if room_code in self.active_connections and client_id in self.active_connections[room_code]:
            ws = self.active_connections[room_code][client_id]
            try:
                await ws.send_json(message)
            except Exception as e:
                logger.error(f"Error sending personal to {client_id}: {e}")
                self.disconnect(room_code, client_id)


manager = ConnectionManager()


def get_public_game_state(
    engine: MafiaEngine,
    client_id: str,
    is_observer: bool = False,
) -> JSONDict:
    show_all_roles = is_observer or (engine.current_phase == GamePhase.GAME_OVER)
    show_eliminated_role = (
        engine.eliminated_player and 
        engine.current_phase in (GamePhase.DAY, GamePhase.VOTING)
    )

    players: list[JSONDict] = []
    for p in engine.players.values():
        player_dict: JSONDict = p.to_dict()
        if not show_all_roles and p.player_id != client_id:
            player_dict["role"] = "unknown"
        if not show_all_roles:
            player_dict["is_ai"] = None

        players.append(player_dict)
    if show_eliminated_role and engine.eliminated_player:
        for player_data in players:
            if player_data["player_id"] == engine.eliminated_player.player_id:
                player_data["role"] = engine.eliminated_player.role.value
                break  # Роль убийцы раскрывать не нужно

    player = engine.players.get(client_id)
    is_mafia = player and player.is_alive and player.role == Role.MAFIA

    visible_day_chat = (
        engine.day_chat 
        if engine.current_phase in (GamePhase.DAY, GamePhase.VOTING) 
        else []
    )
    visible_night_chat = (
        engine.night_chat 
        if is_mafia and engine.current_phase == GamePhase.NIGHT 
        else []
    )

    return {
        "phase": engine.current_phase.value,
        "players": players,
        "winner": engine.get_winner() if engine.current_phase == GamePhase.GAME_OVER else None,
        "eliminated_player": engine.eliminated_player.player_id if engine.eliminated_player else None,
        "vote_results": engine.vote_results,
        "day_chat": visible_day_chat,
        "night_chat": visible_night_chat,
    }

async def send_mafia_teammates(room_code: str, engine: MafiaEngine):
    """Отправляет каждому мафиози список его сокомандников."""
    mafia_ids = [p.player_id for p in engine.mafia_group if p.is_alive]
    for mafia in engine.mafia_group:
        await manager.send_personal({
            "type": "mafia_teammates",
            "teammates": [pid for pid in mafia_ids if pid != mafia.player_id]
        }, room_code, mafia.player_id)


async def run_game_loop(room_code: str, engine: MafiaEngine) -> None:
    """Фоновый цикл игры: переключение фаз по таймеру."""
    try:
        while engine.current_phase != GamePhase.GAME_OVER:
            phase_durations = {
                GamePhase.NIGHT: 20,
                GamePhase.DAY: 60,
                GamePhase.VOTING: 30,
                GamePhase.LOBBY: 0,
                GamePhase.GAME_OVER: 0
            }
            duration = phase_durations.get(engine.current_phase, 0)
            if duration > 0:
                await manager.broadcast(room_code, {
                    "type": "phase_change",
                    "phase": engine.current_phase.value,
                    "duration": duration
                })
                await asyncio.sleep(duration)

            new_phase = engine.switch_phase()

            if new_phase == GamePhase.NIGHT:
                await process_ai_night_actions(room_code, engine)
                # После выполнения действий AI, возможно, кто-то ещё живые игроки должны сделать ход,
                # но у нас таймер уже идёт, поэтому просто рассылаем состояние
            elif new_phase == GamePhase.DAY:
                await process_ai_day_messages(room_code, engine)
            elif new_phase == GamePhase.GAME_OVER:
                await broadcast_full_state(room_code, engine)
                break
            else:
                await broadcast_full_state(room_code, engine)

    except asyncio.CancelledError:
        logger.info(f"Game loop for room {room_code} cancelled")
    except Exception as e:
        logger.error(f"Error in game loop for room {room_code}: {e}")
    finally:
        if room_code in room_tasks:
            del room_tasks[room_code]


async def process_ai_night_actions(room_code: str, engine: MafiaEngine) -> None:
    """AI-агенты выполняют ночные действия."""
    alive_players: list[JSONDict] = [
        p.to_dict() for p in engine.players.values() if p.is_alive
    ]
    for player in engine.players.values():
        if player.is_ai and player.is_alive:
            if player.role is None:
                continue
            agent = MafiaAIAgent(player.player_id, player.name, player.role)
            target_id = await agent.make_night_action(alive_players)
            if target_id:
                if player.role == Role.MAFIA:
                    engine.submit_mafia_vote(player.player_id, target_id)
                elif player.role == Role.DETECTIVE:
                    result = engine.submit_detective_check(
                        player.player_id, target_id)
                    if result is not None:
                        await manager.send_personal({
                            "type": "detective_result",
                            "target_id": target_id,
                            "is_mafia": result
                        }, room_code, player.player_id)
                elif player.role == Role.DOCTOR:
                    engine.submit_doctor_save(player.player_id, target_id)


async def process_ai_day_messages(room_code: str, engine: MafiaEngine) -> None:
    """Генерация дневных сообщений от AI."""
    chat_history = "\n".join([f"{log}" for log in engine.game_log[-20:]])
    for player in engine.players.values():
        if player.is_ai and player.is_alive:
            if player.role is None:
                continue
            agent = MafiaAIAgent(player.player_id, player.name, player.role)
            message_text = await agent.generate_chat_message(chat_history)
            engine.game_log.append(f"{player.name}: {message_text}")
            await manager.broadcast(room_code, {
                "type": "chat",
                "sender_id": player.player_id,
                "sender_name": player.name,
                "text": message_text,
                "phase": engine.current_phase.value
            })
            await asyncio.sleep(2)


async def broadcast_full_state(room_code: str, engine: MafiaEngine) -> None:
    """Рассылает каждому клиенту его персональное состояние игры."""
    # Получаем список всех подключённых клиентов
    clients = manager.active_connections.get(room_code, {})
    for client_id in clients.keys():
        # Определяем, является ли клиент наблюдателем
        is_observer = (room_manager.observers.get(room_code) == client_id)
        state = get_public_game_state(engine, client_id, is_observer)
        await manager.send_personal({
            "type": "state_update",
            "data": state
        }, room_code, client_id)


@router.websocket("/ws/{room_code}/{client_id}")
async def websocket_endpoint(websocket: WebSocket, room_code: str, client_id: str):
    # Проверяем существование комнаты
    if room_code not in room_manager.rooms:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Room not found")
        return

    engine = room_manager.get_engine(room_code)
    if engine is None:
        await websocket.close(
            code=status.WS_1008_POLICY_VIOLATION,
            reason="Room engine not found",
        )
        return

    # Определяем, является ли клиент наблюдателем (хост в режиме AI_ONLY)
    is_observer = (room_manager.observers.get(room_code) == client_id)

    # Проверяем права: либо это игрок в комнате, либо наблюдатель
    if client_id not in engine.players and not is_observer:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Not a player or observer")
        return

    await manager.connect(room_code, client_id, websocket)

    try:
        # Отправляем начальное состояние
        state = get_public_game_state(engine, client_id, is_observer)
        await websocket.send_json({
            "type": "state_update",
            "data": state
        })

        # Если клиент — мафия, отправляем список сокомандников
        player = engine.players.get(client_id)
        if player and player.role == Role.MAFIA and player.is_alive:
            mafia_ids = [p.player_id for p in engine.mafia_group if p.is_alive]
            await websocket.send_json({
                "type": "mafia_teammates",
                "teammates": [pid for pid in mafia_ids if pid != client_id]
            })

        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                msg_type = message.get("type")

                # Наблюдатели не могут отправлять игровые действия
                if is_observer and msg_type not in ("get_state", "ping"):
                    await websocket.send_json({"type": "error", "message": "Observers cannot perform actions"})
                    continue

                # Игроки могут действовать только если живы и их роль позволяет
                player = engine.players.get(client_id)
                if not player or not player.is_alive:
                    if msg_type not in ("get_state", "chat"):
                        await websocket.send_json({"type": "error", "message": "You are dead or not a player"})
                        continue

                if msg_type == "chat":
                    text = message.get("text", "").strip()
                    if (
                        text
                        and player is not None
                        and player.is_alive
                        and engine.current_phase in (GamePhase.DAY, GamePhase.VOTING)
                    ):
                        engine.game_log.append(f"{player.name}: {text}")
                        await manager.broadcast(room_code, {
                            "type": "chat",
                            "sender_id": client_id,
                            "sender_name": player.name,
                            "text": text,
                            "phase": engine.current_phase.value
                        })

                elif msg_type == "vote":
                    target_id = message.get("target_id")
                    if target_id and engine.current_phase == GamePhase.VOTING:
                        if engine.submit_vote(client_id, target_id):
                            await manager.broadcast(room_code, {
                                "type": "vote_cast",
                                "voter_id": client_id,
                                "target_id": target_id
                            })
                            # Проверяем, все ли живые проголосовали
                            alive_count = sum(
                                1 for p in engine.players.values() if p.is_alive)
                            if len(engine.votes) >= alive_count:
                                if room_code in room_tasks:
                                    room_tasks[room_code].cancel()
                elif msg_type == "night_chat":
                    text = message.get("text", "").strip()
                    if (
                        text
                        and player is not None
                        and player.is_alive
                        and player.role == Role.MAFIA
                        and engine.current_phase == GamePhase.NIGHT
                    ):
                        engine.add_night_message(client_id, player.name, text)
                        await manager.broadcast(room_code, {
                            "type": "night_chat",
                            "sender_id": client_id,
                            "sender_name": player.name,
                            "text": text,
                            "timestamp": datetime.now().isoformat()
                        })
                elif msg_type == "night_action":
                    action = message.get("action")
                    target_id = message.get("target_id")
                    if (
                        target_id
                        and player is not None
                        and player.is_alive
                        and engine.current_phase == GamePhase.NIGHT
                    ):
                        if action == "kill" and player.role == Role.MAFIA:
                            engine.submit_mafia_vote(client_id, target_id)
                        elif action == "check" and player.role == Role.DETECTIVE:
                            result = engine.submit_detective_check(
                                client_id, target_id)
                            if result is not None:
                                await websocket.send_json({
                                    "type": "detective_result",
                                    "target_id": target_id,
                                    "is_mafia": result
                                })
                        elif action == "save" and player.role == Role.DOCTOR:
                            success = engine.submit_doctor_save(
                                client_id, target_id)
                            if not success:
                                await websocket.send_json({
                                    "type": "error",
                                    "message": "Cannot save yourself twice in a row"
                                })

                elif msg_type == "start_game":
                    # Только хост (и не наблюдатель? Хост может быть наблюдателем в AI_ONLY)
                    if room_manager.is_host(room_code, client_id):
                        if engine.current_phase == GamePhase.LOBBY:
                            # Проверяем режим и добавляем AI при необходимости (дублируем логику из REST, но оставим)
                            settings = room_manager.get_settings(room_code)
                            if settings is None:
                                await websocket.send_json({"type": "error", "message": "Room settings not found"})
                                continue
                            human_players = [
                                p for p in engine.players.values() if not p.is_ai]

                            if settings.mode == GameMode.HUMANS_ONLY and len(human_players) < 5:
                                await websocket.send_json({"type": "error", "message": "Need at least 5 human players"})
                                continue
                            elif settings.mode == GameMode.MIXED:
                                target_ai = settings.ai_count if settings.ai_count is not None else max(
                                    0, 5 - len(human_players))
                                current_ai = sum(
                                    1 for p in engine.players.values() if p.is_ai)
                                needed_ai = target_ai - current_ai
                                for i in range(needed_ai):
                                    bot_id = f"bot_{i+1}_{room_code}"
                                    bot_name = f"Bot_{i+1}"
                                    engine.add_player(
                                        Player(bot_id, bot_name, is_ai=True))
                            elif settings.mode == GameMode.AI_ONLY:
                                engine.players.clear()
                                total_ai = max(5, settings.max_players)
                                for i in range(total_ai):
                                    bot_id = f"bot_{i+1}_{room_code}"
                                    bot_name = f"Bot_{i+1}"
                                    engine.add_player(
                                        Player(bot_id, bot_name, is_ai=True))

                            engine.configure_roles(len(engine.players))
                            engine.switch_phase()

                            if room_code not in room_tasks:
                                task = asyncio.create_task(
                                    run_game_loop(room_code, engine))
                                room_tasks[room_code] = task

                            await process_ai_night_actions(room_code, engine)
                            await broadcast_full_state(room_code, engine)
                            await send_mafia_teammates(room_code, engine)
                    else:
                        await websocket.send_json({"type": "error", "message": "Only host can start the game"})

                elif msg_type == "get_state":
                    state = get_public_game_state(
                        engine, client_id, is_observer)
                    await websocket.send_json({
                        "type": "state_update",
                        "data": state
                    })

            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "message": "Invalid JSON"})
            except Exception as e:
                logger.error(f"Error processing message: {e}")
                await websocket.send_json({"type": "error", "message": str(e)})

    except WebSocketDisconnect:
        manager.disconnect(room_code, client_id)
        # Если все отключились, можно отменить таймер
        if room_code in manager.active_connections and not manager.active_connections[room_code]:
            if room_code in room_tasks:
                room_tasks[room_code].cancel()
