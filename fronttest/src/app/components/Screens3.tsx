import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { motion } from 'motion/react';
import { Trophy, Bot, Target, Shield, Skull, CheckCircle, Search, HeartPulse, Sparkles, RefreshCcw } from 'lucide-react';

const Button = ({ children, onClick, disabled, variant = 'primary', className = '' }: any) => {
  const baseStyle = "px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-700 disabled:text-gray-400",
    secondary: "bg-gray-800 hover:bg-gray-700 text-white disabled:bg-gray-800",
    outline: "border border-gray-600 hover:border-gray-400 text-gray-300"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}>
      {children}
    </button>
  );
};

export const GameOver = () => {
  const { winner, players, submitTuringTest, phase, turingStats, initializeGame, settings } = useGame();
  const [guesses, setGuesses] = useState<Record<string, boolean>>({});

  const handleGuess = (id: string, isBot: boolean) => {
    setGuesses(prev => ({ ...prev, [id]: isBot }));
  };

  const isMafiaWin = winner === 'mafia';
  const otherPlayers = players.filter(p => p.id !== 'user-1');
  const allGuessed = Object.keys(guesses).length === otherPlayers.length;

  if (phase === 'stats') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6 relative overflow-y-auto py-12">
        <div className="absolute inset-0 bg-blue-900/10" />
        <div className="z-10 w-full max-w-3xl bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-800 shadow-2xl">
          <div className="text-center mb-12">
            <Sparkles size={64} className="text-yellow-500 mx-auto mb-6" />
            <h1 className="text-5xl font-black mb-4 tracking-wider text-white">ТЕСТ ТЬЮРИНГА ЗАВЕРШЕН</h1>
            <p className="text-xl text-gray-400">Ваш результат: <span className="text-green-500 font-bold">{turingStats.correct}</span> из {turingStats.total}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            {otherPlayers.map(p => {
               const guessedBot = turingStats.guesses[p.id];
               const correct = guessedBot === p.isAI;
               return (
                 <div key={p.id} className={`p-4 rounded-xl border flex items-center justify-between ${correct ? 'bg-green-900/20 border-green-500/50' : 'bg-red-900/20 border-red-500/50'}`}>
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-400">
                        {p.isAI ? <Bot size={20} /> : <Shield size={20} />}
                     </div>
                     <div>
                       <div className="font-medium text-gray-200">{p.name}</div>
                       <div className="text-xs text-gray-500">{p.role.toUpperCase()}</div>
                     </div>
                   </div>
                   <div className="text-sm font-medium">
                      {correct ? <span className="text-green-400 flex items-center gap-1"><CheckCircle size={16}/> Верно</span> : <span className="text-red-400 flex items-center gap-1"><Skull size={16}/> Ошибка</span>}
                   </div>
                 </div>
               );
            })}
          </div>

          <Button onClick={() => window.location.reload()} className="w-full text-lg py-4">
             <RefreshCcw size={20} /> Сыграть снова
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6 relative overflow-y-auto py-12">
      <div className={`absolute inset-0 ${isMafiaWin ? 'bg-red-900/20' : 'bg-green-900/20'}`} />
      
      <div className="z-10 w-full max-w-4xl">
        <div className="text-center mb-16">
          <Trophy size={80} className={`mx-auto mb-6 ${isMafiaWin ? 'text-red-600' : 'text-green-500'}`} />
          <h1 className={`text-6xl font-black mb-4 tracking-wider uppercase ${isMafiaWin ? 'text-red-600' : 'text-green-500'}`}>
            ПОБЕДА {isMafiaWin ? 'МАФИИ' : 'МИРНЫХ'}
          </h1>
          <p className="text-xl text-gray-400">Город узнал правду. Теперь настало время для Теста Тьюринга.</p>
        </div>

        <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-800 shadow-2xl mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-blue-400 flex items-center justify-center gap-2"><Bot size={28}/> ТЕСТ ТЬЮРИНГА</h2>
          <p className="text-center text-gray-400 mb-8">Кто из этих игроков был ботом, а кто живым человеком?</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {otherPlayers.map(p => (
              <div key={p.id} className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 flex flex-col items-center">
                <div className="font-bold text-lg mb-1">{p.name}</div>
                <div className="text-sm text-gray-500 mb-4">{p.role === 'mafia' ? 'Мафия' : p.role === 'detective' ? 'Комиссар' : p.role === 'doctor' ? 'Доктор' : 'Мирный житель'}</div>
                
                <div className="flex gap-2 w-full">
                  <button 
                    onClick={() => handleGuess(p.id, false)}
                    className={`flex-1 py-2 px-3 rounded text-sm transition-colors flex items-center justify-center gap-1
                      ${guesses[p.id] === false ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                  >
                    Человек
                  </button>
                  <button 
                    onClick={() => handleGuess(p.id, true)}
                    className={`flex-1 py-2 px-3 rounded text-sm transition-colors flex items-center justify-center gap-1
                      ${guesses[p.id] === true ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                  >
                    AI Бот
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
             <Button onClick={() => submitTuringTest(guesses)} disabled={!allGuessed} className="px-12 py-4 text-lg">
               Узнать результаты
             </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
