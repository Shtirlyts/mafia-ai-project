# Frontend Guide: что нужно от backend

Документ основан на текущей реализации backend (FastAPI + WebSocket) с учётом изменений в логике мафии, ИИ и комнатах.

## 1. Базовые URL и транспорт

- REST base URL: `http://localhost:8000/api`
- WebSocket URL: `ws://localhost:8000/ws/{room_code}/{client_id}`
- Health check: `GET http://localhost:8000/health`
- Swagger/OpenAPI: `http://localhost:8000/docs`

Важно:
- REST роуты идут с префиксом `/api`.
- WebSocket роут **без** `/api`.

## 2. Авторизация (JWT)

Auth нужен только для auth-эндпоинтов (`/v1/auth/*`). Игровые room/ws ручки сейчас не требуют JWT.

### 2.1 POST /v1/auth/register

Создать пользователя в in-memory store и сразу получить токен.

Request:

```json
{
  "username": "player1",
  "password": "secret123"
}
```

Ограничения:
- `username`: 3..32 символа
- `password`: 6..128 символов

Response 200:

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer"
}
```

Ошибки:
- `409 User already exists`

### 2.2 POST /v1/auth/login

Request:

```json
{
  "username": "player1",
  "password": "secret123"
}
```

Response 200:

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer"
}
```

Ошибки:
- `401 Invalid credentials`

### 2.3 GET /v1/auth/me

Требует header: `Authorization: Bearer <jwt>`

Response 200:

```json
{
  "username": "player1"
}
```

Ошибки:
- `401 Missing Authorization header`
- `401 Invalid Authorization header`
- `401 Invalid token`
- `401 Invalid token payload`

## 3. Комнаты и старт игры (REST)

### 3.1 POST /v1/room/create

Создать комнату.

Request:

```json
{
  "player_name": "Alice",
  "mode": "mixed",
  "max_players": 10,
  "ai_count": null,
  "mafia_count": 1,
  "detective": true,
  "doctor": true,
  "night_duration_seconds": 20,
  "day_duration_seconds": 60,
  "voting_duration_seconds": 30
}
```

Поля:
- `mode`: `humans_only | mixed | ai_only`
- `max_players`: максимум игроков (включая ИИ)
- `ai_count`: фиксированное число ИИ для `mixed` (optional). Если не задано, при старте игры будет добавлено столько ИИ, чтобы всего игроков стало 5.
- `mafia_count`: число мафии (минимум фактически ограничивается движком). Если не задано, будет вычислено автоматически в зависимости от количества игроков.
- `detective`, `doctor`: включение ролей
- длительности фаз в секундах

Response 200:

```json
{
  "room_code": "A1B2C3",
  "player_id": "host_player_id"
}
```

Важно по режимам:
- `ai_only`: хост создается как наблюдатель, не как игрок.
- `humans_only` и `mixed`: хост добавляется как обычный человеческий игрок.

### 3.2 POST /v1/room/join

Request:

```json
{
  "room_code": "A1B2C3",
  "player_name": "Bob"
}
```

Response 200:

```json
{
  "player_id": "new_player_id",
  "room_state": {
    "phase": "lobby",
    "players": [
      {
        "player_id": "...",
        "name": "Alice",
        "role": null,
        "is_alive": true,
        "is_ai": false
      }
    ],
    "winner": null
  }
}
```

Ошибки:
- `400 Room not found or game already started`

Join будет отклонен, если:
- комната не найдена;
- игра уже не в фазе `lobby`;
- режим `ai_only`;
- достигнут лимит людей в комнате.

### 3.3 GET /v1/room/{room_code}/state

Response 200:

```json
{
  "phase": "day",
  "players": [
    {
      "player_id": "...",
      "name": "Alice",
      "role": "mafia",
      "is_alive": true,
      "is_ai": false
    }
  ],
  "winner": null
}
```

Ошибки:
- `404 Room not found`

