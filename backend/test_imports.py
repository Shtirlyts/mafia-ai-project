#!/usr/bin/env python3
"""Проверка импортов основных модулей."""
import sys
sys.path.insert(0, '.')

try:
    from app.services.game.engine import MafiaEngine, GamePhase
    from app.services.game.room_manager import RoomManager, RoomSettings, GameMode
    from app.api.v1.websockets.game_ws import router, run_game_loop
    from app.services.ai.agent import MafiaAIAgent
    from app.services.ai.ai_service import GigaChatService
    print("[OK] Все импорты успешны")
except Exception as e:
    print(f"[ERROR] Ошибка импорта: {e}")
    sys.exit(1)