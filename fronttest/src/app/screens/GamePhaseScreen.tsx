import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Moon, Sun, Clock, Skull, Shield, Search, User, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ROLE_DETAILS, BOT_PHRASES } from '../constants';

export const GamePhaseScreen = () => {
  const { phase, dayNumber, players, myId, nextPhase, sendMessage, sendBotMessage, messages, settings, performNightAction, castVote, votes, nightActions } = useGame();
  
  const [timeLeft, setTimeLeft] = useState(0);
  const [chatInput, setChatInput] = useState('');

  const me = players.find(p => p.id === myId);
  const isSpectator = settings.mode === 'ai_only' || !me;
  const amIAlive = me?.isAlive ?? false;

  // Bot simulation
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (phase === 'day') {
      const aliveBots = players.filter(p => p.isAlive && p.isAI);
      
      const simulateBotChat = () => {
        if (aliveBots.length === 0 || phase !== 'day') return;
        
        const bot = aliveBots[Math.floor(Math.random() * aliveBots.length)];
        const phraseTypes = Object.values(BOT_PHRASES);
        const randomType = phraseTypes[Math.floor(Math.random() * phraseTypes.length)];
        let text = randomType[Math.floor(Math.random() * randomType.length)];
        
        if (text.includes('{target}')) {
          const others = players.filter(p => p.id !== bot.id && p.isAlive);
          if (others.length > 0) {
            const target = others[Math.floor(Math.random() * others.length)];
            text = text.replace('{target}', target.name);
          } else {
            text = text.replace('{target}', 'кого-то');
          }
        }

        sendBotMessage(bot.id, text);
      };

      const interval = setInterval(simulateBotChat, 6000);
      return () => clearInterval(interval);
    }
  }, [phase, players, sendBotMessage]);

  // Phase timers
  useEffect(() => {
    let duration = 30; // default day
    if (phase === 'night') duration = 15;
    if (phase === 'voting') duration = 15;

    setTimeLeft(duration);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          nextPhase();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, dayNumber, nextPhase]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() && amIAlive) {
      sendMessage(chatInput);
      setChatInput('');
    }
  };

  const getRoleIcon = (roleName: string | null) => {
    if (roleName === 'mafia') return <Skull size={18} />;
    if (roleName === 'doctor') return <Shield size={18} />;
    if (roleName === 'detective') return <Search size={18} />;
    return <User size={18} />;
  };

  const activeVotedTarget = votes[myId || ''] || null;

  return (
    <div className="flex h-screen bg-neutral-950 overflow-hidden">
      
      {/* Sidebar - Players */}
      <div className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col h-full">
        <div className="p-4 border-b border-neutral-800">
          <h2 className="text-xl font-bold text-white flex items-center justify-between">
            Игроки
            <span className="text-xs bg-neutral-800 px-2 py-1 rounded-full">{players.filter(p=>p.isAlive).length} живы</span>
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {players.map(p => (
            <div 
              key={p.id} 
              className={`flex items-center p-3 rounded-xl border transition-all ${
                !p.isAlive ? 'opacity-40 grayscale border-neutral-800' : 
                p.id === myId ? 'bg-neutral-800 border-neutral-700' : 'bg-black border-neutral-800'
              }`}
            >
              <div className="relative mr-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-neutral-800 text-neutral-400`}>
                  <User size={20} />
                </div>
                {!p.isAlive && (
                  <div className="absolute -inset-1 bg-red-500/20 rounded-full flex items-center justify-center">
                    <Skull size={24} className="text-red-500" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {p.name} {p.id === myId && '(Вы)'}
                </div>
                {(!p.isAlive || p.id === myId || phase === 'results') && p.role && (
                  <div className="text-xs text-neutral-400 flex items-center mt-0.5">
                    {ROLE_DETAILS[p.role].name}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Current User Status Footer */}
        {me && (
          <div className="p-4 border-t border-neutral-800 bg-black">
            <div className="flex items-center space-x-3 mb-2">
              <div className={`p-2 rounded-lg ${
                me.role === 'mafia' ? 'bg-red-500/20 text-red-500' :
                me.role === 'doctor' ? 'bg-green-500/20 text-green-500' :
                me.role === 'detective' ? 'bg-blue-500/20 text-blue-500' :
                'bg-neutral-800 text-white'
              }`}>
                {getRoleIcon(me.role)}
              </div>
              <div>
                <div className="text-xs text-neutral-500">Ваша роль</div>
                <div className="font-bold text-white">{me.role ? ROLE_DETAILS[me.role].name : 'Зритель'}</div>
              </div>
            </div>
            {!me.isAlive && (
              <div className="text-red-500 text-xs font-bold uppercase tracking-wider mt-2">Вы убиты</div>
            )}
          </div>
        )}
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col relative bg-neutral-950">
        
        {/* Header */}
        <div className="h-16 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between px-6 shrink-0 backdrop-blur-md">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-4 py-1.5 rounded-full ${
              phase === 'night' ? 'bg-indigo-900/50 text-indigo-300 border border-indigo-500/30' : 
              phase === 'day' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' :
              'bg-red-500/10 text-red-500 border border-red-500/30'
            }`}>
              {phase === 'night' ? <Moon size={18} /> : phase === 'day' ? <Sun size={18} /> : <Skull size={18} />}
              <span className="font-bold uppercase tracking-wider text-sm">
                {phase === 'night' ? 'Ночь' : phase === 'day' ? 'День' : 'Голосование'} {dayNumber}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-neutral-300 font-mono bg-black px-4 py-1.5 rounded-lg border border-neutral-800">
              <Clock size={16} />
              <span>00:{timeLeft.toString().padStart(2, '0')}</span>
            </div>
            <button 
              onClick={nextPhase}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs text-white rounded-lg transition-colors border border-neutral-700"
            >
              Скип
            </button>
          </div>
        </div>

        {/* Dynamic Content Body */}
        <div className="flex-1 overflow-y-auto p-6 relative">
          
          {phase === 'night' && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-full space-y-8"
            >
              <Moon size={64} className="text-indigo-500/50 mb-4" />
              <h1 className="text-3xl font-bold text-white text-center">Город засыпает</h1>
              
              {!isSpectator && amIAlive && me?.role !== 'citizen' && (
                <div className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-2">{ROLE_DETAILS[me.role].name} - Ваш ход</h3>
                  <p className="text-neutral-400 mb-6">{ROLE_DETAILS[me.role].description}</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {players.filter(p => p.isAlive && p.id !== myId).map(p => {
                      const isSelected = 
                        (me.role === 'mafia' && nightActions.mafiaTarget === p.id) ||
                        (me.role === 'doctor' && nightActions.doctorTarget === p.id) ||
                        (me.role === 'detective' && nightActions.detectiveTarget === p.id);
                        
                      return (
                        <button
                          key={p.id}
                          onClick={() => performNightAction(p.id)}
                          className={`p-4 rounded-xl border flex items-center space-x-3 transition-all ${
                            isSelected 
                              ? 'bg-neutral-800 border-white text-white scale-[1.02]' 
                              : 'bg-black border-neutral-800 text-neutral-400 hover:border-neutral-600'
                          }`}
                        >
                          <User size={20} />
                          <span>{p.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {(!amIAlive || me?.role === 'citizen' || isSpectator) && (
                <p className="text-neutral-500 text-lg text-center animate-pulse">Ожидание действий других игроков...</p>
              )}
            </motion.div>
          )}

          {(phase === 'day' || phase === 'voting') && (
            <div className="max-w-3xl mx-auto h-full flex flex-col">
              
              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-6 pb-4">
                {messages.map((msg, idx) => {
                  const isSys = msg.senderId === 'system';
                  const isMe = msg.senderId === myId;
                  const sender = players.find(p => p.id === msg.senderId);
                  
                  if (isSys) {
                    return (
                      <div key={idx} className="flex justify-center my-6">
                        <span className="bg-neutral-800/80 backdrop-blur px-4 py-1.5 rounded-full text-xs font-medium text-neutral-300 shadow-sm border border-neutral-700/50">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-xs text-neutral-500 mb-1 px-1">{sender?.name || 'Unknown'}</span>
                      <div className={`px-4 py-3 rounded-2xl max-w-[80%] ${
                        isMe ? 'bg-white text-black rounded-tr-none' : 'bg-neutral-900 border border-neutral-800 text-white rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              
              {/* Voting Interface overlay/panel */}
              {phase === 'voting' && amIAlive && !isSpectator && (
                <div className="bg-neutral-900 border-t border-neutral-800 p-4 -mx-6 bg-red-950/20">
                  <h3 className="text-red-500 font-bold mb-3 flex items-center"><Skull size={18} className="mr-2"/> Голосование</h3>
                  <div className="flex space-x-3 overflow-x-auto pb-2">
                    {players.filter(p => p.isAlive).map(p => (
                      <button
                        key={p.id}
                        onClick={() => castVote(p.id)}
                        className={`flex-shrink-0 px-4 py-2 rounded-xl border whitespace-nowrap transition-all ${
                          activeVotedTarget === p.id 
                            ? 'bg-red-600 border-red-500 text-white' 
                            : 'bg-black border-neutral-800 text-neutral-400 hover:border-neutral-600'
                        }`}
                      >
                        {p.name} {p.id === myId && '(Вы)'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Input */}
              {phase === 'day' && amIAlive && !isSpectator && (
                <form onSubmit={handleSendChat} className="mt-auto relative">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Написать в чат..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-4 pr-12 py-4 text-white focus:outline-none focus:border-neutral-600"
                  />
                  <button type="submit" className="absolute right-2 top-2 bottom-2 aspect-square bg-white text-black rounded-lg flex items-center justify-center hover:bg-neutral-200 transition-colors">
                    <MessageSquare size={18} />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
