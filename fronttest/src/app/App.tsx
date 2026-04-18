import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { MainMenu, Lobby, RoleReveal, NightPhase } from './components/Screens';
import { DayPhase, VotingPhase, EliminationScreen } from './components/Screens2';
import { GameOver } from './components/Screens3';
import { AnimatePresence } from 'motion/react';

const GameRouter = () => {
  const { phase } = useGame();

  return (
    <AnimatePresence mode="wait">
      {phase === 'menu' && <MainMenu key="menu" />}
      {phase === 'lobby' && <Lobby key="lobby" />}
      {phase === 'reveal' && <RoleReveal key="reveal" />}
      {phase === 'night' && <NightPhase key="night" />}
      {phase === 'day' && <DayPhase key="day" />}
      {phase === 'voting' && <VotingPhase key="voting" />}
      {phase === 'elimination' && <EliminationScreen key="elimination" />}
      {(phase === 'game_over' || phase === 'stats') && <GameOver key="game_over" />}
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  );
}