Примечание:
- Это REST-состояние возвращает данные напрямую из `engine`; оно не персонализировано как в WS.

### 3.4 POST /v1/room/{room_code}/start?player_id=...

Старт игры (может только хост).

Response 200:

```json
{
  "status": "started",
  "phase": "INDIVIDUAL_DAY"
}
```

Ошибки:
- `403 Only host can start`
- `404 Room not found`
- `400 Game already started`
- `400 Not enough human players (min 5)` для `humans_only`

Важно:
- Для `ai_only` хост-наблюдатель может стартовать через REST.
- Через WS сообщение `start_game` наблюдателю запрещено.
- При старте игры в режиме `mixed` backend добавляет ИИ-игроков (ботов) до достижения `ai_count` или минимум 5 игроков.
- В режиме `ai_only` создаются только AI-игроки (минимум 5 или `max_players`).

## 4. WebSocket: подключение и протокол

Endpoint:

- `ws://localhost:8000/ws/{room_code}/{client_id}`

Проверки на connect:
- комната должна существовать;
- движок комнаты должен существовать;
- `client_id` должен быть игроком комнаты или observer id.

При успешном подключении сервер сразу отправляет:
- `state_update`
- и дополнительно `mafia_teammates`, если клиент живой мафиози.

Во время игры сервер автоматически управляет фазами, таймерами и AI‑агентами:
- В фазе `INDIVIDUAL_DAY` AI‑игроки генерируют сообщения, когда наступает их очередь.
- В фазе `day` AI‑игроки периодически отправляют сообщения в общий чат.
- В фазе `voting` AI‑игроки автоматически голосуют за исключение игрока.
- В фазе `night` AI‑мафия генерирует сообщения в ночном чате (координация), затем все AI выполняют ночные действия (голосование мафии, проверка детектива, лечение доктора).

## 5. WS сообщения от клиента (frontend -> backend)

Все входящие сообщения должны быть JSON с полем `type`.

### 5.1 chat

```json
{
  "type": "chat",
  "text": "Я думаю это не я"
}
```

Работает только если:
- игрок жив;
- текущая фаза `day` или `voting`.

### 5.2 night_chat

```json
{
  "type": "night_chat",
  "text": "Берем цель #3"
}
```

Работает только если:
- игрок жив;
- роль игрока `mafia`;
- фаза `night`.

Примечание: AI-мафия также может отправлять ночные сообщения через ИИ.

### 5.3 vote

```json
{
  "type": "vote",
  "target_id": "player_123"
}
```

Работает только в фазе `voting`.

### 5.4 night_action

```json
{
  "type": "night_action",
  "action": "kill",
  "target_id": "player_123"
}
```

`action` может быть:
- `kill` (mafia) – голосование за убийство. Голоса мафии накапливаются, цель выбирается по большинству.
- `check` (detective) – проверка игрока на принадлежность к мафии.
- `save` (doctor) – лечение игрока.

### 5.5 start_game

```json
{
  "type": "start_game"
}
```

Работает для хоста-игрока (не observer).

### 5.6 get_state

```json
{
  "type": "get_state"
}
```

Запрос персонализированного состояния.

### 5.7 ping

```json
{
  "type": "ping"
}
```

Ответ сервера: `{"type": "pong"}`

## 6. WS события от сервера (backend -> frontend)

### 6.1 state_update

```json
{
  "type": "state_update",
  "data": {
    "phase": "night",
    "players": [
      {
        "player_id": "...",
        "name": "Alice",
        "role": "unknown",
        "is_alive": true,
        "is_ai": null
      }
    ],
    "winner": null,
    "eliminated_player": null,
    "vote_results": {},
    "day_chat": [],
    "night_chat": []
  }
}
```

Особенности видимости:
- До `game_over` роли других скрыты как `"unknown"`.
- Своя роль видна.
- Для не-наблюдателей `is_ai` маскируется в `null` у всех.
- Ночной чат виден только живой мафии в фазе `night`.
- После `game_over` роли раскрываются всем.

