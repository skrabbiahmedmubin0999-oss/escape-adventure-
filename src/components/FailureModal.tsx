import React from 'react';
import { RefreshCw, Home, Clock, Sparkles, Coins, AlertTriangle } from 'lucide-react';

interface Props {
  reason?: string;
  crystalsCollected: number;
  totalCrystals: number;
  coinsCollected: number;
  timeElapsed: number;
  onRetry: () => void;
  onReturnToMenu: () => void;
}

export const FailureModal: React.FC<Props> = ({
  reason = 'The dusk storm covered Mystery Island before all energy crystals were rescued!',
  crystalsCollected,
  totalCrystals,
  coinsCollected,
  timeElapsed,
  onRetry,
  onReturnToMenu,
}) => {
  const mins = Math.floor(timeElapsed / 60);
  const secs = Math.floor(timeElapsed % 60);
  const formattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300 pointer-events-auto select-none">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-red-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 p-6 sm:p-8 text-center">
        {/* Top Failure Icon Badge */}
        <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-500/20 border-2 border-red-500/60 text-red-400 flex items-center justify-center shadow-lg shadow-red-500/20 mb-4 animate-bounce">
          <AlertTriangle className="w-9 h-9 sm:w-11 sm:h-11" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-red-400 uppercase">
          Mission Failed
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed max-w-xs mx-auto">
          {reason}
        </p>

        {/* Mission Stats Breakdown */}
        <div className="my-6 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" /> Crystals
            </span>
            <span className="text-base font-extrabold text-cyan-300 mt-1">
              {crystalsCollected}/{totalCrystals}
            </span>
          </div>

          <div className="flex flex-col items-center border-x border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Coins className="w-3 h-3 text-amber-400" /> Gold
            </span>
            <span className="text-base font-extrabold text-amber-300 mt-1">
              {coinsCollected}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" /> Time
            </span>
            <span className="text-base font-extrabold text-slate-200 mt-1 font-mono">
              {formattedTime}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            onClick={onRetry}
            className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>

          <button
            onClick={onReturnToMenu}
            className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" /> Menu
          </button>
        </div>
      </div>
    </div>
  );
};
