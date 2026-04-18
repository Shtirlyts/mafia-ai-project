# Mafia AI — Игра в «Мафию» с AI-агентами 🎭🤖

Веб-приложение для игры в классическую «Мафию», где игроки-люди сражаются вместе (или против) AI-агентов. Проект создан на базе FastAPI, React и WebSockets.

## 🚀 Стек технологий
- **Backend:** Python 3.10+, FastAPI, WebSockets.
- **AI:** GigaCode API / GigaChat для управления поведением агентов.
- **Frontend:** React, TypeScript, Tailwind CSS, Zustand (state management).
- **Database:** SQLite (для хранения логов игр и профилей).

---

## 🛠 Запуск проекта

### Предварительные требования
- Python 3.9+
- Node.js & npm
- Docker (рекомендуется)

### Клонирование репозитория
```bash
git clone [https://github.com/GabrielReira/fastapi-react-websocket-app.git](https://github.com/GabrielReira/fastapi-react-websocket-app.git)
cd fastapi-react-websocket-app
```

### 🐳 Запуск через Docker Compose
Самый быстрый способ поднять весь проект одной командой:
```bash
docker-compose up --build
```

### 💻 Локальный запуск (Backend)
1. Перейдите в папку бэкенда: `cd backend`
2. Создайте виртуальное окружение: `python -m venv venv`
3. Активируйте его:
   - Linux/Mac: `source venv/bin/activate`
   - Windows: `venv\Scripts\activate`
4. Установите зависимости: `pip install -r requirements.txt`
5. Запустите сервер: `uvicorn app.main:app --reload`

### 🎨 Локальный запуск (Frontend)
1. Перейдите в папку фронтенда: `cd frontend`
2. Установите зависимости: `npm install`
3. Запустите сервер разработки: `npm run dev` (или `npm start`)

## 📂 Структура проекта
```
mafia-ai-project/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── endpoints/
│   │   │   │   │   ├── auth.py          # Логин/регистрация (если нужны)
│   │   │   │   │   └── room.py          # Создание и настройки игровой комнаты
│   │   │   │   └── websockets/
│   │   │   │       └── game_ws.py       # Основной обработчик WebSocket соединений
│   │   │   └── router.py                # Общий роутер FastAPI
│   │   ├── core/
│   │   │   ├── config.py                # Pydantic-settings (API ключи, лимиты)
│   │   │   └── security.py              # JWT или простая проверка сессий
│   │   ├── db/
│   │   │   ├── base.py                  # Инициализация SQLAlchemy/Tortoise
│   │   │   └── session.py               # Управление сессиями БД
│   │   ├── models/
│   │   │   ├── player.py                # Таблица игроков (name, role, is_alive)
│   │   │   ├── game_log.py              # История сообщений и действий (для контекста AI)
│   │   │   └── room.py                  # Состояние комнаты
│   │   ├── schemas/
│   │   │   ├── chat.py                  # Схемы сообщений (Pydantic)
│   │   │   └── game_state.py            # Схема текущего состояния игры для фронта
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   │   ├── agent.py             # Класс AI-агента (логика вызова LLM)
│   │   │   │   ├── prompts.yaml         # Системные промпты для разных ролей
│   │   │   │   └── context_manager.py   # Сборка истории чата для подачи в AI
│   │   │   └── game/
│   │   │       ├── engine.py            # State Machine: смена фаз (Night/Day)
│   │   │       └── logic.py             # Подсчет голосов, проверка условий победы
│   │   └── main.py                      # Точка запуска (Uvicorn)
│   ├── .env                             # Конфиденциальные данные
│   ├── .gitignore
│   ├── alembic.ini                      # (Опционально) для миграций БД
│   └── requirements.txt                 # Зависимости (fastapi, uvicorn, etc.)
│
├── frontend/
│   ├── public/
│   │   └── sounds/                      # Звуки гонга, выстрелов (mp3)
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.ts                 # Настройка базового URL для HTTP
│   │   ├── assets/
│   │   │   └── images/                  # Аватарки ролей (мафия, дон, житель)
│   │   ├── components/
│   │   │   ├── Chat/
│   │   │   │   ├── MessageList.tsx
│   │   │   │   └── MessageInput.tsx
│   │   │   ├── Game/
│   │   │   │   ├── PlayerCard.tsx       # Карточка игрока со статусом (жив/мертв)
│   │   │   │   ├── NightOverlay.tsx     # Экран ночной фазы
│   │   │   │   └── Timer.tsx            # Обратный отсчет до конца фазы
│   │   │   └── UI/                      # Общие кнопки и инпуты (Shadcn)
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts          # Кастомный хук для работы с WS
│   │   │   └── useGameLogic.ts          # Обработка игровых событий на фронте
│   │   ├── store/
│   │   │   └── useGameStore.ts          # Глобальное состояние (Zustand)
│   │   ├── types/
│   │   │   └── index.ts                 # TypeScript интерфейсы (Player, GameState)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── package.json
│
├── docker-compose.yml                   # Чтобы запустить всё одной командой
└── README.md
```

## 🤖 Особенности AI-агентов
- Динамическая генерация реплик через GigaChat API
- Анализ поведения игроков для принятия решений
- Адаптация стиля общения под контекст игры
- Логирование взаимодействий для анализа и улучшения

## 📈 Будущее развитие
- Добавление различных ролей (Мафия, Доктор, Комиссар и др.)
- Реализация системы рейтинга игроков
- Поддержка приватных комнат
- Интеграция с другими AI-моделями
- Мобильная версия приложения

## 📄 Лицензия
Проект распространяется под лицензией MIT.