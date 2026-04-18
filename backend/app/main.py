from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.websockets.game_ws import router as ws_router
from app.api.router import api_router
import logging

from app.core.config import settings


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Mafia AI API",
    description="Backend for Mafia game with AI agents",
    version="1.0.0",
)

app.include_router(api_router, prefix="/api")
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


@app.on_event("startup")
async def startup_event() -> None:
    logger.info("Mafia AI backend started. Model=%s", settings.GIGACHAT_MODEL)
