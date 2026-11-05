import React from 'react';
import { Trophy, Star, RotateCcw, Home, Clock, Key, Sparkles, Coins, Package } from 'lucide-react';
import { sound } from '../audio/soundSystem';

interface VictoryModalProps {
  timeElapsed: number;
  bestTime: number | null;
  coinsCollected: number;
  chestsOpened: number;
  totalChests: number;
  xpEarned: number;
  onPlayAgain: () => void;
  onReturnToMenu: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  timeElapsed,
  bestTime,
  coinsCollected,
  chestsOpened,
  totalChests,
  xpEarned,
  onPlayAgain,
  onReturnToMenu,
}) => {
  const minutes = Math.floor(timeElapsed / 60);
  const seconds = Math.floor(timeElapsed % 60);
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const isNewRecord = bestTime !== null && (bestTime === timeElapsed || timeElapsed <= bestTime);

  // Rating based on speed
  const stars = timeElapsed < 120 ? 3 : timeElapsed < 240 ? 2 : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-none font-sans overflow-y-auto">
      <div className="bg-slate-900 border-2 border-amber-500/80 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl text-center flex flex-col max-h-[88dvh] overflow-y-auto my-auto">
        {/* Top Celebration Banner */}
        <div className="bg-gradient-to-b from-amber-600/40 via-amber-500/20 to-transparent p-4 sm:p-6 pb-2 shrink-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-xl border-2 border-white/40 mb-2.5 sm:mb-3">
            <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-slate-950" />
          </div>

          <h1 className="text-2xl font-black uppercase tracking-wider text-white">
            Island Escaped!
          </h1>
          <p className="text-xs font-semibold text-amber-300 mt-0.5">
            You conquered the ancient puzzles of the island
          </p>

          {/* Star Rating */}
          <div className="flex justify-center gap-1.5 my-3">
            {[1, 2, 3].map((s) => (
              <Star
                key={s}
                className={`w-7 h-7 ${
                  s <= stars
                    ? 'text-amber-400 fill-amber-400 filter drop-shadow'
                    : 'text-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <Clock className="w-4 h-4 text-sky-400 mx-auto mb-0.5" />
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Escape Time
              </div>
              <div className="text-lg sm:text-xl font-black font-mono text-white mt-0.5">
                {timeFormatted}
              </div>
              {isNewRecord && (
                <div className="text-[9px] font-bold text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> New Record!
                </div>
              )}
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <Key className="w-4 h-4 text-amber-400 mx-auto mb-0.5" />
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Elemental Keys
              </div>
              <div className="text-lg sm:text-xl font-black font-mono text-amber-400 mt-0.5">
                3 / 3
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-semibold">
                Sun · Ocean · Forest
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-amber-500/30">
              <Coins className="w-4 h-4 text-amber-400 mx-auto mb-0.5" />
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Coins Collected
              </div>
              <div className="text-lg sm:text-xl font-black font-mono text-amber-300 mt-0.5">
                +{coinsCollected}
              </div>
              <div className="text-[10px] text-amber-500/80 mt-0.5 font-semibold">
                Gold Doubloons
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-sky-500/30">
              <Package className="w-4 h-4 text-sky-400 mx-auto mb-0.5" />
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Chests & XP
              </div>
              <div className="text-lg sm:text-xl font-black font-mono text-sky-300 mt-0.5">
                {chestsOpened}/{totalChests}
              </div>
              <div className="text-[10px] text-emerald-400 mt-0.5 font-semibold">
                +{xpEarned} Adventure XP
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
            Congratulations! The ancient portal has returned you safely home. Ready for another expedition?
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-0 space-y-2.5">
          <button
            onClick={() => {
              sound.playClick();
              onPlayAgain();
            }}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onReturnToMenu();
            }}
            className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
