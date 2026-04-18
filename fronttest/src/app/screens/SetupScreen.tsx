import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Users, Bot, Crosshair } from 'lucide-react';
import { motion } from 'motion/react';

export const SetupScreen = () => {
  const { setupGame } = useGame();
  const [selectedMode, setSelectedMode] = useState<'mixed' | 'ai_only'>('mixed');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-neutral-950">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-neutral-900 p-8 rounded-2xl border border-neutral-800 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-red-500 mb-4">
            <Crosshair size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-white">AI Мафия</h1>
          <p className="text-neutral-400">Выберите режим игры</p>
        </div>

        <div className="space-y-4 mb-8">
          <button 
            onClick={() => setSelectedMode('mixed')}
            className={`w-full flex items-center p-4 rounded-xl border transition-all ${
              selectedMode === 'mixed' 
                ? 'bg-neutral-800 border-red-500/50' 
                : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className={`p-3 rounded-lg mr-4 ${selectedMode === 'mixed' ? 'bg-red-500/20 text-red-500' : 'bg-neutral-800 text-neutral-400'}`}>
              <Users size={24} />
            </div>
            <div className="text-left">
              <div className="font-semibold text-white">Смешанный (Люди + AI)</div>
              <div className="text-sm text-neutral-400">Скрытые агенты среди игроков</div>
            </div>
          </button>

          <button 
            onClick={() => setSelectedMode('ai_only')}
            className={`w-full flex items-center p-4 rounded-xl border transition-all ${
              selectedMode === 'ai_only' 
                ? 'bg-neutral-800 border-blue-500/50' 
                : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className={`p-3 rounded-lg mr-4 ${selectedMode === 'ai_only' ? 'bg-blue-500/20 text-blue-500' : 'bg-neutral-800 text-neutral-400'}`}>
              <Bot size={24} />
            </div>
            <div className="text-left">
              <div className="font-semibold text-white">Только AI</div>
              <div className="text-sm text-neutral-400">Понаблюдайте за партией ботов</div>
            </div>
          </button>
        </div>

        <button 
          onClick={() => setupGame(selectedMode)}
          className="w-full bg-white text-black font-semibold rounded-xl py-3 hover:bg-neutral-200 transition-colors"
        >
          Далее
        </button>
      </motion.div>
    </div>
  );
};
