import { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { motion } from 'motion/react';
import { User, Eye } from 'lucide-react';
import { Player } from '@/types';
import { Button } from '@/components/ui';

const getActionText = (myPlayer: Player) => {
    if (myPlayer?.role === 'mafia') return 'Кого убить?';
    if (myPlayer?.role === 'detective') return 'Кого проверить?';
    if (myPlayer?.role === 'doctor') return 'Кого спасти? (Можно себя)';
    return 'Город засыпает...';
  };

export const NightPhase = () => {
  const { players, myPlayer, submitNightAction, dayCount } = useGame();
  const [selected, setSelected] = useState<string | null>(null);
  
  const isNightRole = myPlayer?.isAlive && ['mafia', 'detective', 'doctor'].includes(myPlayer.role);
  const targets = players.filter(p => p.isAlive && p.id !== myPlayer?.id);

  if (!myPlayer?.isAlive || !isNightRole) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6 relative">
         <div className="absolute inset-0 bg-blue-900/5" />
         <Eye size={48} className="text-blue-900 mb-6 animate-pulse" />
         <h2 className="text-3xl font-light text-blue-200 tracking-widest mb-2">НОЧЬ {dayCount}</h2>
         <p className="text-gray-500">Ожидание действий других игроков...</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-3xl w-full mx-auto mt-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-light text-blue-200 tracking-widest mb-2">НОЧЬ {dayCount}</h2>
          <p className="text-gray-400 text-lg">{getActionText(myPlayer)}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {myPlayer.role === 'doctor' && (
             <div 
               onClick={() => setSelected(myPlayer.id)}
               className={`bg-gray-900 border p-4 rounded-xl cursor-pointer transition-all flex flex-col items-center gap-3 ${selected === myPlayer.id ? 'border-green-500 bg-green-900/20' : 'border-gray-800 hover:border-gray-600'}`}
             >
               <User size={32} className={selected === myPlayer.id ? 'text-green-500' : 'text-gray-500'} />
               <div className="font-medium text-center">Вы (Себя)</div>
             </div>
          )}
          {targets.map(p => {
             // Mafia shouldn't kill mafia, though they can if they want. In MVP we just highlight mafia for mafia.
             const isFellowMafia = myPlayer.role === 'mafia' && p.role === 'mafia';
             
             return (
              <div 
                key={p.id} onClick={() => !isFellowMafia && setSelected(p.id)}
                className={`bg-gray-900 border p-4 rounded-xl transition-all flex flex-col items-center gap-3 
                  ${isFellowMafia ? 'opacity-50 cursor-not-allowed border-red-900/50' : 'cursor-pointer'}
                  ${selected === p.id ? 'border-white bg-gray-800' : 'border-gray-800 hover:border-gray-600'}`}
              >
                <User size={32} className={selected === p.id ? 'text-white' : (isFellowMafia ? 'text-red-900' : 'text-gray-500')} />
                <div className="font-medium text-center">{p.name} {isFellowMafia && '(Мафия)'}</div>
              </div>
            )
          })}
        </div>

        <div className="flex justify-center">
          <Button onClick={() => submitNightAction(selected!)} disabled={!selected} className="px-12">
            Подтвердить
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
