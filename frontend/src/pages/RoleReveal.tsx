import { motion } from 'motion/react';
import { Shield, Target, Search, HeartPulse } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { Button } from "@/components/ui";

const getRoleInfo = (role: string) => {
    switch (role) {
      case 'mafia': return { title: 'МАФИЯ', desc: 'Убивайте мирных жителей по ночам.', color: 'text-red-600', icon: <Target size={64} className="text-red-600 mb-6" /> };
      case 'detective': return { title: 'КОМИССАР', desc: 'Проверяйте статус игроков по ночам.', color: 'text-blue-500', icon: <Search size={64} className="text-blue-500 mb-6" /> };
      case 'doctor': return { title: 'ДОКТОР', desc: 'Лечите одного игрока каждую ночь.', color: 'text-green-500', icon: <HeartPulse size={64} className="text-green-500 mb-6" /> };
      default: return { title: 'МИРНЫЙ ЖИТЕЛЬ', desc: 'Найдите мафию днем и голосуйте против них.', color: 'text-gray-300', icon: <Shield size={64} className="text-gray-400 mb-6" /> };
    }
  };

export const RoleReveal = () => {
  const { myPlayer, nextPhase } = useGame();

  const info = getRoleInfo(myPlayer?.role || 'villager');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }}
        className="text-center flex flex-col items-center"
      >
        <h2 className="text-gray-500 mb-8 uppercase tracking-widest text-sm">Ваша роль</h2>
        {info.icon}
        <h1 className={`text-5xl font-black mb-4 tracking-wider ${info.color}`}>{info.title}</h1>
        <p className="text-gray-400 max-w-md text-lg mb-12">{info.desc}</p>
        
        <Button onClick={nextPhase} className="px-12 py-4 text-lg">Понятно</Button>
      </motion.div>
    </motion.div>
  );
};
