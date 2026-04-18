import React from 'react';
import { useGame } from '../context/GameContext';
import { SetupScreen } from './SetupScreen';
import { LobbyScreen } from './LobbyScreen';
import { GamePhaseScreen } from './GamePhaseScreen';
import { ResultsScreen } from './ResultsScreen';
import { TuringTestScreen } from './TuringTestScreen';

export const GameContainer = () => {
  const { phase } = useGame();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {phase === 'setup' && <SetupScreen />}
      {phase === 'lobby' && <LobbyScreen />}
      {(phase === 'night' || phase === 'day' || phase === 'voting') && <GamePhaseScreen />}
      {phase === 'results' && <ResultsScreen />}
      {(phase === 'turing_test' || phase === 'turing_results') && <TuringTestScreen />}
    </div>
  );
};
