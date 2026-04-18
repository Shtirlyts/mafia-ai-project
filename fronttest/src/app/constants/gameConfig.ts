import type { GameSettings } from '../types/game.types';

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  minPlayers: 5,
  maxPlayers: 10,
  aiCount: 3,
  humanCount: 2,
  dayDuration: 120, // seconds
  nightDuration: 60, // seconds
  gameMode: 'mixed',
  roles: {
    mafia: 2,
    detective: 1,
    doctor: 1,
    civilian: 6,
  },
};

export const PLAYER_NAMES = {
  HUMAN: [
    'Александр',
    'Мария',
    'Дмитрий',
    'Анна',
    'Сергей',
    'Елена',
    'Михаил',
    'Ольга',
  ],
  AI_PREFIX: '_AI',
} as const;

export const GAME_CONSTANTS = {
  MIN_PLAYERS_TO_START: 5,
  MAX_PLAYERS_TOTAL: 15,
  ROOM_CODE_LENGTH: 6,
  AI_RESPONSE_DELAY_MS: 2000,
  VOTE_REVEAL_DELAY_MS: 3000,
} as const;

export const PHASE_DURATIONS = {
  DAY_MIN: 60,
  DAY_MAX: 300,
  DAY_DEFAULT: 120,
  NIGHT_MIN: 30,
  NIGHT_MAX: 120,
  NIGHT_DEFAULT: 60,
} as const;
