export type Role = 'villager' | 'mafia' | 'detective' | 'doctor';
export type GamePhase = 'menu' | 'lobby' | 'reveal' | 'night' | 'day' | 'voting' | 'elimination' | 'game_over' | 'turing_test' | 'stats';
export type GameMode = 'mixed' | 'ai_only' | 'human_only';

export interface Player {
  id: string;
  name: string;
  role: Role;
  isAI: boolean;
  isAlive: boolean;
  avatarId: number;
}

export interface ChatMessage {
  id: string;
  senderId: string | 'system';
  text: string;
  timestamp: number;
  isSystem: boolean;
}

export interface GameSettings {
  totalPlayers: number;
  mode: GameMode;
  roles: {
    mafia: number;
    detective: number;
    doctor: number;
  };
}

export interface Vote {
  voterId: string;
  targetId: string;
}

export interface NightActions {
  mafiaTarget: string | null;
  doctorTarget: string | null;
  detectiveTarget: string | null;
}
