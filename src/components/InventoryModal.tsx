import React from 'react';
import { QuestProgress, PlayerStats } from '../game/types';
import { X, Key, Coins, Sparkles, Package, ShieldAlert, Award } from 'lucide-react';

interface Props {
  onClose: () => void;
  quest: QuestProgress;
  stats: PlayerStats;
}

export const InventoryModal: React.FC<Props> = ({ onClose, quest, stats }) => {
  const keysList = [
    { id: 'sun', name: 'Sun Key', color: 'from-amber-500 to-yellow-400', loc: 'Sun Temple Ruins', collected: quest.keysCollected.sun },
    { id: 'ocean', name: 'Ocean Key', color: 'from-cyan-500 to-blue-400', loc: 'Waterfall Grotto', collected: quest.keysCollected.ocean },
    { id: 'forest', name: 'Forest Key', color: 'from-emerald-500 to-green-400', loc: 'Sacred Grove', collected: quest.keysCollected.forest },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 pointer-events-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-snug">Explorer Backpack & Satchel</h3>
              <p className="text-xs text-slate-400">Inventory & Quest Collectibles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Level & XP Stats bar */}
        <div className="px-5 py-3.5 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-xs text-slate-400 uppercase font-bold">Explorer Rank</span>
              <div className="text-sm font-bold text-amber-300">Level {stats.level} Pioneer</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-yellow-400 font-extrabold text-sm">
              <Coins className="w-4 h-4" />
              <span>{quest.coinsCollected || 0}</span>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-400 font-extrabold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>{quest.xpEarned || 0} XP</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 space-y-5 overflow-y-auto max-h-[60vh]">
          {/* Section: Elemental Keys */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-amber-400" />
              Elemental Gate Keys ({quest.keysCount}/3)
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {keysList.map((k) => (
                <div
                  key={k.id}
                  className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all ${
                    k.collected
                      ? 'bg-slate-800/90 border-amber-500/50 shadow-md shadow-amber-500/10'
                      : 'bg-slate-900/50 border-slate-800 opacity-50 grayscale'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-tr ${k.color} text-slate-950 font-bold shadow-md mb-2`}
                  >
                    <Key className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-200">{k.name}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{k.collected ? 'Acquired' : k.loc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Survival Crystals */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              Survival Energy Crystals ({quest.crystalsCollected || 0}/{quest.totalCrystals || 5})
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-200">Ancient Resonant Crystals</div>
                  <div className="text-xs text-slate-400">Restores energy and unlocks shrine vaults</div>
                </div>
              </div>
              <span className="text-base font-extrabold text-cyan-300">
                {quest.crystalsCollected || 0} / {quest.totalCrystals || 5}
              </span>
            </div>
          </div>

          {/* Section: Treasure Chest Stats */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-amber-400" />
              Treasure Vault Discovery
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 flex justify-between items-center">
                <span className="text-xs text-slate-300 font-semibold">Chests Opened</span>
                <span className="text-sm font-extrabold text-amber-300">
                  {quest.chestsOpened} / {quest.totalChests}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 flex justify-between items-center">
                <span className="text-xs text-slate-300 font-semibold">Puzzles Solved</span>
                <span className="text-sm font-extrabold text-emerald-300">
                  {quest.puzzlesSolvedCount || 0} / {quest.totalPuzzles || 3}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-800/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
          >
            Close Satchel
          </button>
        </div>
      </div>
    </div>
  );
};
