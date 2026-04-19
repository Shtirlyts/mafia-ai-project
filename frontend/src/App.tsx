import { AnimatePresence } from "motion/react";
import { MainMenu } from "@/pages/MainMenu";
import { Lobby } from "@/pages/Lobby";
import { RoleReveal } from "@/pages/RoleReveal";
import { NightPhase } from "@/pages/NightPhase";
import { DayPhase } from "@/pages/DayPhase";
import { VotingPhase } from "@/pages/VotingPhase";
import { EliminationScreen } from "@/pages/EliminationScreen";
import { GameOver } from "@/pages/GameOver";
import { GameProvider, useGame } from "@/context/GameContext";

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
