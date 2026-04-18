import { useGame } from '@/context/GameContext';
import { motion } from 'motion/react';
import { Bot, User } from 'lucide-react';
import { Button } from '@/components/ui';

export const Lobby = () => {
  const { players, startGameFromLobby, settings } = useGame();
  
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center min-h-screen bg-gray-950 text-white p-6">
      <div className="w-full max-w-2xl mt-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Лобби</h2>
          <span className="bg-gray-800 px-4 py-1 rounded-full text-sm text-gray-300">{players.length} / {settings.totalPlayers} Игроков</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {players.map(p => (
            <div key={p.id} className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex items-center gap-3 relative overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 shrink-0">
                {p.isAI ? <Bot size={20} /> : <User size={20} />}
              </div>
              <div className="min-w-0">
                <div className="font-medium text-gray-200 truncate">{p.name}</div>
                <div className="text-xs text-gray-500">{p.isAI ? 'AI Агент' : 'Вы'}</div>
              </div>
            </div>
          ))}
          {Array.from({ length: settings.totalPlayers - players.length }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-gray-900/50 border border-dashed border-gray-800 p-4 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-800/50 animate-pulse" />
              <div className="h-4 w-20 bg-gray-800/50 rounded animate-pulse" />
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <Button onClick={startGameFromLobby} disabled={players.length < settings.totalPlayers} className="w-full md:w-auto px-12">
            Начать партию
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
