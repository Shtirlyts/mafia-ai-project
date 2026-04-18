# Структура проекта AI Мафия

## 📂 Обзор структуры

```
ai-mafia/
├── src/
│   ├── app/
│   │   ├── components/        # React компоненты
│   │   │   ├── ui/           # UI библиотека (Radix, shadcn/ui)
│   │   │   ├── figma/        # Figma компоненты
│   │   │   ├── LobbyScreen.tsx      # Экран лобби
│   │   │   ├── GameScreen.tsx       # Игровой экран
│   │   │   ├── ResultsScreen.tsx    # Экран результатов
│   │   │   └── SettingsModal.tsx    # Настройки игры
│   │   ├── types/            # TypeScript типы
│   │   │   └── game.types.ts        # Игровые типы
│   │   ├── utils/            # Утилиты
│   │   │   ├── aiResponses.ts       # AI ответы
│   │   │   ├── roleHelpers.ts       # Хелперы для ролей
│   │   │   ├── roomCodeGenerator.ts # Генерация кодов комнат
│   │   │   ├── playerGenerator.ts   # Генерация игроков
│   │   │   └── formatTime.ts        # Форматирование времени
│   │   ├── hooks/            # React хуки
│   │   │   └── useGameTimer.ts      # Таймер игры
│   │   ├── constants/        # Константы
│   │   │   └── gameConfig.ts        # Конфигурация игры
│   │   └── App.tsx           # Главный компонент
│   ├── styles/               # Глобальные стили
│   │   ├── fonts.css
│   │   └── theme.css
│   └── imports/              # Импортированные ресурсы
├── public/                   # Статические файлы
├── vite.config.ts           # Конфигурация Vite
├── tsconfig.json            # Конфигурация TypeScript
├── package.json             # Зависимости проекта
├── .gitignore              # Git ignore правила
├── .eslintrc.json          # ESLint конфигурация
├── .prettierrc.json        # Prettier конфигурация
└── README.md               # Документация
```

## 🎯 Основные компоненты

### LobbyScreen
**Назначение**: Экран создания и ожидания игроков

**Props**:
- `roomCode: string` - код комнаты
- `players: Player[]` - список игроков
- `onStart: () => void` - колбэк начала игры
- `onSettingsClick: () => void` - колбэк открытия настроек

**Функциональность**:
- Отображение кода комнаты и кнопки копирования
- Список игроков с индикацией AI/человек
- Счетчики людей и AI
- Кнопка запуска игры (активна при >= 5 игроков)

### GameScreen
**Назначение**: Основной игровой процесс

**Props**:
- `playerRole: PlayerRole` - роль игрока
- `players: Player[]` - список игроков
- `messages: Message[]` - сообщения чата
- `phase: GamePhase` - текущая фаза (день/ночь)
- `timeLeft: number` - оставшееся время
- `round: number` - номер раунда
- `onVote: (playerId: string) => void` - голосование
- `selectedVote: string | null` - выбранный голос
- `onSendMessage: (message: string) => void` - отправка сообщения
- `nightAction?: NightAction` - ночное действие
- `onNightAction?: (playerId: string) => void` - колбэк ночного действия
- `selectedNightAction?: string | null` - выбранное ночное действие

**Функциональность**:
- Переключение день/ночь с визуальными индикаторами
- Таймер обратного отсчета
- Чат для обсуждений (только днем)
- Система голосования
- Ночные действия для ролей
- Список живых и мертвых игроков
- Отображение роли игрока

### ResultsScreen
**Назначение**: Отображение результатов игры

**Props**:
- `winner: WinnerTeam` - победившая команда
- `players: PlayerResult[]` - результаты игроков
- `rounds: number` - количество раундов
- `onPlayAgain: () => void` - повторная игра
- `onLeaveLobby: () => void` - выход в лобби

**Функциональность**:
- Баннер победителя
- Раскрытие ролей всех игроков
- Статистика AI vs люди
- Тест Тьюринга (кто распознал AI)
- Кнопки повторной игры и выхода

### SettingsModal
**Назначение**: Настройки игры

**Props**:
- `onClose: () => void` - закрытие модального окна
- `settings: GameSettings` - текущие настройки
- `onSettingsChange: (settings: GameSettings) => void` - изменение настроек

**Функциональность**:
- Выбор режима игры (AI-only/mixed/human-only)
- Настройка количества игроков
- Длительность фаз (день/ночь)
- Распределение ролей

## 🔧 TypeScript типы

### Основные типы

