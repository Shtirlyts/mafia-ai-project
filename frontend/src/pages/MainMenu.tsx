import { useState } from 'react';
import { motion } from 'motion/react';
import { Target, Users, Settings, Play, Search, HeartPulse } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { Button } from "@/components/ui";

const getRolesCount = (total: number) => {
    let mafia = 1;
    let detective = 1;
    let doctor = 1;
    if (total >= 8) mafia = 2;
    if (total >= 12) mafia = 3;
    if (total < 7) doctor = 0;
    return { mafia, detective, doctor };
  };

export const MainMenu = () => {
  const { initializeGame } = useGame();
  const [totalPlayers, setTotalPlayers] = useState(6);
  const [mode, setMode] = useState<'mixed' | 'ai_only' | 'human_only'>('mixed');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-gray-950 to-gray-950" />
      <div className="w-full max-w-md bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-800 shadow-2xl z-10">
        <h1 className="text-4xl font-bold text-center mb-2 tracking-widest text-red-600 uppercase">AI Mafia</h1>
        <p className="text-center text-gray-400 mb-8 text-sm">Сможешь ли ты обмануть искусственный интеллект?</p>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm text-gray-400 flex justify-between items-center">
              <span className="flex items-center gap-2"><Users size={16}/> Игроков:</span>
              <span className="text-white font-medium">{totalPlayers}</span>
            </label>
            <input 
              type="range" min="5" max="15" value={totalPlayers} 
              onChange={(e) => setTotalPlayers(Number(e.target.value))}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm text-gray-400 flex items-center gap-2"><Settings size={16}/> Режим</label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => setMode('mixed')}
                variant={mode === 'mixed' ? 'primary' : 'secondary'}
                className={`py-2 px-1 text-xs rounded-md transition-colors`}
              >
                Смешанный
              </Button>
              <Button
                onClick={() => setMode('ai_only')}
                variant={mode === 'ai_only' ? 'primary' : 'secondary'}
                className={`py-2 px-1 text-xs rounded-md transition-colors`}
              >
                AI Боты
              </Button>
              <Button onClick={() => setMode('human_only')} disabled className={`py-2 px-1 text-xs rounded-md transition-colors opacity-30 cursor-not-allowed bg-gray-800 text-gray-400`}>Люди</Button>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-800">
            <div className="flex justify-between text-xs text-gray-400 mb-6 px-2">
              <span className="flex items-center gap-1"><Target size={14} className="text-red-500"/> {getRolesCount(totalPlayers).mafia}</span>
              <span className="flex items-center gap-1"><Search size={14} className="text-blue-500"/> {getRolesCount(totalPlayers).detective}</span>
              <span className="flex items-center gap-1"><HeartPulse size={14} className="text-green-500"/> {getRolesCount(totalPlayers).doctor}</span>
            </div>
            
            <Button onClick={() => initializeGame(mode, totalPlayers, getRolesCount(totalPlayers))} variant='primary' className="w-full">
              <Play size={20} /> Создать игру
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
