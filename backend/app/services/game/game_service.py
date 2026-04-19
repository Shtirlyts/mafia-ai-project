import asyncio

from app.services.game.engine import GamePhase, MafiaEngine, Player
from app.services.game.room_manager import GameMode, room_manager


class GameServiceError(Exception):
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        super().__init__(message)


async def start_game(
    room_code: str,
    actor_id: str,
) -> tuple[MafiaEngine, GamePhase]:
    if not room_manager.is_host(room_code, actor_id):
        raise GameServiceError(403, "Only host can start")

    lock = room_manager.get_room_lock(room_code)
    async with lock:
        engine = room_manager.get_engine(room_code)
        settings = room_manager.get_settings(room_code)
        if not engine or not settings:
            raise GameServiceError(404, "Room not found")

        if engine.current_phase != GamePhase.LOBBY:
            raise GameServiceError(400, "Game already started")

        human_players = [p for p in engine.players.values() if not p.is_ai]

        if settings.mode == GameMode.HUMANS_ONLY:
            if len(human_players) < 5:
                raise GameServiceError(400, "Not enough human players (min 5)")
        elif settings.mode == GameMode.MIXED:
            target_ai = (
                settings.ai_count
                if settings.ai_count is not None
                else max(0, 5 - len(human_players))
            )
            # Гарантируем минимум 5 игроков всего
            if len(human_players) + target_ai < 5:
                target_ai = 5 - len(human_players)
            current_ai = sum(1 for p in engine.players.values() if p.is_ai)
            needed_ai = max(0, target_ai - current_ai)

            existing_ids = set(engine.players.keys())
<<<<<<< Updated upstream
            next_idx = current_ai + 1
            created = 0
            while created < needed_ai:
                bot_id = f"bot_{next_idx}_{room_code}"
                bot_name = f"Bot_{next_idx}"
                next_idx += 1
                if bot_id in existing_ids:
                    continue
=======
            # Список случайных имен для AI игроков
            ai_names = [
                "Алексей", "Мария", "Иван", "Елена", "Дмитрий", "Ольга", "Сергей", "Анна",
                "Павел", "Наталья", "Михаил", "Татьяна", "Андрей", "Екатерина", "Николай", "Дарья"
            ]
            import random
            random.shuffle(ai_names)
            name_index = 0
            created = 0
            while created < needed_ai:
                bot_id = f"ai_{random.randint(1000, 9999)}_{room_code}"
                if bot_id in existing_ids:
                    continue
                bot_name = ai_names[name_index % len(ai_names)]
                name_index += 1
>>>>>>> Stashed changes
                engine.add_player(Player(bot_id, bot_name, is_ai=True))
                existing_ids.add(bot_id)
                created += 1

        elif settings.mode == GameMode.AI_ONLY:
            engine.players.clear()
            total_ai = max(5, settings.max_players)
<<<<<<< Updated upstream
            for i in range(total_ai):
                bot_id = f"bot_{i + 1}_{room_code}"
                bot_name = f"Bot_{i + 1}"
=======
            # Список случайных имен для AI игроков
            ai_names = [
                "Алексей", "Мария", "Иван", "Елена", "Дмитрий", "Ольга", "Сергей", "Анна",
                "Павел", "Наталья", "Михаил", "Татьяна", "Андрей", "Екатерина", "Николай", "Дарья"
            ]
            import random
            random.shuffle(ai_names)
            for i in range(total_ai):
                bot_id = f"ai_{random.randint(1000, 9999)}_{room_code}"
                bot_name = ai_names[i % len(ai_names)]
>>>>>>> Stashed changes
                engine.add_player(Player(bot_id, bot_name, is_ai=True))

        engine.configure_roles(
            len(engine.players),
            mafia_count=settings.mafia_count,
            detective=settings.detective,
            doctor=settings.doctor,
        )
        new_phase = engine.switch_phase()

        from app.api.v1.websockets import game_ws

        if room_code not in game_ws.room_tasks:
            task = asyncio.create_task(
                game_ws.run_game_loop(room_code, engine)
            )
            game_ws.room_tasks[room_code] = task

<<<<<<< Updated upstream
        return engine, new_phase
=======
        return engine, new_phase
>>>>>>> Stashed changes