```typescript
// Фазы игры
type GamePhase = 'day' | 'night';

// Экраны игры
type GameScreen = 'lobby' | 'game' | 'results';

// Роли игроков
type PlayerRole = 'Мафия' | 'Комиссар' | 'Доктор' | 'Мирный житель';

// Победители
type WinnerTeam = 'mafia' | 'civilians';

// Типы ночных действий
type NightActionType = 'mafia' | 'detective' | 'doctor';

// Режимы игры
type GameMode = 'ai-only' | 'mixed' | 'human-only';
```

### Интерфейсы

```typescript
// Игрок
interface Player {
  id: string;
  name: string;
  isAI: boolean;
  isReady: boolean;
  isAlive: boolean;
  role?: PlayerRole;
  votes: number;
}

// Сообщение
interface Message {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  timestamp: Date;
  isAI: boolean;
}

// Настройки игры
interface GameSettings {
  minPlayers: number;
  maxPlayers: number;
  aiCount: number;
  humanCount: number;
  dayDuration: number;
  nightDuration: number;
  gameMode: GameMode;
  roles: {
    mafia: number;
    detective: number;
    doctor: number;
    civilian: number;
  };
}
```

## 🛠 Утилиты

### aiResponses.ts
Генерация AI ответов и имен:
- `getRandomAIResponse()` - случайный ответ AI
- `generateAIName(index)` - генерация имени AI

### roleHelpers.ts
Хелперы для работы с ролями:
- `getRoleColor(role)` - цвет роли
- `getRoleIcon(role)` - иконка роли
- `getRoleTextColor(role)` - цвет текста роли

### roomCodeGenerator.ts
Генерация кодов комнат:
- `generateRoomCode()` - генерация кода
- `isValidRoomCode(code)` - валидация кода
- `generateLobbyLink(roomCode)` - ссылка на лобби

### playerGenerator.ts
Генерация игроков:
- `generateHumanPlayer()` - создание игрока-человека
- `generateAIPlayer()` - создание AI игрока
- `generateMockPlayers()` - набор mock игроков
- `calculateRequiredAI()` - расчет нужных AI

### formatTime.ts
Форматирование времени:
- `formatTimeMMSS(seconds)` - формат MM:SS
- `formatMessageTime(date)` - время сообщения
- `getRelativeTime(date)` - относительное время

## 🎨 Стилизация

### Цветовая схема
- **Фон**: `slate-900`, `purple-900`
- **Акценты**: `purple-600`, `pink-600`
- **AI элементы**: `purple-500`
- **Человеческие элементы**: `blue-500`
- **Мафия**: `red-500`
- **Комиссар**: `blue-500`
- **Доктор**: `green-500`

### Tailwind классы
- Полупрозрачные панели: `bg-white/10 backdrop-blur-lg`
- Границы: `border border-white/20`
- Градиенты: `bg-gradient-to-br from-slate-900 via-purple-900`

## 🔌 Хуки

### useGameTimer
Управление таймером игры:
- Автоматическое переключение фаз
- Обновление раундов
- Сброс времени

**Параметры**:
```typescript
{
  screen: GameScreen;
  phase: GamePhase;
  timeLeft: number;
  settings: GameSettings;
  setTimeLeft: (value: number | ((prev: number) => number)) => void;
  setPhase: (value: GamePhase | ((prev: GamePhase) => GamePhase)) => void;
  setRound: (value: number | ((prev: number) => number)) => void;
}
```

## 📦 Константы

### gameConfig.ts
- `DEFAULT_GAME_SETTINGS` - настройки по умолчанию
- `PLAYER_NAMES` - списки имен игроков
- `GAME_CONSTANTS` - игровые константы
- `PHASE_DURATIONS` - длительности фаз

## 🚀 Расширение проекта

### Добавление новой роли
1. Добавить роль в тип `PlayerRole` (`types/game.types.ts`)
2. Добавить цвет и иконку в `roleHelpers.ts`
3. Добавить логику в `GameScreen.tsx`
4. Обновить `SettingsModal.tsx`

### Добавление нового режима игры
1. Добавить режим в тип `GameMode` (`types/game.types.ts`)
2. Обновить `SettingsModal.tsx`
3. Добавить логику в `App.tsx`

### Интеграция с backend
1. Создать API сервис в `src/app/services/`
2. Добавить WebSocket для реалтайм обновлений
3. Интегрировать Supabase для базы данных
4. Добавить AI провайдер (Anthropic Claude)

## 🧪 Тестирование

Для добавления тестов:
```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom
```

Структура тестов:
```
src/
├── app/
│   ├── components/
│   │   ├── __tests__/
│   │   │   ├── LobbyScreen.test.tsx
│   │   │   ├── GameScreen.test.tsx
│   │   │   └── ResultsScreen.test.tsx
│   ├── utils/
│   │   └── __tests__/
│   │       ├── aiResponses.test.ts
│   │       └── formatTime.test.ts
```
