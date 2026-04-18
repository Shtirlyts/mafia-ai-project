import { Users, Copy, Settings, Play } from 'lucide-react';
import type { Player } from '../types/game.types';

interface LobbyScreenProps {
  roomCode: string;
  players: Player[];
  onStart: () => void;
  onSettingsClick: () => void;
}

export function LobbyScreen({ roomCode, players, onStart, onSettingsClick }: LobbyScreenProps) {
  const copyRoomCode = () => {
    navigator.clipboard.writeText(`${window.location.origin}?room=${roomCode}`);
  };

  const humanCount = players.filter(p => !p.isAI).length;
  const aiCount = players.filter(p => p.isAI).length;
  const canStart = players.length >= 5;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">AI Мафия</h1>
          <p className="text-purple-200">Игра, где люди и AI неотличимы</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-purple-200 text-sm mb-1">Код комнаты</p>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-mono font-bold text-white">{roomCode}</span>
                <button
                  onClick={copyRoomCode}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <Copy className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
            <button
              onClick={onSettingsClick}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <Settings className="w-6 h-6 text-white" />
            </button>
          </div>

          <div className="flex gap-4 mb-4">
            <div className="flex-1 bg-blue-500/20 rounded-lg p-3 border border-blue-400/30">
              <Users className="w-5 h-5 text-blue-300 mb-1" />
              <p className="text-2xl font-bold text-white">{humanCount}</p>
              <p className="text-blue-200 text-sm">Людей</p>
            </div>
            <div className="flex-1 bg-purple-500/20 rounded-lg p-3 border border-purple-400/30">
              <div className="w-5 h-5 mb-1 text-purple-300">🤖</div>
              <p className="text-2xl font-bold text-white">{aiCount}</p>
              <p className="text-purple-200 text-sm">AI-агентов</p>
            </div>
          </div>

          {!canStart && (
            <div className="bg-amber-500/20 border border-amber-400/30 rounded-lg p-3 mb-4">
              <p className="text-amber-200 text-sm">
                Минимум 5 игроков для старта. AI-агенты заполнят недостающие места.
              </p>
            </div>
          )}
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Игроки в лобби ({players.length}/10)
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {players.map((player) => (
              <div
                key={player.id}
                className="bg-white/5 rounded-lg p-3 flex items-center gap-3 border border-white/10"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  player.isAI ? 'bg-purple-500/30' : 'bg-blue-500/30'
                }`}>
                  {player.isAI ? '🤖' : '👤'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{player.name}</p>
                  <p className="text-xs text-purple-200">
                    {player.isAI ? 'AI-агент' : 'Человек'}
                  </p>
                </div>
                <div className={`w-2 h-2 rounded-full ${
                  player.isReady ? 'bg-green-400' : 'bg-gray-400'
                }`} />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onStart}
          disabled={!canStart}
          className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
            canStart
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/50'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Play className="w-5 h-5" />
          Начать игру
        </button>
      </div>
    </div>
  );
}
