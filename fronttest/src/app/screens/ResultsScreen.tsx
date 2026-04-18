import React from 'react';
import { useGame } from '../context/GameContext';
import { Trophy, Users, Skull, ChevronRight, User } from 'lucide-react';
import { motion } from 'motion/react';
import { ROLE_DETAILS } from '../constants';

export const ResultsScreen = () => {
  const { winner, players, startTuringTest, settings } = useGame();

  const handleNext = () => {
    startTuringTest();
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-white">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-3xl p-8"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 bg-yellow-500/20 text-yellow-500">
            <Trophy size={48} />
          </div>
          <h1 className="text-4xl font-extrabold mb-4">
            {winner === 'mafia' ? 'Победа Мафии' : 'Победа Мирных'}
          </h1>
          <p className="text-neutral-400 text-lg">Игра завершена. Роли раскрыты.</p>
        </div>

        <div className="space-y-4 mb-10 max-h-[50vh] overflow-y-auto pr-2">
          {players.map(p => (
            <div key={p.id} className="flex items-center justify-between bg-black border border-neutral-800 p-4 rounded-xl">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400">
                    <User size={24} />
                  </div>
                  {!p.isAlive && (
                    <div className="absolute -inset-1 bg-red-500/20 rounded-full flex items-center justify-center">
                      <Skull size={28} className="text-red-500" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-bold text-lg">{p.name} {p.isAI ? '(AI)' : '(Человек)'}</div>
                  <div className="text-sm text-neutral-500 flex items-center">
                    {p.isAlive ? 'Выжил' : 'Убит'} • {ROLE_DETAILS[p.role!]?.name}
                  </div>
                </div>
              </div>
              <div className={`p-3 rounded-xl ${
                p.role === 'mafia' ? 'bg-red-500/10 text-red-500' :
                p.role === 'doctor' ? 'bg-green-500/10 text-green-500' :
                p.role === 'detective' ? 'bg-blue-500/10 text-blue-500' :
                'bg-neutral-800 text-white'
              }`}>
                {p.role === 'mafia' ? <Skull size={24} /> : p.role === 'doctor' ? <Shield size={24} /> : p.role === 'detective' ? <Search size={24} /> : <Users size={24} />}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <button 
            onClick={handleNext}
            className="flex items-center space-x-2 bg-white text-black font-bold px-8 py-4 rounded-xl hover:bg-neutral-200 transition-colors"
          >
            <span>Тест Тьюринга</span>
            <ChevronRight size={20} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

function Shield(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> }
function Search(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg> }
