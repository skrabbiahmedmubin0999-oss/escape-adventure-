import React from 'react';
import { X, BookOpen, Key, Compass, Sun, Droplets, Trees, ArrowUp, Hand } from 'lucide-react';
import { sound } from '../audio/soundSystem';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-none font-sans">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[88dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white leading-tight">How to Play</h2>
              <p className="text-[10px] sm:text-xs text-slate-400">Rules & Exploration Guide</p>
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

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto text-xs text-slate-300">
          {/* Mission Objective */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="font-extrabold uppercase text-amber-400 tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4" /> The Grand Mission
            </div>
            <p className="leading-relaxed">
              You awake at a mysterious beach campsite on an ancient tropical island. The only way home is through the <strong className="text-white">Grand Escape Gate</strong> to the North, which is sealed with 3 ancient elemental rune locks.
            </p>
          </div>

          {/* 3 Elemental Keys */}
          <div className="space-y-2.5">
            <div className="font-extrabold uppercase text-amber-400 tracking-wider">
              Step 1: Seek the 3 Elemental Keys
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-amber-500/30">
                <div className="flex items-center gap-1.5 text-amber-300 font-bold mb-1">
                  <Sun className="w-4 h-4" /> Sun Key
                </div>
                <div className="text-[11px] text-slate-400">
                  Located atop the North-East sun hill at the ancient Sun Temple Ruins.
                </div>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-sky-500/30">
                <div className="flex items-center gap-1.5 text-sky-300 font-bold mb-1">
                  <Droplets className="w-4 h-4" /> Ocean Key
                </div>
                <div className="text-[11px] text-slate-400">
                  Hidden beneath the river bend near the rushing Waterfall Grotto.
                </div>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-emerald-500/30">
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold mb-1">
                  <Trees className="w-4 h-4" /> Forest Key
                </div>
                <div className="text-[11px] text-slate-400">
                  Guarded inside the Sacred Ancient Grove surrounded by giant trees.
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 & 3 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <div className="font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-extrabold flex items-center justify-center">2</span>
                <span>Activate Rune Altar</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Bring all 3 keys to the central plaza altar. Press <strong className="text-amber-400">[E]</strong> to place keys and ignite the magical circuit.
              </p>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <div className="font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-[11px] font-extrabold flex items-center justify-center">3</span>
                <span>Escape Through Portal</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                The Grand Gate will open with an energy vortex. Step inside to claim your victory and set a record time!
              </p>
            </div>
          </div>

          {/* Controls Reference */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="font-extrabold uppercase text-amber-400 tracking-wider">
              Controls
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="bg-slate-900 p-2 rounded-lg text-center">
                <div className="font-mono font-bold text-amber-400">W A S D / Arrows</div>
                <div className="text-slate-400 mt-0.5">Move Character</div>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg text-center">
                <div className="font-mono font-bold text-amber-400">Spacebar</div>
                <div className="text-slate-400 mt-0.5">Jump</div>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg text-center">
                <div className="font-mono font-bold text-amber-400">Left Shift</div>
                <div className="text-slate-400 mt-0.5">Sprint / Run</div>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg text-center">
                <div className="font-mono font-bold text-amber-400">E / Touch Button</div>
                <div className="text-slate-400 mt-0.5">Interact</div>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 text-center">
              Click and drag anywhere on screen to smoothly orbit and tilt the camera.
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
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};
