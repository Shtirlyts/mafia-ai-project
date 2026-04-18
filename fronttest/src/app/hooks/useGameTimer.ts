import { useEffect } from 'react';
import type { GameScreen, GamePhase, GameSettings } from '../types/game.types';

interface UseGameTimerProps {
  screen: GameScreen;
  phase: GamePhase;
  timeLeft: number;
  settings: GameSettings;
  setTimeLeft: (value: number | ((prev: number) => number)) => void;
  setPhase: (value: GamePhase | ((prev: GamePhase) => GamePhase)) => void;
  setRound: (value: number | ((prev: number) => number)) => void;
}

export function useGameTimer({
  screen,
  phase,
  timeLeft,
  settings,
  setTimeLeft,
  setPhase,
  setRound
}: UseGameTimerProps) {
  useEffect(() => {
    if (screen === 'game') {
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Switch phase
            setPhase((p) => p === 'day' ? 'night' : 'day');
            setRound((r) => phase === 'night' ? r + 1 : r);
            return phase === 'day' ? settings.nightDuration : settings.dayDuration;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [screen, phase, settings, setTimeLeft, setPhase, setRound]);
}
