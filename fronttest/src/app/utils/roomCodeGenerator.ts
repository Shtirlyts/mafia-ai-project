import { GAME_CONSTANTS } from '../constants/gameConfig';

/**
 * Generates a random room code for game lobbies
 * Format: MAFIA-XXXX where X is alphanumeric
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';

  for (let i = 0; i < GAME_CONSTANTS.ROOM_CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `MAFIA-${code}`;
}

/**
 * Validates if a room code matches the expected format
 */
export function isValidRoomCode(code: string): boolean {
  const pattern = /^MAFIA-[A-Z0-9]{6}$/;
  return pattern.test(code);
}

/**
 * Generates a shareable lobby link
 */
export function generateLobbyLink(roomCode: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `${baseUrl}?room=${roomCode}`;
}
