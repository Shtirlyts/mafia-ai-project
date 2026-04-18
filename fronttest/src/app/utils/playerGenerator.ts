import type { Player } from '../types/game.types';
import { generateAIName } from './aiResponses';

/**
 * Generates a mock human player
 */
export function generateHumanPlayer(id: string, name: string): Player {
  return {
    id,
    name,
    isAI: false,
    isReady: true,
    isAlive: true,
    votes: 0,
  };
}

/**
 * Generates a mock AI player
 */
export function generateAIPlayer(id: string, index: number): Player {
  return {
    id,
    name: generateAIName(index),
    isAI: true,
    isReady: true,
    isAlive: true,
    votes: 0,
  };
}

/**
 * Generates a list of mock players for demo
 */
export function generateMockPlayers(humanCount: number, aiCount: number): Player[] {
  const players: Player[] = [];

  // Add human players
  const humanNames = ['Александр', 'Мария', 'Иван', 'Елена', 'Петр'];
  for (let i = 0; i < humanCount; i++) {
    players.push(generateHumanPlayer(`h-${i + 1}`, humanNames[i % humanNames.length]));
  }

  // Add AI players
  for (let i = 0; i < aiCount; i++) {
    players.push(generateAIPlayer(`ai-${i + 1}`, i));
  }

  return players;
}

/**
 * Calculates how many AI players are needed to reach minimum
 */
export function calculateRequiredAI(currentPlayers: number, minPlayers: number): number {
  return Math.max(0, minPlayers - currentPlayers);
}
