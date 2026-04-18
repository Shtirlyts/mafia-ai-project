import { useGame } from '@/context/GameContext';
import { motion } from 'motion/react';
import { Skull, Shield } from 'lucide-react';

export const EliminationScreen = () => {
  const { eliminatedPlayer } = useGame();
  
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 relative">
      <div className="absolute inset-0 bg-red-900/10" />
      <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="z-10 text-center">
        {eliminatedPlayer ? (
          <>
            <Skull size={80} className="text-red-600 mx-auto mb-8 animate-pulse" />
            <h2 className="text-2xl text-gray-400 mb-2">Город покинул</h2>
            <h1 className="text-5xl font-black tracking-wider text-red-500 mb-6">{eliminatedPlayer.name}</h1>
            <p className="text-xl text-gray-300">Это был {eliminatedPlayer.role === 'mafia' ? 'Мафия' : 'Мирный житель'}</p>
          </>
        ) : (
          <>
            <Shield size={80} className="text-gray-600 mx-auto mb-8" />
            <h1 className="text-4xl font-black tracking-wider text-gray-400 mb-6">Никто не покинул город</h1>
            <p className="text-xl text-gray-500">Голоса разделились или доктор спас жертву.</p>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};
