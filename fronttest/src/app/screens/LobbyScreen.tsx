import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Users, Link as LinkIcon, Bot, User, Play } from 'lucide-react';
import { motion } from 'motion/react';

export const LobbyScreen = () => {
  const { startLobby, joinLobby, startGameFromLobby, players, settings, roomCode, playerId, isHost } = useGame();
  const [name, setName] = useState('');
  const [joinRoomCode, setJoinRoomCode] = useState('');

  const isJoined = playerId !== null;

  const handleCreateLobby = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      startLobby(name, settings);
    }
  };

  const handleJoinLobby = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && joinRoomCode.trim()) {
      joinLobby(joinRoomCode, name);
    }
  };

  const copyInvite = () => {
    const inviteUrl = `${window.location.origin}/room/${roomCode}`;
    navigator.clipboard.writeText(inviteUrl);
    alert("Ссылка скопирована!");
  };

  if (!isJoined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-neutral-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-neutral-900 p-8 rounded-2xl border border-neutral-800"
        >
          <h2 className="text-2xl font-bold mb-6 text-center text-white">Вход в лобби</h2>
          <div className="space-y-6">
            <form onSubmit={handleCreateLobby} className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Создать комнату</h3>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Ваше имя</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="Например: Игрок 1"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl py-3 transition-colors"
              >
                Создать лобби
              </button>
            </form>

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-neutral-800"></div>
              <span className="mx-4 text-neutral-500 text-sm">или</span>
              <div className="flex-grow border-t border-neutral-800"></div>
            </div>

            <form onSubmit={handleJoinLobby} className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Присоединиться к комнате</h3>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Код комнаты</label>
                <input
                  type="text"
                  value={joinRoomCode}
                  onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                  className="w-full bg-black border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="Например: A6C201"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">Ваше имя</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="Например: Игрок 1"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl py-3 transition-colors"
              >
                Присоединиться
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-neutral-950">
      <div className="max-w-3xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-2">Лобби #{roomCode}</h2>
            <p className="text-neutral-400 text-sm mb-6">
              Ждем игроков... Недостающие слоты будут заполнены AI (минимум 5 игроков).
            </p>
            
            <div className="bg-black border border-neutral-800 rounded-xl p-4 flex items-center justify-between mb-8">
              <span className="text-neutral-300 truncate mr-4">{window.location.origin}/room/{roomCode}</span>
              <button onClick={copyInvite} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white transition-colors">
                <LinkIcon size={18} />
              </button>
            </div>

            {isHost && (
              <button
                onClick={startGameFromLobby}
                className="w-full flex items-center justify-center space-x-2 bg-white text-black font-bold rounded-xl py-4 hover:bg-neutral-200 transition-colors"
              >
                <Play size={20} />
                <span>Начать игру (Автозаполнение AI)</span>
              </button>
            )}
            {!isHost && (
              <div className="text-center text-neutral-400 text-sm py-2">
                Ожидаем, когда хост начнет игру...
              </div>
            )}
          </div>
          
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4">Настройки партии</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-400">Режим</span>
                <span className="text-white capitalize">{settings.mode.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-400">Минимум игроков</span>
                <span className="text-white">5</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-neutral-400">Роли</span>
                <span className="text-white">Мафия (1), Док (1), Ком (1), Мирные (2+)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center">
              <Users size={20} className="mr-2" />
              Игроки в лобби
            </h3>
            <span className="bg-neutral-800 text-neutral-300 text-xs px-2 py-1 rounded-full">
              {players.length} / 5+
            </span>
          </div>
          
          <div className="flex-1 space-y-3 overflow-y-auto">
            {players.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-black border border-neutral-800 rounded-xl p-3 flex items-center"
              >
                <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 mr-4">
                  {p.isAI ? <Bot size={20} /> : <User size={20} />}
                </div>
                <div>
                  <div className="font-medium text-white">{p.name} {p.id === playerId && "(Вы)"}</div>
                  <div className="text-xs text-neutral-500">Готов к игре</div>
                </div>
              </motion.div>
            ))}
            {players.length === 0 && (
              <div className="text-center text-neutral-500 text-sm py-10">
                Пока никого нет...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
