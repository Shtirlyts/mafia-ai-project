#!/usr/bin/env python3
"""Тест генерации сообщений AI в фазах DAY и INDIVIDUAL_DAY."""
import asyncio
import sys
sys.path.insert(0, '.')

from app.services.game.engine import MafiaEngine, GamePhase, Role, Player
from app.services.ai.agent import MafiaAIAgent
from app.services.ai.context_manager import context_manager

async def test_ai_day_messages():
    """Тестируем, что AI агенты могут генерировать сообщения в фазе DAY."""
    print("[TEST] Генерация сообщений AI в фазе DAY")
    
    # Создаем движок с AI игроками
    engine = MafiaEngine()
    engine.add_player(Player("ai1", "AI_1", is_ai=True))
    engine.add_player(Player("ai2", "AI_2", is_ai=True))
    engine.add_player(Player("human1", "Человек", is_ai=False))
    
    # Назначаем роли (просто для теста)
    engine.configure_roles(len(engine.players), mafia_count=1, detective=False, doctor=False)
    
    # Переключаем фазу на DAY (минуя LOBBY)
    engine.current_phase = GamePhase.DAY
    engine._init_individual_order()  # инициализируем очередь (хотя для DAY не нужно)
    
    # Создаем агентов и генерируем сообщения
    messages = []
    for player in engine.players.values():
        if player.is_ai and player.is_alive:
            agent = MafiaAIAgent(player.player_id, player.name, player.role, "test_room")
            try:
                message = await agent.generate_chat_message()
                messages.append((player.name, message))
                print(f"[OK] AI {player.name} сгенерировал сообщение: {message[:50]}...")
            except Exception as e:
                print(f"[ERROR] Ошибка генерации сообщения AI {player.name}: {e}")
                return False
    
    if len(messages) > 0:
        print(f"[SUCCESS] Сгенерировано {len(messages)} сообщений AI")
        return True
    else:
        print("[WARN] Ни одного сообщения не сгенерировано")
        return False

async def test_ai_individual_day():
    """Тестируем, что AI агенты могут генерировать сообщения в фазе INDIVIDUAL_DAY."""
    print("\n[TEST] Генерация сообщений AI в фазе INDIVIDUAL_DAY")
    
    engine = MafiaEngine()
    engine.add_player(Player("ai1", "AI_1", is_ai=True))
    engine.add_player(Player("ai2", "AI_2", is_ai=True))
    engine.add_player(Player("human1", "Человек", is_ai=False))
    
    engine.configure_roles(len(engine.players), mafia_count=1, detective=False, doctor=False)
    engine.current_phase = GamePhase.INDIVIDUAL_DAY
    engine._init_individual_order()
    
    # Получаем текущего говорящего (должен быть первый в очереди)
    speaker_id = engine.get_current_speaker_id()
    if not speaker_id:
        print("[ERROR] Нет текущего говорящего")
        return False
    
    speaker = engine.players.get(speaker_id)
    print(f"[INFO] Текущий говорящий: {speaker.name} (AI: {speaker.is_ai})")
    
    if speaker.is_ai:
        agent = MafiaAIAgent(speaker.player_id, speaker.name, speaker.role, "test_room")
        try:
            message = await agent.generate_chat_message()
            print(f"[OK] AI {speaker.name} сгенерировал индивидуальное сообщение: {message[:50]}...")
            return True
        except Exception as e:
            print(f"[ERROR] Ошибка генерации сообщения: {e}")
            return False
    else:
        print("[INFO] Говорящий - человек, генерация не требуется")
        return True

async def main():
    success1 = await test_ai_day_messages()
    success2 = await test_ai_individual_day()
    
    if success1 and success2:
        print("\n[SUCCESS] Все тесты AI сообщений пройдены")
        sys.exit(0)
    else:
        print("\n[FAILURE] Тесты AI сообщений не пройдены")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())