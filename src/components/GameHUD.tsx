import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Settings,
  Home,
  Compass,
  Sun,
  Droplets,
  Trees,
  ChevronDown,
  ChevronUp,
  X,
  Info,
  Check,
  Hand,
  Coins,
  Package,
  Sparkles,
  Cloud,
  Moon,
  Wind,
  Trophy,
  Briefcase,
  Heart,
  Activity,
  Crosshair,
} from 'lucide-react';
import { QuestProgress, EnvironmentState, TimeOfDay, WeatherType } from '../game/types';

interface GameHUDProps {
  quest: QuestProgress;
  prompt: string | null;
  tutorialNotice: { title: string; text: string } | null;
  onDismissTutorial: () => void;
  onOpenSettings: () => void;
  onReturnToMenu: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onTriggerInteract?: () => void;
  environmentState?: EnvironmentState;
  onChangeTimeOfDay?: (time: TimeOfDay) => void;
  onChangeWeather?: (weather: WeatherType) => void;
  onToggleAutoCycle?: () => void;
  onOpenInventory?: () => void;
  onOpenAchievements?: () => void;
  showFps?: boolean;
  playerPos?: { x: number; z: number; rotation: number };
  stealthLevel?: number;
  stealthState?: 'patrol' | 'suspicious' | 'investigate' | 'chase' | 'search' | 'disabled';
  stoneCooldownRemaining?: number;
  onStartMission?: () => void;
  onThrowStone?: () => void;
  // Phase 7 Combat
  playerHealth?: number;
  maxPlayerHealth?: number;
  ammoCount?: number;
  maxAmmo?: number;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  quest,
  prompt,
  tutorialNotice,
  onDismissTutorial,
  onOpenSettings,
  onReturnToMenu,
  isMuted,
  onToggleMute,
  onTriggerInteract,
  environmentState,
  onChangeTimeOfDay,
  onChangeWeather,
  onToggleAutoCycle,
  onOpenInventory,
  onOpenAchievements,
  showFps,
  playerPos = { x: -22, z: 24, rotation: 0 },
  stealthLevel = 0,
  stealthState = 'patrol',
  stoneCooldownRemaining = 0,
  onStartMission,
  onThrowStone,
  playerHealth = 100,
  maxPlayerHealth = 100,
  ammoCount = 0,
  maxAmmo = 0,
}) => {
  const [isQuestDetailsOpen, setIsQuestDetailsOpen] = useState(false);
  const [isEnvPanelOpen, setIsEnvPanelOpen] = useState(false);

  // Keyboard shortcut listener to start expedition when briefing is active
  React.useEffect(() => {
    if (quest.missionPhase !== 'orient') return;
    const handleKey = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') {
        e.preventDefault();
        onStartMission?.();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [quest.missionPhase, onStartMission]);

  // Format elapsed time (mm:ss)
  const minutes = Math.floor(quest.timeElapsed / 60);
  const seconds = Math.floor(quest.timeElapsed % 60);
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Current objective summary
  let currentObjective = `Find Keys (${quest.keysCount}/3)`;
  if (quest.gateUnlocked) {
    currentObjective = 'Portal Open! Step In';
  } else if (quest.gateOpening) {
    currentObjective = 'Portal Opening...';
  } else if (quest.altarActivated) {
    currentObjective = 'Escape via Grand Gate';
  } else if (quest.keysCount >= 3) {
    currentObjective = 'Activate Rune Altar';
  }

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 overflow-hidden font-sans">
      {/* ======================================================== */}
      {/* 0. MISSION ORIENTATION / BRIEFING OVERLAY (Phased)       */}
      {/* ======================================================== */}
      {quest.missionPhase === 'orient' && (
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm pointer-events-auto flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <div className="bg-slate-900 border-2 border-amber-500/60 rounded-3xl p-4 sm:p-5 max-w-sm w-full shadow-2xl text-center space-y-4 transform animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center border-2 border-amber-500/40">
              <Compass className="w-8 h-8 text-amber-400" />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Mission Briefing</h2>
              <div className="h-1 w-16 bg-amber-500 mx-auto rounded-full" />
            </div>

            <div className="space-y-3 text-left">
              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 space-y-2">
                <p className="text-slate-300 text-xs font-medium leading-relaxed">
                  Infiltrate the island and recover the <span className="text-amber-400 font-bold">3 Elemental Keys</span> hidden in the Temple, Grotto, and Grove.
                </p>
                <p className="text-slate-300 text-xs font-medium leading-relaxed">
                  Once collected, activate the <span className="text-amber-400 font-bold">Grand Rune Altar</span> in the plaza to open the Grand Escape Portal.
                </p>
                <p className="text-slate-400 text-[10px] italic">
                  Avoid guard patrols. Use high ground and crouch in tall grass to remain hidden.
                </p>
              </div>
            </div>

            <button
              onClick={() => onStartMission?.()}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5"
            >
              <span>Start Expedition</span>
              <span className="text-[9px] font-bold text-amber-950/80 normal-case">(Press Space or Tap to Begin)</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 0.4 ESCAPE PHASE ACTIVE HERO BANNER                     */}
      {/* ======================================================== */}
      {quest.missionPhase === 'escape' && (
        <div className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-in slide-in-from-top-4 duration-300">
          <div className="bg-gradient-to-r from-cyan-600/90 via-sky-500/95 to-cyan-600/90 border-2 border-white px-4 py-2 sm:px-6 sm:py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 text-white">
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
            <span className="text-xs sm:text-sm font-black tracking-wider uppercase animate-pulse">
              ★ PORTAL UNLOCKED: RACE TO THE GRAND GATE! ★
            </span>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 0.5 STEALTH DETECTION METER                              */}
      {/* ======================================================== */}
      {quest.missionPhase !== 'orient' && (
        <div className="absolute top-24 sm:top-28 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 transition-opacity duration-300">
          <div className={`relative w-48 sm:w-56 h-2 sm:h-2.5 bg-slate-950/85 rounded-full border shadow-lg overflow-hidden transition-all ${
            stealthState === 'chase' ? 'border-red-500 shadow-red-500/50' : 'border-slate-800'
          }`}>
             <div 
               className={`absolute inset-y-0 left-0 transition-all duration-200 ${
                 stealthState === 'chase' ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]' : 
                 stealthState === 'investigate' || stealthState === 'search' ? 'bg-amber-500' :
                 stealthLevel > 50 ? 'bg-amber-400' : 'bg-emerald-400'
               }`}
               style={{ width: `${Math.max(stealthLevel, stealthState === 'chase' ? 100 : 0)}%` }}
             />
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-950/75 rounded-full border border-slate-800/60 text-[10px] font-black uppercase tracking-tighter">
            <span className={stealthState === 'chase' ? 'text-red-400 font-extrabold animate-pulse' : 'text-slate-400'}>
              {stealthState === 'chase' ? 'ALERT' : 'Visibility'}
            </span>
            <span className="text-slate-600">|</span>
            <span className={`
              ${stealthState === 'patrol' ? 'text-emerald-400' : ''}
              ${stealthState === 'suspicious' ? 'text-amber-300' : ''}
              ${stealthState === 'investigate' || stealthState === 'search' ? 'text-amber-500' : ''}
              ${stealthState === 'chase' ? 'text-red-500 animate-pulse font-black' : ''}
              ${stealthState === 'disabled' ? 'text-sky-400' : ''}
            `}>
              {stealthState === 'patrol' ? 'Hidden' : stealthState.toUpperCase()}
            </span>
            {stoneCooldownRemaining > 0 && (
              <>
                <span className="text-slate-600">|</span>
                <span className="text-amber-400/80 font-mono text-[9px]">
                  Stone: {stoneCooldownRemaining.toFixed(1)}s
                </span>
              </>
            )}
          </div>
        </div>
      )}
      {/* ======================================================== */}
      {/* 1. TOP BAR: Compact, Non-Overlapping, Fully Responsive   */}
      {/* ======================================================== */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-auto flex flex-col gap-1.5 p-2 sm:p-3"
        style={{ paddingTop: 'max(8px, env(safe-area-inset-top, 8px))' }}
      >
        <div className="flex items-center justify-between gap-1.5 sm:gap-2.5 max-w-7xl mx-auto w-full">
          {/* Left: Compact Quest Tracker Pill */}
          <div className="relative">
            <button
              onClick={() => setIsQuestDetailsOpen(!isQuestDetailsOpen)}
              className="bg-slate-900/90 hover:bg-slate-800/95 text-white border border-amber-500/40 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 flex items-center gap-1.5 sm:gap-2 shadow-lg transition-all cursor-pointer text-xs"
              aria-label="Toggle Mission Objectives"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider hidden xs:inline">
                  Mission
                </span>
                <span className="font-bold text-slate-100 truncate max-w-[90px] xs:max-w-[120px] sm:max-w-[150px]">
                  {currentObjective}
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold text-slate-300 ml-0.5 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60 tabular-nums">
                {timeFormatted}
              </span>
              {isQuestDetailsOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {/* Dropdown details card (when expanded) */}
            {isQuestDetailsOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-64 sm:w-72 bg-slate-950/95 border border-amber-500/40 rounded-2xl p-3 shadow-2xl z-50 text-xs space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-slate-300 font-extrabold uppercase tracking-wider text-[10px]">
                  <span>Expedition Steps</span>
                  <span className="text-amber-400">⏱ {timeFormatted}</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className={quest.keysCount === 3 ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                      1. Find 3 Elemental Keys
                    </span>
                    <span className="font-bold font-mono text-slate-200">{quest.keysCount}/3</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span
                      className={
                        quest.altarActivated
                          ? 'text-emerald-400 font-bold'
                          : quest.keysCount === 3
                          ? 'text-amber-300 font-bold'
                          : 'text-slate-500'
                      }
                    >
                      2. Activate Central Altar
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      {quest.altarActivated ? '✓ Done' : quest.keysCount === 3 ? 'Ready' : 'Locked'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span
                      className={
                        quest.gateUnlocked
                          ? 'text-sky-300 font-bold'
                          : quest.altarActivated
                          ? 'text-amber-300'
                          : 'text-slate-500'
                      }
                    >
                      3. Escape Grand Gate
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      {quest.gateUnlocked ? '★ OPEN' : 'Sealed'}
                    </span>
                  </div>

                  {/* Secret Treasures in Dropdown */}
                  <div className="border-t border-slate-800/80 pt-1.5 mt-1.5 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-amber-300">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      <span>Coins: {quest.coinsCollected}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sky-300">
                      <Package className="w-3.5 h-3.5 text-sky-400" />
                      <span>Chests: {quest.chestsOpened}/{quest.totalChests}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Center: Phase 7 Combat Status & Mission Progress */}
          <div className="flex flex-col items-center gap-1.5 sm:gap-2 mx-auto">
            {/* Top Row: Vitals (Health & Ammo) */}
            <div className="flex items-center gap-3 sm:gap-6 bg-slate-950/90 border border-slate-700/60 px-3 sm:px-5 py-1 sm:py-1.5 rounded-full shadow-2xl backdrop-blur-md">
              {/* Player Health Bar */}
              <div className="flex items-center gap-2">
                <Heart 
                  className={`w-3.5 h-3.5 sm:w-4 h-4 ${playerHealth < 30 ? 'text-red-500 animate-pulse' : 'text-red-400'}`} 
                  fill={playerHealth < 30 ? 'none' : 'currentColor'} 
                />
                <div className="w-16 sm:w-28 h-1.5 sm:h-2 bg-slate-900 rounded-full border border-white/5 overflow-hidden relative shadow-inner">
                  <div 
                    className={`h-full transition-all duration-500 ease-out ${
                      playerHealth < 30 ? 'bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-gradient-to-r from-emerald-500 to-red-500'
                    }`}
                    style={{ width: `${Math.max(0, Math.min(100, (playerHealth / maxPlayerHealth) * 100))}%` }} 
                  />
                </div>
                <span className="text-[10px] sm:text-xs font-black text-slate-100 tabular-nums min-w-[20px]">
                  {Math.ceil(playerHealth)}
                </span>
              </div>

              {/* Firearm Ammunition (Authorized Missions Only) */}
              {quest.firearmAuthorized && (
                <div className="flex items-center gap-2 border-l border-white/10 pl-3 sm:pl-6">
                  <Crosshair className="w-3.5 h-3.5 sm:w-4 h-4 text-amber-400" />
                  <div className="flex items-end gap-0.5">
                    <span className="text-xs sm:text-sm font-black text-amber-400 tabular-nums leading-none">
                      {ammoCount}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 leading-none mb-0.5">
                      / {maxAmmo}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-950/80 border border-slate-800/80 rounded-xl px-1.5 py-1 sm:px-2.5 sm:py-1.5 shadow-lg">
              {/* Sun Key */}
              <div
                className={`flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg text-[10px] sm:text-xs font-bold border transition-all ${
                  quest.keysCollected.sun
                    ? 'bg-amber-500/25 text-amber-300 border-amber-400/70 shadow-sm'
                    : 'bg-slate-900/40 text-slate-500 border-slate-800'
                }`}
                title="Sun Key (Sun Temple Ruins)"
              >
                <Sun className={`w-3.5 h-3.5 ${quest.keysCollected.sun ? 'text-amber-400 fill-amber-400/40' : ''}`} />
                <span className="hidden xs:inline">Sun</span>
                {quest.keysCollected.sun && <Check className="w-3 h-3 text-amber-300 ml-0.5" />}
              </div>

              {/* Ocean Key */}
              <div
                className={`flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg text-[10px] sm:text-xs font-bold border transition-all ${
                  quest.keysCollected.ocean
                    ? 'bg-sky-500/25 text-sky-300 border-sky-400/70 shadow-sm'
                    : 'bg-slate-900/40 text-slate-500 border-slate-800'
                }`}
                title="Ocean Key (Waterfall Grotto)"
              >
                <Droplets className={`w-3.5 h-3.5 ${quest.keysCollected.ocean ? 'text-sky-400 fill-sky-400/40' : ''}`} />
                <span className="hidden xs:inline">Ocean</span>
                {quest.keysCollected.ocean && <Check className="w-3 h-3 text-sky-300 ml-0.5" />}
              </div>

              {/* Forest Key */}
              <div
                className={`flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg text-[10px] sm:text-xs font-bold border transition-all ${
                  quest.keysCollected.forest
                    ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400/70 shadow-sm'
                    : 'bg-slate-900/40 text-slate-500 border-slate-800'
                }`}
                title="Forest Key (Sacred Grove)"
              >
                <Trees className={`w-3.5 h-3.5 ${quest.keysCollected.forest ? 'text-emerald-400 fill-emerald-400/40' : ''}`} />
                <span className="hidden xs:inline">Forest</span>
                {quest.keysCollected.forest && <Check className="w-3 h-3 text-emerald-300 ml-0.5" />}
              </div>
            </div>

            {/* Treasure Coins & Chests Badge */}
            <div className="hidden xs:flex items-center gap-2 bg-slate-950/85 border border-amber-500/30 rounded-xl px-2 py-1 sm:px-2.5 sm:py-1.5 shadow text-xs font-bold">
              <div className="flex items-center gap-1 text-amber-300" title="Ancient Coins Collected">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono">{quest.coinsCollected}</span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="flex items-center gap-1 text-slate-300" title="Hidden Chests Opened">
                <Package className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono">{quest.chestsOpened}/{quest.totalChests}</span>
              </div>
            </div>
            </div>
          </div>

          {/* Right: Compass & Action Icons */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Environment Control Button */}
            <div className="relative">
              <button
                onClick={() => setIsEnvPanelOpen(!isEnvPanelOpen)}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow ${
                  isEnvPanelOpen
                    ? 'bg-amber-500 text-slate-950 border-amber-300'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-amber-400 border-slate-700/80'
                }`}
                title="Environment & Weather Settings"
                aria-label="Toggle Environment Settings"
              >
                {environmentState?.timeOfDay === 'night' ? (
                  <Moon className="w-4 h-4 text-sky-300" />
                ) : environmentState?.weather === 'rain' ? (
                  <Droplets className="w-4 h-4 text-sky-400" />
                ) : environmentState?.weather === 'wind' ? (
                  <Wind className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400" />
                )}
              </button>

              {/* Environment Quick Controls Dropdown */}
              {isEnvPanelOpen && (
                <div className="absolute top-full right-0 mt-1.5 w-64 bg-slate-950/95 border border-amber-500/40 rounded-2xl p-3 shadow-2xl z-50 text-xs space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-amber-400 font-extrabold uppercase tracking-wider text-[10px]">
                    <span className="flex items-center gap-1">
                      <Cloud className="w-3.5 h-3.5" /> Environment Controls
                    </span>
                    <button
                      onClick={() => setIsEnvPanelOpen(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Time of Day */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-extrabold uppercase text-slate-400">Time of Day</div>
                    <div className="grid grid-cols-4 gap-1">
                      {(['morning', 'day', 'sunset', 'night'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => {
                            if (onChangeTimeOfDay) onChangeTimeOfDay(t);
                          }}
                          className={`py-1 px-1 rounded-lg text-[10px] font-bold capitalize border transition-all ${
                            environmentState?.timeOfDay === t && !environmentState?.autoCycle
                              ? 'bg-amber-500 text-slate-950 border-amber-300 font-black'
                              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Weather */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-extrabold uppercase text-slate-400">Weather</div>
                    <div className="grid grid-cols-4 gap-1">
                      {(['clear', 'rain', 'wind', 'fog'] as const).map((w) => (
                        <button
                          key={w}
                          onClick={() => {
                            if (onChangeWeather) onChangeWeather(w);
                          }}
                          className={`py-1 px-1 rounded-lg text-[10px] font-bold capitalize border transition-all ${
                            environmentState?.weather === w
                              ? 'bg-sky-500 text-slate-950 border-sky-300 font-black'
                              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Auto Day/Night Cycle Toggle */}
                  <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <span className="text-[11px] font-bold text-slate-300">Auto Day & Night</span>
                    <button
                      onClick={onToggleAutoCycle}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase transition-colors ${
                        environmentState?.autoCycle
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {environmentState?.autoCycle ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Inventory Satchel Button */}
            <button
              onClick={onOpenInventory}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-slate-700/80 flex items-center justify-center transition-colors cursor-pointer shadow"
              title="Open Satchel Inventory"
            >
              <Briefcase className="w-4 h-4" />
            </button>

            {/* Achievements Trophy Button */}
            <button
              onClick={onOpenAchievements}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-yellow-300 hover:text-yellow-200 border border-slate-700/80 flex items-center justify-center transition-colors cursor-pointer shadow"
              title="Open Achievements"
            >
              <Trophy className="w-4 h-4" />
            </button>

            {/* Audio Toggle */}
            <button
              onClick={onToggleMute}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 flex items-center justify-center transition-colors cursor-pointer shadow"
              aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 flex items-center justify-center transition-colors cursor-pointer shadow"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Menu */}
            <button
              onClick={onReturnToMenu}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 flex items-center justify-center transition-colors cursor-pointer shadow"
              aria-label="Return to Main Menu"
            >
              <Home className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. DISMISSIBLE EXPLORER SIGN NOTIFICATION PANEL           */}
      {/* ======================================================== */}
      {tutorialNotice && (
        <div className="absolute top-16 sm:top-18 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm pointer-events-auto z-40 animate-in slide-in-from-top-2 duration-200">
          <div className="bg-slate-950/95 border-2 border-amber-400/60 rounded-2xl p-3 sm:p-3.5 shadow-2xl text-white">
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Info className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-400">
                  {tutorialNotice.title}
                </h3>
              </div>
              <button
                onClick={onDismissTutorial}
                className="w-6 h-6 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Dismiss Tutorial"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
              {tutorialNotice.text}
            </p>

            <div className="mt-2.5 flex justify-end">
              <button
                onClick={onDismissTutorial}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. PROXIMITY INTERACTION PROMPT (Safe Center-Screen Area) */}
      {/* ======================================================== */}
      {prompt && (
        <div
          onClick={onTriggerInteract}
          className="absolute left-1/2 -translate-x-1/2 bottom-36 sm:bottom-32 pointer-events-auto cursor-pointer transition-all duration-150 active:scale-95 z-30"
        >
          <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-xs sm:text-sm px-4 py-2 sm:px-5 sm:py-2.5 rounded-full shadow-2xl border-2 border-amber-200 flex items-center gap-2.5">
            <Hand className="w-4 h-4 text-slate-950 shrink-0" />
            <span className="tracking-wide">{prompt}</span>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. DESKTOP-ONLY CONTROL HINTS (Hidden on mobile devices) */}
      {/* ======================================================== */}
      <div className="hidden lg:flex absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="bg-slate-950/80 border border-slate-800 text-slate-400 px-4 py-1.5 rounded-full text-xs font-medium shadow-md flex items-center gap-2">
          <span className="font-mono text-slate-200 font-bold">WASD</span> Move
          <span className="text-slate-600">·</span>
          <span className="font-mono text-slate-200 font-bold">Space</span> Jump
          <span className="text-slate-600">·</span>
          <span className="font-mono text-slate-200 font-bold">Shift</span> Run
          <span className="text-slate-600">·</span>
          <span className="font-mono text-slate-200 font-bold">E</span> Interact
          <span className="text-slate-600">·</span>
          <span>Drag to Orbit Camera</span>
        </div>
      </div>

      {/* Top-Down Island Minimap Radar */}
      <Minimap playerPos={playerPos} quest={quest} />

      {/* Real-time FPS & Frame Time Performance Overlay */}
      {showFps && <FpsOverlay />}
    </div>
  );
};

interface MinimapProps {
  playerPos: { x: number; z: number; rotation: number };
  quest: QuestProgress;
}

const Minimap: React.FC<MinimapProps> = ({ playerPos, quest }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 128;
    const center = size / 2;
    const worldRadius = 48;
    const scale = 54 / worldRadius; // Maps 48m world radius to 54px canvas radius

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // 1. Ocean Water Outer Ring
    ctx.fillStyle = '#0284c7'; // Sky blue ocean
    ctx.beginPath();
    ctx.arc(center, center, center, 0, Math.PI * 2);
    ctx.fill();

    // 2. Sand Beach Ring
    ctx.fillStyle = '#fde047'; // Golden sand
    ctx.beginPath();
    ctx.arc(center, center, 52, 0, Math.PI * 2);
    ctx.fill();

    // 3. Tropical Island Landmass
    ctx.fillStyle = '#15803d'; // Vibrant island green
    ctx.beginPath();
    ctx.arc(center, center, 48, 0, Math.PI * 2);
    ctx.fill();

    // Inland River / Waterfall Lagoon Detail
    ctx.fillStyle = '#0369a1';
    ctx.beginPath();
    ctx.arc(center + 18 * scale, center + 10 * scale, 6, 0, Math.PI * 2);
    ctx.fill();

    // Helper: Map World (X, Z) to Canvas (x, y)
    const toCanvasX = (wx: number) => center + wx * scale;
    const toCanvasY = (wz: number) => center + wz * scale;

    // 4. Draw Quest Objective Markers

    // A. Sun Key Marker (-18, -18)
    if (!quest.keysCollected.sun) {
      const sx = toCanvasX(-18);
      const sy = toCanvasY(-18);
      ctx.fillStyle = '#f59e0b'; // Gold / Amber
      ctx.beginPath();
      ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // B. Ocean Key Marker (22, 12)
    if (!quest.keysCollected.ocean) {
      const ox = toCanvasX(22);
      const oy = toCanvasY(12);
      ctx.fillStyle = '#38bdf8'; // Sky Blue
      ctx.beginPath();
      ctx.arc(ox, oy, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // C. Forest Key Marker (-12, 28)
    if (!quest.keysCollected.forest) {
      const fx = toCanvasX(-12);
      const fy = toCanvasY(28);
      ctx.fillStyle = '#34d399'; // Emerald Green
      ctx.beginPath();
      ctx.arc(fx, fy, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // D. Central Rune Altar Marker (0, 2)
    const ax = toCanvasX(0);
    const ay = toCanvasY(2);
    ctx.fillStyle = quest.altarActivated ? '#10b981' : quest.keysCount >= 3 ? '#a855f7' : '#94a3b8';
    ctx.beginPath();
    ctx.arc(ax, ay, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // E. Grand Gate Escape Portal Marker (0, -30)
    const gx = toCanvasX(0);
    const gy = toCanvasY(-30);
    ctx.fillStyle = quest.gateUnlocked ? '#06b6d4' : '#64748b';
    ctx.beginPath();
    ctx.arc(gx, gy, 5, 0, Math.PI * 2);
    ctx.fill();
    if (quest.gateUnlocked) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 5. Draw Player Position & Directional Arrow
    const px = toCanvasX(playerPos.x);
    const py = toCanvasY(playerPos.z);

    // Glowing Player Ring
    ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fill();

    // Player Direction Arrow
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(playerPos.rotation);
    ctx.fillStyle = '#f59e0b'; // Amber Player Arrow
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4, 5);
    ctx.lineTo(0, 3);
    ctx.lineTo(-4, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 6. Cardinal Directions (N)
    ctx.fillStyle = '#f8fafc';
    ctx.font = '900 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', center, 10);

  }, [playerPos, quest]);

  return (
    <div
      onClick={() => setIsExpanded((prev) => !prev)}
      className={`fixed top-14 left-2.5 xs:left-3.5 sm:top-16 sm:left-4 z-30 pointer-events-auto cursor-pointer transition-all duration-200 ${
        isExpanded ? 'scale-125 origin-top-left' : 'hover:scale-105'
      }`}
      title="Top-Down Island Radar Minimap (Click to Expand)"
    >
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-amber-400/80 bg-slate-950/90 shadow-2xl overflow-hidden flex items-center justify-center backdrop-blur-md">
        <canvas ref={canvasRef} width={128} height={128} className="w-full h-full rounded-full" />
        <div className="absolute inset-0 rounded-full border border-amber-300/30 pointer-events-none" />
        <div className="absolute bottom-0.5 inset-x-0 text-center font-mono font-bold text-[8px] text-amber-300 bg-slate-950/80 py-0.5 pointer-events-none">
          RADAR
        </div>
      </div>
    </div>
  );
};

const FpsOverlay: React.FC = () => {
  const [fpsInfo, setFpsInfo] = React.useState({ fps: 60, frameTime: 16.6 });

  React.useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const tick = () => {
      const now = performance.now();
      frameCount++;
      const delta = now - lastTime;
      if (delta >= 500) {
        const fps = Math.round((frameCount * 1000) / delta);
        const frameTime = parseFloat((delta / frameCount).toFixed(1));
        setFpsInfo({ fps, frameTime });
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="fixed bottom-3 right-3 bg-slate-950/90 border border-emerald-500/50 rounded-xl px-2.5 py-1.5 font-mono text-[11px] text-emerald-400 font-bold shadow-xl z-50 pointer-events-none flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      <span>{fpsInfo.fps} FPS</span>
      <span className="text-slate-500">|</span>
      <span>{fpsInfo.frameTime} ms</span>
    </div>
  );
};
