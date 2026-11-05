import React, { useState } from 'react';
import { X, Volume2, Monitor, MousePointer, ShieldCheck, Activity, CheckCircle2, XCircle, Save } from 'lucide-react';
import { sound } from '../audio/soundSystem';
import { GameSettings } from '../game/types';
import { PhysicsTestResult } from '../game/collisionTests';

interface SettingsModalProps {
  onClose: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onSaveProgress?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  settings,
  onUpdateSettings,
  onSaveProgress,
}) => {
  const [auditResults, setAuditResults] = useState<PhysicsTestResult[] | null>(null);
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

            {/* Show FPS & Performance Counter */}
            <div className="flex items-center justify-between bg-slate-950/50 p-3 rounded-xl border border-slate-800">
              <span className="text-xs font-bold text-slate-200">Show FPS & Frame Time HUD</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(settings.showFps)}
                  onChange={(e) => onUpdateSettings({ showFps: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
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

          {/* Physics & Collision Diagnostic Audit */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" /> Collision Audit Diagnostics
              </span>
              {auditResults && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    auditResults.every((r) => r.passed)
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-red-500/20 text-red-400 border border-red-500/40'
                  }`}
                >
                  {auditResults.filter((r) => r.passed).length}/{auditResults.length} PASSED
                </span>
              )}
            </div>

            <button
              onClick={() => {
                sound.playClick();
                if (typeof (window as any).__runPhysicsTests === 'function') {
                  const results = (window as any).__runPhysicsTests();
                  setAuditResults(results);
                }
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 font-bold text-xs border border-emerald-500/40 flex items-center justify-center gap-2 transition-all shadow cursor-pointer active:scale-98"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Run Collision Audit Test Suite</span>
            </button>

            {/* Scrollable Audit Log Overlay */}
            {auditResults && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2 max-h-56 overflow-y-auto font-mono text-xs">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pb-1.5 border-b border-slate-800">
                  <span>Physics Test Suite Log</span>
                  <button
                    onClick={() => setAuditResults(null)}
                    className="text-slate-500 hover:text-slate-300 text-[10px] uppercase font-sans font-bold cursor-pointer"
                  >
                    Clear Log
                  </button>
                </div>

                {auditResults.map((test, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border flex flex-col gap-1 text-[11px] ${
                      test.passed
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-200'
                        : 'bg-red-950/20 border-red-500/30 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-sans font-bold">
                      <span className="flex items-center gap-1.5">
                        {test.passed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        )}
                        <span className={test.passed ? 'text-emerald-300' : 'text-red-300'}>
                          {test.testName}
                        </span>
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                          test.passed
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {test.passed ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono leading-relaxed pl-5">
                      {test.details}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-3">
          {onSaveProgress ? (
            <button
              onClick={() => {
                sound.playClick();
                onSaveProgress();
              }}
              className="py-2 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs uppercase tracking-wider border border-amber-500/40 flex items-center gap-2 transition-all cursor-pointer shadow active:scale-95"
            >
              <Save className="w-4 h-4 text-amber-400" />
              <span>Save Progress</span>
            </button>
          ) : <div />}

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
