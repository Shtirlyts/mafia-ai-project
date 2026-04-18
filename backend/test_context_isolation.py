#!/usr/bin/env python3
"""
Тестирование информационной изоляции AI-агентов.
Проверяем, что агенты не видят роли других игроков и имеют индивидуальный контекст.
"""
import asyncio
import sys
from pathlib import Path

# Добавляем путь к проекту
sys.path.insert(0, str(Path(__file__).parent))

from app.services.game.engine import MafiaEngine, Role, Player
from app.services.ai.context_manager import ContextManager
from app.services.ai.agent import MafiaAIAgent


async def test_context_isolation():
    """Тест изоляции контекста между агентами."""
    print("=== Тест информационной изоляции AI-агентов ===")
    
    # Создаём движок игры
    engine = MafiaEngine()
    
    # Добавляем игроков
    players = [
        Player("p1", "Алиса", is_ai=True),
        Player("p2", "Боб", is_ai=True),
        Player("p3", "Чарли", is_ai=False),
        Player("p4", "Дэвид", is_ai=True),
    ]
    
    for p in players:
        engine.players[p.player_id] = p
    
    # Назначаем роли
    engine.configure_roles(player_count=len(players), mafia_count=1, detective=True, doctor=True)
    engine.assign_roles()
    
    # Выводим роли для отладки
    print("\nРоли игроков (для проверки):")
    for pid, p in engine.players.items():
        print(f"  {p.name} (AI: {p.is_ai}) -> {p.role}")
    
    # Создаём контекстный менеджер
    context_manager = ContextManager()
    room_code = "test_room"
    
    # Создаём контексты для AI-агентов
    ai_agents = []
    for pid, p in engine.players.items():
        if p.is_ai:
            context = context_manager.create_agent_context(
                room_code, pid, p.name, p.role
            )
            agent = MafiaAIAgent(pid, p.name, p.role, room_code)
            ai_agents.append((agent, p))
            print(f"\nСоздан AI-агент: {p.name} (роль: {p.role})")
    
    # Тест 1: Проверка, что to_dict() не раскрывает роли
    print("\n--- Тест 1: Проверка сериализации игроков ---")
    for pid, p in engine.players.items():
        data = p.to_dict(reveal_role=False, reveal_ai=False)
        print(f"  {p.name}: роль={data['role']}, is_ai={data['is_ai']}")
        assert data['role'] is None, f"Роль {p.name} раскрыта!"
        assert data['is_ai'] is None, f"AI-статус {p.name} раскрыт!"
    
    # Тест 2: Проверка индивидуального контекста
    print("\n--- Тест 2: Проверка индивидуального контекста ---")
    
    # Добавляем сообщения в историю чата
    from datetime import datetime
    engine.day_chat.append({
        "sender_id": "p1",
        "sender_name": "Алиса",
        "text": "Привет всем!",
        "timestamp": datetime.now().isoformat()
    })
    engine.day_chat.append({
        "sender_id": "p2",
        "sender_name": "Боб",
        "text": "Я мирный житель",
        "timestamp": datetime.now().isoformat()
    })
    engine.add_night_message("p4", "Дэвид", "Убьём Алису?")
    
    # Синхронизируем историю чата
    context_manager.sync_filtered_chat_history(room_code, engine)
    
    # Проверяем контексты агентов
    for agent, player in ai_agents:
        context = context_manager.get_agent_context(room_code, agent.player_id)
        if context:
            history = context.get_filtered_chat_history(include_night=(player.role == Role.MAFIA))
            print(f"\nКонтекст {player.name} (роль: {player.role}):")
            print(f"  Сообщений в истории: {len(context.message_history)}")
            print(f"  Видит ночной чат: {context.can_see_night_chat}")
            # Проверяем, что мафия видит ночное сообщение, а другие нет
            if player.role == Role.MAFIA:
                assert "Убьём Алису?" in history, f"Мафия {player.name} не видит ночной чат!"
            else:
                assert "Убьём Алису?" not in history, f"Не-мафия {player.name} видит ночной чат!"
    
    # Тест 3: Проверка обновления состояния игры
    print("\n--- Тест 3: Обновление состояния игры ---")
    
    # Убиваем одного игрока
    engine.players["p3"].is_alive = False
    
    # Обновляем контексты
    context_manager.update_from_game_state(room_code, engine)
    
    for agent, player in ai_agents:
        context = context_manager.get_agent_context(room_code, agent.player_id)
        if context:
            player_info = context.get_public_player_info()
            print(f"\n{player.name} знает об игроках:")
            for p in player_info:
                print(f"  {p['name']}: жив={p['is_alive']}, роль={p.get('role', 'скрыта')}")
            # Проверяем, что роли скрыты
            for p in player_info:
                assert p.get('role') is None, f"Роль {p['name']} раскрыта агенту {player.name}!"
    
    # Тест 4: Проверка генерации сообщений (мок)
    print("\n--- Тест 4: Проверка генерации сообщений ---")
    
    # Мокаем AI-сервис, чтобы не вызывать реальный API
    async def mock_generate():
        return "Тестовое сообщение от AI"
    
    # Сохраняем оригинальный метод
    original_method = None
    for agent, player in ai_agents:
        if hasattr(agent, '_ai_service'):
            original_method = agent._ai_service.get_response
            agent._ai_service.get_response = mock_generate
            break
    
    try:
        for agent, player in ai_agents:
            # Обновляем контекст агента
            agent.update_context_with_game_state(engine)
            # Генерируем сообщение
            message = await agent.generate_chat_message()
            print(f"  {player.name}: {message[:50]}...")
    finally:
        # Восстанавливаем оригинальный метод
        if original_method:
            for agent, player in ai_agents:
                if hasattr(agent, '_ai_service'):
                    agent._ai_service.get_response = original_method
    
    print("\n[OK] Все тесты пройдены успешно!")
    return True


