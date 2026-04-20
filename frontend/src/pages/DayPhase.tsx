import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { motion } from 'motion/react';
import { Send, Clock } from 'lucide-react';
import { Button } from '@/components/ui';

export const DayPhase = () => {
  const { chat, mainPlayerId, addChatMessage, dayCount, timer, players, myPlayer } = useGame();
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
    console.log('DayPhase chat updated:', chat.length, 'messages');
    if (chat.length > 0) {
      console.log('Last message:', chat[chat.length - 1]);
    }
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
          <Button onClick={() => {}} disabled={!input.trim() || !myPlayer?.isAlive} className="px-4">
            <Send size={20} />
          </Button>
        </form>
      </div>
    </motion.div>
  );
};
