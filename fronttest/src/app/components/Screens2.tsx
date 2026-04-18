import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { motion } from 'motion/react';
import { Send, Clock, Skull, Check, X, Shield, Users } from 'lucide-react';

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

export const DayPhase = () => {
  const { chat, mainPlayerId, addChatMessage, dayCount, timer, players, myPlayer } = useGame();
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && myPlayer?.isAlive) {
      addChatMessage(input.trim(), false, mainPlayerId);
      setInput('');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 p-4 flex justify-between items-center shadow-md z-10">
        <div>
          <h2 className="text-xl font-bold tracking-widest text-yellow-500">ДЕНЬ {dayCount}</h2>
          <p className="text-sm text-gray-400">Обсуждение и поиск мафии</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-full font-mono text-lg text-red-400">
          <Clock size={20} />
          {timer}с
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chat.map(msg => {
          if (msg.isSystem) {
            return (
              <div key={msg.id} className="text-center text-sm text-gray-500 my-4 italic">
                — {msg.text} —
              </div>
            );
          }
          const isMe = msg.senderId === mainPlayerId;
          const sender = players.find(p => p.id === msg.senderId);
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isMe ? 'bg-red-600/90 text-white rounded-tr-sm' : 'bg-gray-800 text-gray-100 rounded-tl-sm'}`}>
                {!isMe && <div className="text-xs text-gray-400 font-medium mb-1">{sender?.name}</div>}
                <div className="leading-relaxed">{msg.text}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="p-4 bg-gray-900 border-t border-gray-800">
        <form onSubmit={handleSend} className="flex gap-2 max-w-3xl mx-auto w-full">
          <input 
            type="text" 
            value={input} 
            onChange={e => setInput(e.target.value)}
            disabled={!myPlayer?.isAlive}
            placeholder={myPlayer?.isAlive ? "Напишите сообщение..." : "Вы мертвы и не можете писать."}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 focus:outline-none focus:border-red-500 transition-colors disabled:opacity-50"
          />
          <Button disabled={!input.trim() || !myPlayer?.isAlive} className="px-4">
            <Send size={20} />
          </Button>
        </form>
      </div>
    </motion.div>
  );
};

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
