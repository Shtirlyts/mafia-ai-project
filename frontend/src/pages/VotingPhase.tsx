import { useState } from 'react';
import { motion } from 'motion/react';
import { Clock, Skull } from 'lucide-react';
import { useGame } from '@/context/GameContext';

export const VotingPhase = () => {
  const { players, timer, submitVote, myPlayer } = useGame();
  const [votedId, setVotedId] = useState<string | null>(null);

  const handleVote = (id: string) => {
    setVotedId(id);
    submitVote(id);
  };

  const targets = players.filter(p => p.isAlive && p.id !== myPlayer?.id);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-3xl w-full mx-auto mt-12">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-bold tracking-widest text-red-500 mb-2">ГОЛОСОВАНИЕ</h2>
            <p className="text-gray-400">Кого вы хотите исключить?</p>
          </div>
          <div className="flex items-center gap-2 bg-gray-900 px-6 py-3 rounded-full font-mono text-2xl font-bold text-red-400 border border-gray-800">
            <Clock size={24} />
            {timer}с
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {targets.map(p => (
            <div 
              key={p.id} onClick={() => myPlayer?.isAlive && handleVote(p.id)}
              className={`bg-gray-900 border p-4 rounded-xl flex flex-col items-center gap-3 transition-all
                ${!myPlayer?.isAlive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-600'}
                ${votedId === p.id ? 'border-red-500 bg-red-900/20' : 'border-gray-800'}`}
            >
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-2">
                 <Skull size={32} className={votedId === p.id ? 'text-red-500' : 'text-gray-500'} />
              </div>
              <div className="font-medium text-center text-lg">{p.name}</div>
            </div>
          ))}
        </div>
        {!myPlayer?.isAlive && (
          <div className="text-center text-gray-500 text-lg mt-8">Вы мертвы и не можете голосовать. Наблюдайте за городом.</div>
        )}
      </div>
    </motion.div>
  );
};