### 6.2 phase_change

```json
{
  "type": "phase_change",
  "phase": "day",
  "duration": 60
}
```

Для запуска таймера фазы на клиенте. Отправляется при каждом переходе фазы.

### 6.3 chat

```json
{
  "type": "chat",
  "sender_id": "...",
  "sender_name": "Alice",
  "text": "...",
  "phase": "day"
}
```

Дневной чат (также AI-реплики в фазе day). AI-игроки генерируют сообщения автоматически.

### 6.4 night_chat

```json
{
  "type": "night_chat",
  "sender_id": "...",
  "sender_name": "MafiaBot",
  "text": "...",
  "timestamp": "2026-04-18T12:34:56.789012"
}
```

### 6.5 vote_cast

```json
{
  "type": "vote_cast",
  "voter_id": "...",
  "target_id": "..."
}
```

### 6.6 detective_result

```json
{
  "type": "detective_result",
  "target_id": "...",
  "is_mafia": true
}
```

Приходит только детективу.

### 6.7 mafia_teammates

```json
{
  "type": "mafia_teammates",
  "teammates": ["player_x", "player_y"]
}
```

Приходит живым мафиози.

### 6.8 pong

```json
{
  "type": "pong"
}
```

### 6.9 error

```json
{
  "type": "error",
  "message": "..."
}
```

Тексты ошибок могут быть, например:
- `Observers cannot perform actions`
- `You are dead or not a player`
- `Cannot save yourself twice in a row`
- `Invalid JSON`
- `Invalid message payload`
- `AI service unavailable`
- сообщения из внутренних исключений

## 7. Игровая логика, которую фронт должен учитывать

- **Фазы**: `lobby -> INDIVIDUAL_DAY -> day -> voting -> night -> INDIVIDUAL_DAY ... -> game_over`
  - После старта игры первая фаза – `INDIVIDUAL_DAY` (индивидуальные высказывания по очереди).
  - Каждый живой игрок получает 30 секунд на высказывание (настраивается в `individual_duration_seconds`).
  - После всех высказываний автоматически переход в `day` (общее обсуждение, 60 секунд).
  - Затем `voting` (голосование за исключение, 60 секунд).
  - После голосования – `night` (ночные действия, 20 секунд).
  - Ночью мафия голосует за убийство, детектив проверяет, доктор лечит.
  - После ночи снова `INDIVIDUAL_DAY` (новый круг).
- В `voting` когда проголосовали все живые, сервер досрочно завершает фазу.
- **Логика голосования**:
  - Игроки голосуют за исключение одного игрока.
  - Если несколько игроков набрали одинаковое максимальное количество голосов – **выбывают все** (ничья).
  - Исключённый игрок становится мёртвым и не может говорить/голосовать.
- Победа:
  - `mafia`, если живой мафии >= живых мирных
  - `citizens`, если мафии не осталось
- Врач не может лечить себя 2 ночи подряд.
- В режиме `mixed` backend добавляет ИИ при старте игры:
  - если `ai_count` задан, стремится к нему;
  - иначе добавляет минимум для достижения 5 игроков.
- В режиме `ai_only` при старте создается минимум 5 AI (или `max_players`, если больше).
- **Голосование мафии**: Ночью мафия голосует за цель убийства через `night_action` с `action: "kill"`. Голоса накапливаются, цель выбирается по большинству голосов; при равенстве выбирается случайная цель.
- **Контекстный менеджер ИИ**: Каждый AI-игрок имеет контекст, который включает историю чата, подозрения относительно других игроков (число от 0 до 1) и знания об игроках. Контекст обновляется после каждого сообщения и перехода фазы.
- **AI-сообщения**:
  - В фазе `day` AI-игроки автоматически генерируют сообщения на основе контекста и отправляют их в чат.
  - В фазе `INDIVIDUAL_DAY` AI также генерирует сообщение, когда наступает его очередь.
