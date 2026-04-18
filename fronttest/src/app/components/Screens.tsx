import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, User, Shield, Target, Eye, Users, Settings, Play, Send, Skull, LogOut, Check, X, Search, HeartPulse } from 'lucide-react';
import { Player } from '../types';

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

export const MainMenu = () => {
  const { initializeGame } = useGame();
  const [totalPlayers, setTotalPlayers] = useState(6);
  const [mode, setMode] = useState<'mixed' | 'ai_only' | 'human_only'>('mixed');

  const getRolesCount = (total: number) => {
    let mafia = 1;
    let detective = 1;
    let doctor = 1;
    if (total >= 8) mafia = 2;
    if (total >= 12) mafia = 3;
    if (total < 7) doctor = 0;
    return { mafia, detective, doctor };
  };

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
              <button onClick={() => setMode('mixed')} className={`py-2 px-1 text-xs rounded-md transition-colors ${mode === 'mixed' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>Смешанный</button>
              <button onClick={() => setMode('ai_only')} className={`py-2 px-1 text-xs rounded-md transition-colors ${mode === 'ai_only' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>AI Боты</button>
              <button disabled className={`py-2 px-1 text-xs rounded-md transition-colors opacity-30 cursor-not-allowed bg-gray-800 text-gray-400`}>Люди</button>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-800">
            <div className="flex justify-between text-xs text-gray-400 mb-6 px-2">
              <span className="flex items-center gap-1"><Target size={14} className="text-red-500"/> {getRolesCount(totalPlayers).mafia}</span>
              <span className="flex items-center gap-1"><Search size={14} className="text-blue-500"/> {getRolesCount(totalPlayers).detective}</span>
              <span className="flex items-center gap-1"><HeartPulse size={14} className="text-green-500"/> {getRolesCount(totalPlayers).doctor}</span>
            </div>
            
            <Button onClick={() => initializeGame(mode, totalPlayers, getRolesCount(totalPlayers))} className="w-full">
              <Play size={20} /> Создать игру
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

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

export const RoleReveal = () => {
  const { myPlayer, nextPhase } = useGame();
  
  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'mafia': return { title: 'МАФИЯ', desc: 'Убивайте мирных жителей по ночам.', color: 'text-red-600', icon: <Target size={64} className="text-red-600 mb-6" /> };
      case 'detective': return { title: 'КОМИССАР', desc: 'Проверяйте статус игроков по ночам.', color: 'text-blue-500', icon: <Search size={64} className="text-blue-500 mb-6" /> };
      case 'doctor': return { title: 'ДОКТОР', desc: 'Лечите одного игрока каждую ночь.', color: 'text-green-500', icon: <HeartPulse size={64} className="text-green-500 mb-6" /> };
      default: return { title: 'МИРНЫЙ ЖИТЕЛЬ', desc: 'Найдите мафию днем и голосуйте против них.', color: 'text-gray-300', icon: <Shield size={64} className="text-gray-400 mb-6" /> };
    }
  };

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

export const NightPhase = () => {
  const { players, myPlayer, submitNightAction, dayCount } = useGame();
  const [selected, setSelected] = useState<string | null>(null);
  
  const isNightRole = myPlayer?.isAlive && ['mafia', 'detective', 'doctor'].includes(myPlayer.role);
  const targets = players.filter(p => p.isAlive && p.id !== myPlayer?.id);

  const getActionText = () => {
    if (myPlayer?.role === 'mafia') return 'Кого убить?';
    if (myPlayer?.role === 'detective') return 'Кого проверить?';
    if (myPlayer?.role === 'doctor') return 'Кого спасти? (Можно себя)';
    return 'Город засыпает...';
  };

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
          <p className="text-gray-400 text-lg">{getActionText()}</p>
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
