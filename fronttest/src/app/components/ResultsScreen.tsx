import { Trophy, Users, Brain, TrendingUp } from 'lucide-react';
import type { PlayerResult, WinnerTeam, PlayerRole } from '../types/game.types';

interface ResultsScreenProps {
  winner: WinnerTeam;
  players: PlayerResult[];
  rounds: number;
  onPlayAgain: () => void;
  onLeaveLobby: () => void;
}

export function ResultsScreen({ winner, players, rounds, onPlayAgain, onLeaveLobby }: ResultsScreenProps) {
  const aiPlayers = players.filter(p => p.isAI);
  const humanPlayers = players.filter(p => !p.isAI);

  const getRoleColor = (role: PlayerRole): string => {
    switch (role) {
      case 'Мафия': return 'bg-red-500/20 border-red-400/30 text-red-300';
      case 'Комиссар': return 'bg-blue-500/20 border-blue-400/30 text-blue-300';
      case 'Доктор': return 'bg-green-500/20 border-green-400/30 text-green-300';
      case 'Мирный житель': return 'bg-gray-500/20 border-gray-400/30 text-gray-300';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Winner banner */}
        <div className={`${
          winner === 'mafia'
            ? 'bg-gradient-to-r from-red-600 to-pink-600'
            : 'bg-gradient-to-r from-blue-600 to-cyan-600'
        } rounded-2xl p-8 mb-8 text-center shadow-2xl`}>
          <Trophy className="w-16 h-16 text-white mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-2">
            {winner === 'mafia' ? 'Победа мафии!' : 'Победа мирных жителей!'}
          </h1>
          <p className="text-white/80 text-lg">
            Игра завершена за {rounds} раундов
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <Users className="w-8 h-8 text-blue-300 mb-2" />
            <p className="text-3xl font-bold text-white">{humanPlayers.length}</p>
            <p className="text-purple-200">Людей играло</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <Brain className="w-8 h-8 text-purple-300 mb-2" />
            <p className="text-3xl font-bold text-white">{aiPlayers.length}</p>
            <p className="text-purple-200">AI-агентов</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <TrendingUp className="w-8 h-8 text-green-300 mb-2" />
            <p className="text-3xl font-bold text-white">{rounds}</p>
            <p className="text-purple-200">Раундов</p>
          </div>
        </div>

        {/* Players reveal */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <h2 className="text-white text-2xl font-bold mb-6">Раскрытие ролей</h2>

          <div className="space-y-4">
            {players.map((player) => {
              const aiGuessAccuracy = player.totalGuesses > 0
                ? Math.round((player.guessedAsAI / player.totalGuesses) * 100)
                : 0;

              return (
                <div
                  key={player.id}
                  className="bg-white/5 rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                      player.isAI ? 'bg-purple-500/30' : 'bg-blue-500/30'
                    }`}>
                      {player.isAI ? '🤖' : '👤'}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white text-lg font-semibold">{player.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm border ${getRoleColor(player.role)}`}>
                          {getRoleIcon(player.role)} {player.role}
                        </span>
                        {player.survived && (
                          <span className="px-3 py-1 rounded-full text-sm bg-green-500/20 border border-green-400/30 text-green-300">
                            Выжил
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <span className={`text-sm font-medium ${
                          player.isAI ? 'text-purple-300' : 'text-blue-300'
                        }`}>
                          {player.isAI ? 'AI-агент' : 'Человек'}
                        </span>

                        {player.isAI && (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-white/10 rounded-full h-2 w-32">
                              <div
                                className={`h-full rounded-full ${
                                  aiGuessAccuracy > 60 ? 'bg-red-400' : 'bg-green-400'
                                }`}
                                style={{ width: `${aiGuessAccuracy}%` }}
                              />
                            </div>
                            <span className="text-xs text-purple-200">
                              {aiGuessAccuracy}% распознали как AI
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Turing test stats */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20">
          <h2 className="text-white text-xl font-bold mb-4">Тест Тьюринга</h2>
          <p className="text-purple-200 mb-4">
            Насколько хорошо AI-агенты имитировали людей?
          </p>

          <div className="grid grid-cols-2 gap-4">
            {aiPlayers.map((player) => {
              const accuracy = player.totalGuesses > 0
                ? Math.round((player.guessedAsAI / player.totalGuesses) * 100)
                : 0;
              const passed = accuracy < 50;

              return (
                <div key={player.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{player.name}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      passed
                        ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                        : 'bg-red-500/20 text-red-300 border border-red-400/30'
                    }`}>
                      {passed ? 'Тест пройден' : 'Раскрыт'}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{accuracy}%</div>
                  <div className="text-xs text-purple-200">
                    {player.guessedAsAI} из {player.totalGuesses} игроков распознали как AI
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-4">
          <button
            onClick={onPlayAgain}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-4 rounded-xl font-semibold text-lg transition-all shadow-lg shadow-purple-500/50"
          >
            Играть снова
          </button>
          <button
            onClick={onLeaveLobby}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white py-4 rounded-xl font-semibold text-lg transition-all border border-white/20"
          >
            Выйти в лобби
          </button>
        </div>
      </div>
    </div>
  );
}
