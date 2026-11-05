import React from 'react';
import { X, Volume2, Monitor, MousePointer, ShieldCheck } from 'lucide-react';
import { sound } from '../audio/soundSystem';
import { GameSettings } from '../game/types';

interface SettingsModalProps {
  onClose: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  settings,
  onUpdateSettings,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-none font-sans">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[88dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white leading-tight">Game Settings</h2>
              <p className="text-[10px] sm:text-xs text-slate-400">Configure visual & audio preferences</p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto">
          {/* Audio Section */}
          <div className="space-y-4">
            <div className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Volume2 className="w-4 h-4" /> Audio Settings
            </div>

            {/* Mute Toggle */}
            <div className="flex items-center justify-between bg-slate-950/50 p-3 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-slate-200">Master Sound</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {/* SFX Volume */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>Sound FX Volume</span>
                <span className="font-mono text-amber-400">{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={(e) => onUpdateSettings({ sfxVolume: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Ambient Music Volume */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>Ambient Chords Volume</span>
                <span className="font-mono text-amber-400">{Math.round(settings.musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.musicVolume}
                onChange={(e) => onUpdateSettings({ musicVolume: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Graphics Quality */}
          <div className="space-y-3">
            <div className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Monitor className="w-4 h-4" /> Graphics Quality
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    sound.playClick();
                    onUpdateSettings({ graphicsQuality: q });
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold capitalize border transition-all cursor-pointer ${
                    settings.graphicsQuality === q
                      ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Camera Controls */}
          <div className="space-y-4">
            <div className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <MousePointer className="w-4 h-4" /> Camera Controls
            </div>

            {/* Sensitivity */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>Camera Orbit Sensitivity</span>
                <span className="font-mono text-amber-400">{settings.mouseSensitivity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="2.5"
                step="0.1"
                value={settings.mouseSensitivity}
                onChange={(e) => onUpdateSettings({ mouseSensitivity: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Invert Y */}
            <div className="flex items-center justify-between bg-slate-950/50 p-3 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-slate-200">Invert Vertical Look (Y-Axis)</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.invertY}
                  onChange={(e) => onUpdateSettings({ invertY: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
          </div>

          {/* Environment & Atmosphere Section */}
          <div className="space-y-3">
            <div className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Environment & Atmosphere
            </div>

            {/* Time of Day */}
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-slate-300">Time of Day</div>
              <div className="grid grid-cols-4 gap-1.5">
                {(['morning', 'day', 'sunset', 'night'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      sound.playClick();
                      onUpdateSettings({ timeOfDay: t, autoDayNight: false });
                    }}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold capitalize border transition-all cursor-pointer ${
                      settings.timeOfDay === t && !settings.autoDayNight
                        ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Weather */}
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-slate-300">Weather Effect</div>
              <div className="grid grid-cols-4 gap-1.5">
                {(['clear', 'rain', 'wind', 'fog'] as const).map((w) => (
                  <button
                    key={w}
                    onClick={() => {
                      sound.playClick();
                      onUpdateSettings({ weather: w });
                    }}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold capitalize border transition-all cursor-pointer ${
                      settings.weather === w
                        ? 'bg-sky-500 text-slate-950 border-sky-300 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto Day/Night Cycle */}
            <div className="flex items-center justify-between bg-slate-950/50 p-3 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-slate-200">Auto Day & Night Cycle</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(settings.autoDayNight)}
                  onChange={(e) => onUpdateSettings({ autoDayNight: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
