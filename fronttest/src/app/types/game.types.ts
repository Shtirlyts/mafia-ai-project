export type GamePhase = 'day' | 'night';
export type GameScreen = 'lobby' | 'game' | 'results';
export type PlayerRole = 'Мафия' | 'Комиссар' | 'Доктор' | 'Мирный житель';
export type WinnerTeam = 'mafia' | 'civilians';
export type NightActionType = 'mafia' | 'detective' | 'doctor';
export type GameMode = 'ai-only' | 'mixed' | 'human-only';

export interface Player {
  id: string;
  name: string;
  isAI: boolean;
  isReady: boolean;
  isAlive: boolean;
  role?: PlayerRole;
  votes: number;
}

export interface Message {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  timestamp: Date;
  isAI: boolean;
}

export interface GameSettings {
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

export interface NightAction {
  type: NightActionType;
  canAct: boolean;
}

export interface PlayerResult extends Player {
  role: PlayerRole;
  survived: boolean;
  guessedAsAI: number;
  totalGuesses: number;
}

export interface GameState {
  screen: GameScreen;
  phase: GamePhase;
  round: number;
  timeLeft: number;
  players: Player[];
  messages: Message[];
  selectedVote: string | null;
  selectedNightAction: string | null;
  settings: GameSettings;
  playerRole: PlayerRole | null;
  roomCode: string;
}
