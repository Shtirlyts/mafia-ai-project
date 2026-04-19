#!/usr/bin/env python3
"""Интеграционный тест создания комнаты и старта игры."""
import asyncio
import sys
sys.path.insert(0, '.')

from app.services.game.room_manager import room_manager, RoomSettings, GameMode
from app.services.game.engine import GamePhase

async def test_room_creation():
    """Тест создания комнаты, добавления игроков и старта игры."""
    print("[TEST] Создание комнаты...")
    settings = RoomSettings(
        mode=GameMode.MIXED,
        max_players=8,
        ai_count=3,
        mafia_count=1,
        detective=True,
        doctor=True,
        night_duration_seconds=20,
        day_duration_seconds=60,
        voting_duration_seconds=60,
        individual_duration_seconds=30
    )
    room_code, host_id, engine = room_manager.create_room(
        host_name="Тестовый Хост",
        settings=settings
    )
    print(f"[OK] Комната создана: {room_code}, host_id: {host_id}")
    
    # Добавим человеческого игрока
    result = room_manager.join_room(room_code, "Игрок 1")
    if result is None:
        print("[ERROR] Не удалось добавить игрока")
        return False
    player_id, engine = result
    print(f"[OK] Игрок добавлен: {player_id}")
    
    print(f"[INFO] Текущая фаза: {engine.current_phase}")
    print(f"[INFO] Игроков: {len(engine.players)}")
    
    # Запустим игру (от имени хоста)
    from app.services.game.game_service import start_game
    try:
        engine, new_phase = await start_game(room_code, host_id)
        print(f"[OK] Игра начата, новая фаза: {new_phase}")
        print(f"[INFO] Всего игроков после старта: {len(engine.players)}")
        print(f"[INFO] AI игроки: {[p.name for p in engine.players.values() if p.is_ai]}")
        
        # Проверим, что фаза изменилась с LOBBY
        if new_phase == GamePhase.INDIVIDUAL_DAY:
            print("[OK] Стартовая фаза INDIVIDUAL_DAY (ожидаемо)")
        else:
            print(f"[WARN] Стартовая фаза {new_phase} (ожидалось INDIVIDUAL_DAY)")
        
        # Проверим очередь индивидуальных игроков
        if hasattr(engine, 'individual_player_order'):
            print(f"[INFO] Очередь игроков: {engine.individual_player_order}")
            print(f"[INFO] Текущий говорящий: {engine.get_current_speaker_id()}")
        
        return True
    except Exception as e:
        print(f"[ERROR] Ошибка старта игры: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    success = await test_room_creation()
    if success:
        print("\n[SUCCESS] Интеграционный тест пройден")
        sys.exit(0)
    else:
        print("\n[FAILURE] Интеграционный тест не пройден")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())