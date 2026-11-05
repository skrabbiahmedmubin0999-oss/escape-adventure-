import React, { useEffect } from 'react';
import { Play, Users, BookOpen, Settings, User, Compass, Key, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { sound } from '../audio/soundSystem';

interface MainMenuProps {
  onStartGame: () => void;
  onOpenMultiplayer: () => void;
  onOpenHowToPlay: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  playerName: string;
  playerTitle: string;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onOpenMultiplayer,
  onOpenHowToPlay,
  onOpenSettings,
  onOpenProfile,
  playerName,
  playerTitle,
  isMuted,
  onToggleMute,
}) => {
  // Keyboard shortcut: Enter or Space to start game immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        // Only if not actively typing in an input
        if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
        e.preventDefault();
        sound.playClick();
        onStartGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame]);

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30 flex flex-col justify-between p-3 xs:p-4 sm:p-8 pt-[max(12px,env(safe-area-inset-top,12px))] pb-[max(12px,env(safe-area-inset-bottom,12px))] px-[max(12px,env(safe-area-inset-left,12px))] font-sans overflow-y-auto">
      {/* Top Bar: Profile Badge & Audio Toggle */}
      <div className="flex items-center justify-between w-full pointer-events-auto max-w-xl mx-auto">
        {/* Profile Card Button */}
        <button
          onClick={() => {
            sound.playClick();
            onOpenProfile();
          }}
          className="bg-slate-900/85 hover:bg-slate-800/95 text-slate-100 border border-amber-500/30 rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 flex items-center gap-2.5 shadow-xl transition-all hover:scale-[1.02] cursor-pointer"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-bold text-sm shadow shrink-0">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
          </div>
          <div className="text-left leading-tight">
            <div className="text-xs font-bold text-slate-200 tracking-wide truncate max-w-[120px] sm:max-w-[180px]">{playerName}</div>
            <div className="text-[10px] sm:text-[11px] font-semibold text-amber-400 truncate max-w-[120px] sm:max-w-[180px]">{playerTitle}</div>
          </div>
        </button>

        {/* Audio Mute Button */}
        <button
          onClick={() => {
            sound.playClick();
            onToggleMute();
          }}
          className="bg-slate-900/85 hover:bg-slate-800/95 text-slate-200 p-2.5 sm:p-3 rounded-2xl border border-slate-700 shadow-xl transition-all cursor-pointer"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />}
        </button>
      </div>

      {/* Hero Title & Main Actions (Centered with 30-40% negative space) */}
      <div className="flex flex-col items-center justify-center text-center my-auto pointer-events-auto max-w-xl mx-auto w-full py-4">
        {/* Bespoke Inline SVG Title Lockup */}
        <div className="mb-4 sm:mb-6 transform hover:scale-[1.01] transition-transform w-full flex justify-center">
          <svg
            viewBox="0 0 540 120"
            className="w-full max-w-[280px] xs:max-w-[320px] sm:max-w-md h-auto filter drop-shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
          >
            <defs>
              <linearGradient id="titleGoldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fff2a3" />
                <stop offset="50%" stopColor="#f39c12" />
                <stop offset="100%" stopColor="#b76500" />
              </linearGradient>
              <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2ecc71" />
                <stop offset="100%" stopColor="#1b6038" />
              </linearGradient>
            </defs>

            {/* Decorative Compass / Sun Crest behind */}
            <circle cx="270" cy="55" r="46" fill="none" stroke="rgba(241, 196, 15, 0.25)" strokeWidth="3" />
            <polygon points="270,4 275,24 270,20 265,24" fill="#f1c40f" opacity="0.8" />
            <polygon points="270,106 275,86 270,90 265,86" fill="#f1c40f" opacity="0.8" />
            <polygon points="219,55 239,50 235,55 239,60" fill="#f1c40f" opacity="0.8" />
            <polygon points="321,55 301,50 305,55 301,60" fill="#f1c40f" opacity="0.8" />

            {/* Main Word: ESCAPE */}
            <text
              x="270"
              y="58"
              textAnchor="middle"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="48"
              fontWeight="900"
              letterSpacing="7"
              fill="url(#titleGoldGrad)"
              stroke="#2c1a06"
              strokeWidth="2.5"
            >
              ESCAPE
            </text>

            {/* Secondary Word: ADVENTURE */}
            <text
              x="270"
              y="88"
              textAnchor="middle"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="24"
              fontWeight="800"
              letterSpacing="10"
              fill="#ecf0f1"
              stroke="#1a252f"
              strokeWidth="1.2"
            >
              ADVENTURE
            </text>

            {/* Subtitle banner */}
            <text
              x="270"
              y="110"
              textAnchor="middle"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="11"
              fontWeight="700"
              letterSpacing="4"
              fill="#f1c40f"
            >
              • ISLAND QUEST & ANCIENT RUINS •
            </text>
          </svg>
        </div>

        {/* Action Buttons Menu */}
        <div className="flex flex-col gap-2.5 sm:gap-3 w-full max-w-sm px-2">
          {/* Primary CTA: PLAY */}
          <button
            onClick={() => {
              sound.playClick();
              onStartGame();
            }}
            className="group relative w-full py-3.5 sm:py-4 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-base sm:text-lg uppercase tracking-wider shadow-2xl border-2 border-amber-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-slate-950 text-slate-950 transition-transform group-hover:scale-110" />
            <span>Play Solo Adventure</span>
            <span className="text-[10px] bg-slate-950/20 text-slate-900 px-2 py-0.5 rounded font-mono font-bold tracking-normal hidden sm:inline">
              SPACE
            </span>
          </button>

          {/* Multiplayer Lobby */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenMultiplayer();
            }}
            className="w-full py-3 sm:py-3.5 px-5 rounded-2xl bg-slate-900/90 hover:bg-slate-800/95 text-slate-100 font-bold text-xs sm:text-sm uppercase tracking-wider border border-slate-700 shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
            <span>Multiplayer Lobby</span>
            <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded border border-sky-400/30">
              Co-Op Ready
            </span>
          </button>

          {/* Grid of secondary actions: How to Play & Settings */}
          <div className="grid grid-cols-2 gap-2.5 mt-0.5">
            <button
              onClick={() => {
                sound.playClick();
                onOpenHowToPlay();
              }}
              className="py-2.5 sm:py-3 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 text-slate-200 font-semibold text-xs tracking-wide border border-slate-700 shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              <span>How to Play</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onOpenSettings();
              }}
              className="py-2.5 sm:py-3 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 text-slate-200 font-semibold text-xs tracking-wide border border-slate-700 shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Flat Control-Hint Line */}
      <div className="w-full text-center text-[11px] sm:text-xs font-medium text-slate-300/90 tracking-wide pointer-events-auto pb-1">
        <span className="bg-slate-900/80 px-3.5 py-1.5 rounded-full border border-slate-700/60 shadow-md inline-block max-w-[95%] truncate">
          WASD / Joystick Move · Space Jump · E Interact · Orbit Camera
        </span>
      </div>
    </div>
  );
};
