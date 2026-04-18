from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.endpoints.room import router as room_router
from app.api.v1.websockets.game_ws import router as ws_router

app = FastAPI(
    title="Mafia AI API",
    description="Backend for Mafia game with AI agents",
    version="1.0.0"
)

app.include_router(room_router, prefix="/api/v1/room")
app.include_router(ws_router)

# Настройка CORS (разрешаем запросы с любых адресов для хакатона)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Простая ручка для проверки, что сервер жив
@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Mafia AI Server is running!"}

# from app.api.router import api_router
# app.include_router(api_router, prefix="/api")