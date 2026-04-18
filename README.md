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
Tula-Hack26/
├── backend/
│   ├── app/
│   │   ├── main.py            # Точка входа FastAPI
│   │   ├── models.py         # Модели данных
│   │   ├── schemas.py        # Pydantic схемы
│   │   ├── database.py       # Работа с базой данных
│   │   └── api/              # Роуты API
├── frontend/
│   ├── src/
│   │   ├── components/      # React компоненты
│   │   ├── pages/           # Страницы приложения
│   │   ├── store/           # Zustand store
│   │   └── App.tsx          # Главный компонент
├── docker-compose.yml      # Конфигурация Docker
└── README.md               # Документация проекта
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