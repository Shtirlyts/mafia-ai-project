import { useState } from 'react';
import { Moon, Sun, Clock, Send, Shield, Skull, Users } from 'lucide-react';
import type { Player, Message, GamePhase, PlayerRole, NightAction } from '../types/game.types';

interface GameScreenProps {
  playerRole: PlayerRole;
  players: Player[];
  messages: Message[];
  phase: GamePhase;
  timeLeft: number;
  round: number;
  onVote: (playerId: string) => void;
  selectedVote: string | null;
  onSendMessage: (message: string) => void;
  nightAction?: NightAction;
  onNightAction?: (playerId: string) => void;
  selectedNightAction?: string | null;
}

export function GameScreen({
  playerRole,
  players,
  messages,
  phase,
  timeLeft,
  round,
  onVote,
  selectedVote,
  onSendMessage,
  nightAction,
  onNightAction,
  selectedNightAction
}: GameScreenProps) {
  const [messageInput, setMessageInput] = useState('');

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      onSendMessage(messageInput);
      setMessageInput('');
    }
  };

  const alivePlayers = players.filter(p => p.isAlive);
  const deadPlayers = players.filter(p => !p.isAlive);

  const getRoleColor = (role: PlayerRole): string => {
    switch (role) {
      case 'Мафия': return 'text-red-400';
      case 'Комиссар': return 'text-blue-400';
      case 'Доктор': return 'text-green-400';
      case 'Мирный житель': return 'text-gray-300';
    }
  };

  const getRoleIcon = (role: PlayerRole): string => {
    switch (role) {
      case 'Мафия': return '🔪';
      case 'Комиссар': return '🕵️';
      case 'Доктор': return '💊';
      case 'Мирный житель': return '👤';
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Header */}
      <div className={`${phase === 'night' ? 'bg-indigo-900/40' : 'bg-amber-500/20'} backdrop-blur-lg border-b border-white/10 p-4`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${phase === 'night' ? 'bg-indigo-500/30' : 'bg-amber-500/30'}`}>
              {phase === 'night' ? <Moon className="w-6 h-6 text-white" /> : <Sun className="w-6 h-6 text-white" />}
            </div>
            <div>
              <h2 className="text-white text-xl font-bold">
                {phase === 'night' ? 'Ночь' : 'День'} — Раунд {round}
              </h2>
              <p className="text-purple-200 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Осталось: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </p>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg px-4 py-2 border border-white/20">
            <p className="text-purple-200 text-sm">Ваша роль</p>
            <p className={`font-bold text-lg ${getRoleColor(playerRole)}`}>
              {getRoleIcon(playerRole)} {playerRole}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Players sidebar */}
        <div className="w-80 bg-black/20 backdrop-blur-sm border-r border-white/10 p-4 overflow-y-auto">
          <div className="mb-4">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Живые игроки ({alivePlayers.length})
            </h3>
            <div className="space-y-2">
              {alivePlayers.map((player) => (
                <div
                  key={player.id}
                  className={`bg-white/5 rounded-lg p-3 border transition-all cursor-pointer ${
                    selectedVote === player.id || selectedNightAction === player.id
                      ? 'border-purple-400 bg-purple-500/20'
                      : 'border-white/10 hover:bg-white/10'
                  }`}
                  onClick={() => {
                    if (phase === 'day') {
                      onVote(player.id);
                    } else if (nightAction?.canAct && onNightAction) {
                      onNightAction(player.id);
                    }
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      player.isAI ? 'bg-purple-500/30' : 'bg-blue-500/30'
                    }`}>
                      {player.isAI ? '🤖' : '👤'}
                    </div>
                    <span className="text-white font-medium flex-1">{player.name}</span>
                  </div>
                  {phase === 'day' && player.votes > 0 && (
                    <div className="bg-red-500/20 rounded px-2 py-1 text-xs text-red-300 border border-red-400/30">
                      Голосов: {player.votes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {deadPlayers.length > 0 && (
            <div>
              <h3 className="text-gray-400 font-semibold mb-3 flex items-center gap-2">
                <Skull className="w-5 h-5" />
                Выбывшие ({deadPlayers.length})
              </h3>
              <div className="space-y-2">
                {deadPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="bg-white/5 rounded-lg p-3 border border-white/10 opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm bg-gray-500/30">
                        💀
                      </div>
                      <span className="text-gray-400 font-medium line-through">{player.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {/* Night action panel */}
          {phase === 'night' && nightAction?.canAct && (
            <div className="bg-indigo-900/40 border-b border-white/10 p-4">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-indigo-300" />
                  <p className="text-white">
                    {nightAction.type === 'mafia' && 'Выберите жертву для устранения'}
                    {nightAction.type === 'detective' && 'Выберите игрока для проверки'}
                    {nightAction.type === 'doctor' && 'Выберите игрока для защиты'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-4xl mx-auto space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      msg.isAI ? 'bg-purple-500/30' : 'bg-blue-500/30'
                    }`}>
                      {msg.isAI ? '🤖' : '👤'}
                    </div>
                    <span className="text-white font-medium">{msg.playerName}</span>
                    <span className="text-purple-300 text-xs ml-auto">
                      {msg.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-gray-200 leading-relaxed">{msg.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Message input */}
          {phase === 'day' && (
            <div className="border-t border-white/10 p-4 bg-black/20 backdrop-blur-sm">
              <div className="max-w-4xl mx-auto flex gap-3">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Напишите ваше сообщение..."
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all"
                >
                  <Send className="w-5 h-5" />
                  Отправить
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