- **AI-ночные действия**: В фазе `night` AI-игроки автоматически выбирают цели для своих ролей (мафия голосует за убийство, детектив проверяет, доктор лечит) на основе подозрений и контекста.
- **AI-голосование в фазе VOTING**: AI-игроки автоматически голосуют за исключение игрока на основе подозрений (или случайно, если подозрений нет). Голоса отправляются через `process_ai_votes`.
- **Координация мафии в ночном чате**: AI-мафия генерирует сообщения в ночном чате перед голосованием за убийство. Эти сообщения видны только живой мафии.
- **Подозрения**: AI-игроки имеют числовые подозрения относительно других игроков (0 - мирный, 1 - мафия), которые влияют на их решения.

## 8. Рекомендуемые TypeScript типы

```ts
export type GameMode = 'humans_only' | 'mixed' | 'ai_only';
export type GamePhase = 'lobby' | 'INDIVIDUAL_DAY' | 'day' | 'voting' | 'night' | 'game_over';
export type Role = 'citizen' | 'mafia' | 'detective' | 'doctor' | 'unknown';

export interface PlayerView {
  player_id: string;
  name: string;
  role: Role | null;
  is_alive: boolean;
  is_ai: boolean | null;
}

export interface GameStateView {
  phase: GamePhase;
  players: PlayerView[];
  winner: 'mafia' | 'citizens' | null;
  eliminated_player: string | null;
  vote_results: Record<string, number>;
  day_chat: Array<{
    sender_id: string;
    sender_name: string;
    text: string;
    phase: GamePhase;
  }>;
  night_chat: Array<{
    sender_id: string;
    sender_name: string;
    text: string;
    timestamp: string;
  }>;
}

// Типы для WS событий (discriminated union)
export type WSEvent =
  | { type: 'state_update'; data: GameStateView }
  | { type: 'phase_change'; phase: GamePhase; duration: number }
  | { type: 'chat'; sender_id: string; sender_name: string; text: string; phase: GamePhase }
  | { type: 'night_chat'; sender_id: string; sender_name: string; text: string; timestamp: string }
  | { type: 'vote_cast'; voter_id: string; target_id: string }
  | { type: 'detective_result'; target_id: string; is_mafia: boolean }
  | { type: 'mafia_teammates'; teammates: string[] }
  | { type: 'pong' }
  | { type: 'error'; message: string };
```

## 9. Минимальный frontend flow

1. (Опционально) register/login и сохранить JWT.
2. create room -> получить `room_code`, `player_id`.
3. Подключиться к WS по `room_code/player_id`.
4. Для обычных игроков: join room перед WS (если не хост).
5. Старт игры:
   - обычный режим: `start_game` через WS или REST;
   - `ai_only`: лучше через REST `/start?player_id=host_id`.
6. Держать UI синхронизированным от событий `state_update` + `phase_change`.
7. Обрабатывать AI-сообщения как обычные сообщения чата.
8. На `error` показывать toast/alert, не ломать socket.

## 10. Чеклист для фронта

- Единая модель события WS (discriminated union по `type`).
- Reconnect strategy для WebSocket.
- Таймер фазы строить от `phase_change.duration`.
- Проверки UI по фазе/роли перед отправкой экшенов.
- Обработка role visibility (`unknown`) как нормального кейса.
- Корректная ветка для observer (`ai_only` host).
- Отдельная обработка `detective_result` и `mafia_teammates`.
- Учёт AI-сообщений и ночных действий AI (они приходят как обычные события).
- Учёт контекста ИИ (подозрения) при отладке, если нужно.

---

Если нужно, следующим шагом можно добавить в frontend готовые `api.ts` и `useGameSocket` с типобезопасным разбором всех WS событий по этому контракту.
