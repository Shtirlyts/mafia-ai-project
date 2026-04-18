import { X, Users, Brain } from 'lucide-react';
import type { GameSettings, GameMode } from '../types/game.types';

interface SettingsModalProps {
  onClose: () => void;
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
}

export function SettingsModal({ onClose, settings, onSettingsChange }: SettingsModalProps) {
  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const updateRole = (role: keyof GameSettings['roles'], value: number) => {
    onSettingsChange({
      ...settings,
      roles: { ...settings.roles, [role]: value }
    });
  };

  const updateGameMode = (mode: GameMode) => {
    updateSetting('gameMode', mode);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-900 border-b border-white/10 p-6 flex items-center justify-between">
          <h2 className="text-white text-2xl font-bold">Настройки игры</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Game mode */}
          <div>
            <h3 className="text-white font-semibold mb-3">Режим игры</h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => updateGameMode('ai-only')}
                className={`rounded-lg p-4 text-center transition-colors ${
                  settings.gameMode === 'ai-only'
                    ? 'bg-purple-500/20 border-2 border-purple-400'
                    : 'bg-purple-500/10 border border-purple-400/30 hover:bg-purple-500/20'
                }`}
              >
                <Brain className="w-8 h-8 text-purple-300 mx-auto mb-2" />
                <p className="text-white font-medium text-sm">Только AI</p>
              </button>
              <button
                onClick={() => updateGameMode('mixed')}
                className={`rounded-lg p-4 text-center transition-colors ${
                  settings.gameMode === 'mixed'
                    ? 'bg-blue-500/20 border-2 border-blue-400'
                    : 'bg-blue-500/10 border border-blue-400/30 hover:bg-blue-500/20'
                }`}
              >
                <div className="flex justify-center gap-2 mb-2">
                  <Users className="w-6 h-6 text-blue-300" />
                  <Brain className="w-6 h-6 text-purple-300" />
                </div>
                <p className="text-white font-medium text-sm">Смешанный</p>
              </button>
              <button
                onClick={() => updateGameMode('human-only')}
                className={`rounded-lg p-4 text-center transition-colors ${
                  settings.gameMode === 'human-only'
                    ? 'bg-blue-500/20 border-2 border-blue-400'
                    : 'bg-blue-500/10 border border-blue-400/30 hover:bg-blue-500/20'
                }`}
              >
                <Users className="w-8 h-8 text-blue-300 mx-auto mb-2" />
                <p className="text-white font-medium text-sm">Только люди</p>
              </button>
            </div>
          </div>

          {/* Player counts */}
          <div>
            <h3 className="text-white font-semibold mb-3">Количество игроков</h3>
            <div className="space-y-4">
              <div>
                <label className="text-purple-200 text-sm mb-2 block">
                  Минимум игроков: {settings.minPlayers}
                </label>
                <input
                  type="range"
                  min="5"
                  max="10"
                  value={settings.minPlayers}
                  onChange={(e) => updateSetting('minPlayers', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-purple-200 text-sm mb-2 block">
                  Максимум игроков: {settings.maxPlayers}
                </label>
                <input
                  type="range"
                  min="5"
                  max="15"
                  value={settings.maxPlayers}
                  onChange={(e) => updateSetting('maxPlayers', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Time settings */}
          <div>
            <h3 className="text-white font-semibold mb-3">Длительность фаз</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <label className="text-purple-200 text-sm mb-2 block">
                  День (секунды)
                </label>
                <input
                  type="number"
                  value={settings.dayDuration}
                  onChange={(e) => updateSetting('dayDuration', parseInt(e.target.value))}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
                />
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <label className="text-purple-200 text-sm mb-2 block">
                  Ночь (секунды)
                </label>
                <input
                  type="number"
                  value={settings.nightDuration}
                  onChange={(e) => updateSetting('nightDuration', parseInt(e.target.value))}
                  className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
                />
              </div>
            </div>
          </div>

          {/* Roles */}
          <div>
            <h3 className="text-white font-semibold mb-3">Роли</h3>
            <div className="space-y-3">
              <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-red-300 font-medium">🔪 Мафия</span>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={settings.roles.mafia}
                    onChange={(e) => updateRole('mafia', parseInt(e.target.value))}
                    className="w-16 bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-center"
                  />
                </div>
                <p className="text-red-200 text-xs">Убивают игроков по ночам</p>
              </div>

              <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-300 font-medium">🕵️ Комиссар</span>
                  <input
                    type="number"
                    min="0"
                    max="2"
                    value={settings.roles.detective}
                    onChange={(e) => updateRole('detective', parseInt(e.target.value))}
                    className="w-16 bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-center"
                  />
                </div>
                <p className="text-blue-200 text-xs">Проверяет игроков по ночам</p>
              </div>

              <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-300 font-medium">💊 Доктор</span>
                  <input
                    type="number"
                    min="0"
                    max="2"
                    value={settings.roles.doctor}
                    onChange={(e) => updateRole('doctor', parseInt(e.target.value))}
                    className="w-16 bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-center"
                  />
                </div>
                <p className="text-green-200 text-xs">Спасает игроков от мафии</p>
              </div>

              <div className="bg-gray-500/10 border border-gray-400/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300 font-medium">👤 Мирные жители</span>
                  <span className="text-white font-bold">
                    {settings.maxPlayers - settings.roles.mafia - settings.roles.detective - settings.roles.doctor}
                  </span>
                </div>
                <p className="text-gray-200 text-xs">Остальные игроки</p>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-slate-900 border-t border-white/10 p-6">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-xl font-semibold transition-all"
          >
            Сохранить настройки
          </button>
        </div>
      </div>
    </div>
  );
}