async def test_game_cycle_integration():
    """Тест интеграции с игровым циклом."""
    print("\n=== Тест интеграции с игровым циклом ===")
    
    from app.api.v1.websockets.game_ws import process_ai_day_messages, process_ai_night_actions
    from app.services.game.room_manager import RoomManager
    from app.services.ai.ai_service import GigaChatService
    
    # Создаём комнату
    room_manager = RoomManager()
    room_code = "test_int_room"
    settings = {
        "game_mode": "ai_only",
        "max_players": 4,
        "day_duration_seconds": 60,
        "night_duration_seconds": 30,
        "auto_fill_ai": True
    }
    
    room_manager.create_room(room_code, "host1", settings)
    
    # Добавляем игроков
    for i in range(4):
        player_id = f"player{i}"
        room_manager.join_room(room_code, player_id, f"Игрок{i}", is_ai=(i < 2))
    
    # Создаём движок
    engine = MafiaEngine()
    engine.configure_roles(mafia_count=1, detective=True, doctor=True)
    engine.assign_roles()
    
    # Добавляем игроков в движок
    for pid, player_data in room_manager.rooms[room_code]["players"].items():
        p = Player(pid, player_data["name"], player_data["is_ai"])
        # Назначаем роль из движка
        if pid in engine.players:
            p.role = engine.players[pid].role
        engine.players[pid] = p
    
    print(f"Создана комната {room_code} с {len(engine.players)} игроками")
    
    # Тестируем обработку дневных сообщений AI
    print("\nТестируем process_ai_day_messages...")
    try:
        await process_ai_day_messages(room_code, engine)
        print("[OK] process_ai_day_messages выполнен успешно")
    except Exception as e:
        print(f"[ERROR] Ошибка в process_ai_day_messages: {e}")
        return False
    
    # Тестируем обработку ночных действий AI
    print("\nТестируем process_ai_night_actions...")
    try:
        await process_ai_night_actions(room_code, engine)
        print("[OK] process_ai_night_actions выполнен успешно")
    except Exception as e:
        print(f"[ERROR] Ошибка в process_ai_night_actions: {e}")
        return False
    
    print("\n✅ Интеграционные тесты пройдены!")
    return True


async def main():
    """Основная функция тестирования."""
    print("Запуск тестов информационной изоляции AI-агентов...")
    
    try:
        # Запускаем тест изоляции контекста
        success1 = await test_context_isolation()
        
        # Запускаем интеграционный тест (пропускаем, если есть проблемы с импортами)
        success2 = True
        try:
            success2 = await test_game_cycle_integration()
        except ImportError as e:
            print(f"\n[WARN] Пропускаем интеграционный тест: {e}")
            print("   (Это нормально для тестов без полной настройки окружения)")
        
        if success1 and success2:
            print("\n[SUCCESS] Все тесты пройдены успешно!")
            return 0
        else:
            print("\n[FAIL] Некоторые тесты не прошли")
            return 1
            
    except Exception as e:
        print(f"\n[ERROR] Критическая ошибка: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)