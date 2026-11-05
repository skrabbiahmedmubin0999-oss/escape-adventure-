import React, { useState } from 'react';
import { puzzleSystem } from '../game/puzzleSystem';
import { PuzzleState } from '../game/types';
import { X, Sparkles, CheckCircle2, RotateCw, ToggleLeft, HelpCircle } from 'lucide-react';

interface Props {
  activePuzzleId: string | null;
  onClose: () => void;
  onPuzzleSolved: (puzzleId: string) => void;
}

export const PuzzleModal: React.FC<Props> = ({ activePuzzleId, onClose, onPuzzleSolved }) => {
  const [puzzles, setPuzzles] = useState<PuzzleState[]>(() => puzzleSystem.getPuzzles());

  if (!activePuzzleId) return null;

  const currentPuzzle = puzzles.find((p) => p.id === activePuzzleId);
  if (!currentPuzzle) return null;

  const refreshPuzzles = () => {
    const updated = puzzleSystem.getPuzzles();
    setPuzzles(updated);
    const p = updated.find((item) => item.id === activePuzzleId);
    if (p && p.solved) {
      onPuzzleSolved(p.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 pointer-events-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-snug">{currentPuzzle.name}</h3>
              <p className="text-xs text-slate-400">{currentPuzzle.locationName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clue Banner */}
        <div className="px-5 py-3 bg-amber-950/30 border-b border-amber-900/40 flex items-start gap-2.5 text-amber-200/90 text-sm">
          <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-400">Ancient Clue: </span>
            {currentPuzzle.clue}
          </div>
        </div>

        {/* Puzzle Content Body */}
        <div className="p-6 flex-1 flex flex-col items-center justify-center min-h-[220px]">
          {currentPuzzle.solved ? (
            <div className="flex flex-col items-center text-center py-4 animate-in zoom-in-90 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 mb-3 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-emerald-300">Puzzle Solved!</h4>
              <p className="text-sm text-slate-300 mt-1 max-w-xs">
                The ancient mechanism has unlocked! Secret vault chambers & rewards revealed.
              </p>
              <button
                onClick={onClose}
                className="mt-5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all"
              >
                Claim Rewards & Close
              </button>
            </div>
          ) : (
            <>
              {/* Puzzle A — Symbol Matching */}
              {currentPuzzle.type === 'symbol_match' && (
                <div className="w-full flex flex-col items-center gap-5">
                  <p className="text-xs text-slate-400 text-center">
                    Tap each pillar to rotate through elemental symbols.
                  </p>
                  <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full">
                    {currentPuzzle.symbols?.map((sym, idx) => {
                      const iconMap: Record<string, string> = {
                        Sun: '☀️ Sun',
                        Water: '🌊 Water',
                        Leaf: '🍃 Leaf',
                        Moon: '🌙 Moon',
                      };
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            puzzleSystem.rotatePillarSymbol(currentPuzzle.id, idx);
                            refreshPuzzles();
                          }}
                          className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-amber-500/50 text-amber-300 transition-all active:scale-95 shadow-md group"
                        >
                          <span className="text-xs text-slate-400 font-bold mb-1">Pillar {idx + 1}</span>
                          <span className="text-base font-extrabold text-amber-300 group-hover:scale-110 transition-transform">
                            {iconMap[sym] || sym}
                          </span>
                          <RotateCw className="w-4 h-4 text-slate-400 mt-2 opacity-70 group-hover:opacity-100" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Puzzle B — Switch Sequence */}
              {currentPuzzle.type === 'switch_sequence' && (
                <div className="w-full flex flex-col items-center gap-5">
                  <p className="text-xs text-slate-400 text-center">
                    Activate levers in the correct order. Incorrect sequence resets all switches.
                  </p>
                  <div className="grid grid-cols-4 gap-2.5 sm:gap-3 w-full">
                    {currentPuzzle.switchesState?.map((isLit, idx) => {
                      const romanLabels = ['Lever I', 'Lever II', 'Lever III', 'Lever IV'];
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            puzzleSystem.toggleSwitch(currentPuzzle.id, idx);
                            refreshPuzzles();
                          }}
                          className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border transition-all active:scale-95 shadow-md ${
                            isLit
                              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-emerald-500/20'
                              : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-emerald-500/40'
                          }`}
                        >
                          <ToggleLeft
                            className={`w-6 h-6 mb-1 ${isLit ? 'text-emerald-400 rotate-180' : 'text-slate-500'}`}
                          />
                          <span className="text-xs font-bold">{romanLabels[idx]}</span>
                          <span className={`text-[10px] mt-1 font-semibold ${isLit ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {isLit ? 'ACTIVE' : 'OFF'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Puzzle C — Ancient Rune Dial */}
              {currentPuzzle.type === 'rune_dial' && (
                <div className="w-full flex flex-col items-center gap-5">
                  <p className="text-xs text-slate-400 text-center">
                    Rotate the concentric rings to align the solar, ocean, and forest glyphs.
                  </p>
                  <div className="flex flex-col gap-3 w-full max-w-sm">
                    {['Solar Ring (Outer)', 'Ocean Ring (Middle)', 'Forest Ring (Inner)'].map((ringName, idx) => {
                      const angle = currentPuzzle.dialAngles?.[idx] || 0;
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700"
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-300">{ringName}</div>
                            <div className="text-xs text-purple-400 font-mono mt-0.5">Angle: {angle}°</div>
                          </div>
                          <button
                            onClick={() => {
                              puzzleSystem.rotateRuneRing(currentPuzzle.id, idx);
                              refreshPuzzles();
                            }}
                            className="px-3 py-1.5 rounded-lg bg-purple-600/80 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                            Rotate 90°
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-800/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
