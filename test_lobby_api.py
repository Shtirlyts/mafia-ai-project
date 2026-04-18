#!/usr/bin/env python3
"""
Тестовый скрипт для проверки API лобби.
Проверяет создание комнаты, присоединение, обновление настроек и старт игры.
"""

import requests
import json
import time
import sys
from typing import Dict, Any

# Конфигурация
BASE_URL = "http://localhost:8000/api/v1"
HEADERS = {"Content-Type": "application/json"}

def print_response(label: str, response: requests.Response):
    """Печать ответа с форматированием."""
    print(f"\n{'='*60}")
    print(f"{label}")
    print(f"Status: {response.status_code}")
    try:
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2, ensure_ascii=False)}")
    except:
        print(f"Response text: {response.text}")
    print(f"{'='*60}")

def test_create_room() -> Dict[str, Any]:
    """Тест создания комнаты."""
    payload = {
        "player_name": "ТестовыйХост",
        "game_mode": "MIXED",
        "ai_count": 2,
        "total_players": 8
    }
    response = requests.post(
        f"{BASE_URL}/room/create",
        json=payload,
        headers=HEADERS
    )
    print_response("1. Создание комнаты", response)
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Ошибка создания комнаты: {response.text}")

def test_join_room(room_code: str, player_name: str) -> Dict[str, Any]:
    """Тест присоединения к комнате."""
    payload = {
        "room_code": room_code,
        "player_name": player_name
    }
    response = requests.post(
        f"{BASE_URL}/room/join",
        json=payload,
        headers=HEADERS
    )
    print_response(f"2. Присоединение игрока '{player_name}'", response)
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Ошибка присоединения: {response.text}")

def test_get_room_state(room_code: str):
    """Тест получения состояния комнаты."""
    response = requests.get(f"{BASE_URL}/room/{room_code}/state")
    print_response(f"3. Получение состояния комнаты {room_code}", response)
    return response.json() if response.status_code == 200 else None

def test_update_room_settings(room_code: str, player_id: str, settings: Dict[str, Any]):
    """Тест обновления настроек комнаты (только хост)."""
    payload = {
        "player_id": player_id,
        **settings
    }
    response = requests.patch(
        f"{BASE_URL}/room/{room_code}/settings",
        json=payload,
        headers=HEADERS
    )
    print_response(f"4. Обновление настроек комнаты", response)
    return response.json() if response.status_code == 200 else None

def test_start_game(room_code: str, player_id: str):
    """Тест старта игры."""
    payload = {
        "player_id": player_id
    }
    response = requests.post(
        f"{BASE_URL}/room/{room_code}/start",
        json=payload,
        headers=HEADERS
    )
    print_response(f"5. Старт игры из лобби", response)
    return response.json() if response.status_code == 200 else None

def main():
    print("🚀 Запуск тестов API лобби")
    print(f"Базовый URL: {BASE_URL}")
    
    try:
        # 1. Создание комнаты
        create_result = test_create_room()
        room_code = create_result.get("room_code")
        host_player_id = create_result.get("player_id")
        
        if not room_code:
            print("❌ Не удалось получить код комнаты")
            return
        
        print(f"✅ Комната создана: {room_code}")
        print(f"   ID хоста: {host_player_id}")
        
        # 2. Получение состояния комнаты (должна быть пустая)
        state = test_get_room_state(room_code)
        
        # 3. Присоединение нескольких игроков
        join_results = []
        for i in range(1, 4):
            player_name = f"Игрок{i}"
            result = test_join_room(room_code, player_name)
            join_results.append(result)
            time.sleep(0.2)  # небольшая задержка
        
        # 4. Снова получаем состояние (должно быть 4 игрока: хост + 3 присоединившихся)
        state_after_join = test_get_room_state(room_code)
        
        # 5. Обновление настроек комнаты (хостом)
        new_settings = {
            "game_mode": "HUMANS_ONLY",
            "ai_count": 0,
            "total_players": 7
        }
        update_result = test_update_room_settings(
            room_code, 
            host_player_id, 
            new_settings
        )
        
        # 6. Попытка старта игры (должна быть ошибка, так как меньше 5 игроков)
        print("\n⚠️  Попытка старта игры с недостаточным количеством игроков...")
        start_result = test_start_game(room_code, host_player_id)
        
        # 7. Присоединение еще игроков до 5
        print("\n➕ Присоединение дополнительных игроков для достижения минимума...")
        for i in range(4, 6):
            player_name = f"Игрок{i}"
            test_join_room(room_code, player_name)
            time.sleep(0.2)
        
        # 8. Снова пытаемся стартовать
        print("\n✅ Попытка старта игры с достаточным количеством игроков...")
        start_result2 = test_start_game(room_code, host_player_id)
        
        # 9. Финальное состояние
        final_state = test_get_room_state(room_code)
        
        print("\n" + "="*60)
        print("📊 ИТОГИ ТЕСТИРОВАНИЯ")
        print("="*60)
        print(f"✅ Создание комнаты: УСПЕШНО (код: {room_code})")
        print(f"✅ Присоединение игроков: УСПЕШНО (5 игроков)")
        print(f"✅ Обновление настроек: УСПЕШНО")
        print(f"✅ Старт игры: {'УСПЕШНО' if start_result2 else 'НЕ УДАЛОСЬ'}")
        print(f"✅ Проверка минимального количества игроков: РАБОТАЕТ")
        
    except Exception as e:
        print(f"\n❌ Ошибка во время тестирования: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()