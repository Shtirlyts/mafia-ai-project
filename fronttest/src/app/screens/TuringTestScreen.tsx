import React from 'react';
import { useGame } from '../context/GameContext';
import { Bot, User, Brain, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';

export const TuringTestScreen = () => {
  const { phase, players, myId, turingGuesses, submitTuringGuess, finishTuringTest, resetGame } = useGame();

  const otherPlayers = players.filter(p => p.id !== myId);

  const correctGuesses = otherPlayers.reduce((count, p) => {
    const guessedAI = turingGuesses[p.id] ?? false; // false = default to human
    if (guessedAI === p.isAI) return count + 1;
    return count;
  }, 0);

  const isResults = phase === 'turing_results';

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-white">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 bg-purple-500/20 text-purple-500">
            <Brain size={40} />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {isResults ? 'Результаты Теста Тьюринга' : 'Тест Тьюринга'}
          </h1>
          <p className="text-neutral-400">
            {isResults 
              ? `Вы угадали ${correctGuesses} из ${otherPlayers.length} игроков!`
              : 'Смогли ли вы отличить людей от искусственного интеллекта? Выберите, кто по вашему мнению был ботом.'
            }
          </p>
        </div>

        <div className="space-y-3 mb-8">
          {otherPlayers.map(p => {
            const isGuessedAI = turingGuesses[p.id] ?? false;
            const isCorrect = isGuessedAI === p.isAI;

            return (
              <div key={p.id} className="flex items-center justify-between bg-black border border-neutral-800 p-4 rounded-xl">
                <div className="font-bold text-lg">{p.name}</div>
                
                {isResults ? (
                  <div className="flex items-center space-x-4">
                    <div className={`px-3 py-1 rounded-lg text-sm font-bold flex items-center space-x-2 ${
                      isCorrect ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                    }`}>
                      {isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                      <span>{p.isAI ? 'Был AI' : 'Был человек'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex bg-neutral-900 rounded-lg p-1 border border-neutral-800">
                    <button
                      onClick={() => submitTuringGuess(p.id, false)}
                      className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${
                        turingGuesses[p.id] === false ? 'bg-white text-black font-bold' : 'text-neutral-500 hover:text-white'
                      }`}
                    >
                      <User size={16} />
                      <span>Человек</span>
                    </button>
                    <button
                      onClick={() => submitTuringGuess(p.id, true)}
                      className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${
                        turingGuesses[p.id] === true ? 'bg-blue-600 text-white font-bold' : 'text-neutral-500 hover:text-white'
                      }`}
                    >
                      <Bot size={16} />
                      <span>AI</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-center">
          {!isResults ? (
            <button 
              onClick={finishTuringTest}
              disabled={Object.keys(turingGuesses).length !== otherPlayers.length}
              className={`font-bold px-8 py-4 rounded-xl transition-colors w-full ${
                Object.keys(turingGuesses).length === otherPlayers.length 
                  ? 'bg-white text-black hover:bg-neutral-200' 
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              }`}
            >
              Проверить результаты
            </button>
          ) : (
            <button 
              onClick={resetGame}
              className="flex items-center justify-center space-x-2 bg-neutral-800 text-white font-bold px-8 py-4 rounded-xl hover:bg-neutral-700 transition-colors w-full"
            >
              <RotateCcw size={20} />
              <span>Сыграть еще раз</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
