import type { PlayerRole } from '../types/game.types';

export function getRoleColor(role: PlayerRole): string {
  switch (role) {
    case 'Мафия':
      return 'bg-red-500/20 border-red-400/30 text-red-300';
    case 'Комиссар':
      return 'bg-blue-500/20 border-blue-400/30 text-blue-300';
    case 'Доктор':
      return 'bg-green-500/20 border-green-400/30 text-green-300';
    case 'Мирный житель':
      return 'bg-gray-500/20 border-gray-400/30 text-gray-300';
  }
}

export function getRoleIcon(role: PlayerRole): string {
  switch (role) {
    case 'Мафия':
      return '🔪';
    case 'Комиссар':
      return '🕵️';
    case 'Доктор':
      return '💊';
    case 'Мирный житель':
      return '👤';
  }
}

export function getRoleTextColor(role: PlayerRole): string {
  switch (role) {
    case 'Мафия':
      return 'text-red-400';
    case 'Комиссар':
      return 'text-blue-400';
    case 'Доктор':
      return 'text-green-400';
    case 'Мирный житель':
      return 'text-gray-300';
  }
}
