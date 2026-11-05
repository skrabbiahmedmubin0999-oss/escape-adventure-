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
}) => {
  const [isQuestDetailsOpen, setIsQuestDetailsOpen] = useState(false);
  const [isEnvPanelOpen, setIsEnvPanelOpen] = useState(false);

  // Format elapsed time (mm:ss)
  const minutes = Math.floor(quest.timeElapsed / 60);
  const seconds = Math.floor(quest.timeElapsed % 60);
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Current objective summary
  let currentObjective = `Find Keys (${quest.keysCount}/3)`;
  if (quest.gateUnlocked) {
    currentObjective = 'Portal Open! Step In';
  } else if (quest.altarActivated) {
    currentObjective = 'Opening Portal...';
  } else if (quest.keysCount >= 3) {
    currentObjective = 'Activate Rune Altar';
  }

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 overflow-hidden font-sans">
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

          {/* Center: Always-Visible 3 Elemental Key Badges & Treasure Stats */}
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
