import { X, User, Award, Key, Clock, CheckCircle, Coins, Package, Zap } from 'lucide-react';
import { sound } from '../audio/soundSystem';
import { PlayerCustomization, PlayerStats } from '../game/types';

interface ProfileModalProps {
  onClose: () => void;
  customization: PlayerCustomization;
  onUpdateCustomization: (newVal: Partial<PlayerCustomization>) => void;
  stats: PlayerStats;
}

const TUNIC_COLORS = [
  { name: 'Amber Explorer', hex: '#e67e22' },
  { name: 'Forest Ranger', hex: '#27ae60' },
  { name: 'Ocean Voyager', hex: '#2980b9' },
  { name: 'Crimson Scout', hex: '#c0392b' },
  { name: 'Night Stalker', hex: '#34495e' },
  { name: 'Royal Scholar', hex: '#8e44ad' },
];

const HAT_COLORS = [
  { name: 'Mystic Purple', hex: '#8e44ad' },
  { name: 'Classic Leather', hex: '#4a2810' },
  { name: 'Golden Sun', hex: '#f1c40f' },
  { name: 'Emerald Moss', hex: '#16a085' },
  { name: 'Slate Gray', hex: '#7f8c8d' },
];

const TITLES = [
  'Novice Explorer',
  'Island Quest Pioneer',
  'Ancient Ruin Seeker',
  'Elemental Master',
  'Escape Adventure Champion',
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  onClose,
  customization,
  onUpdateCustomization,
  stats,
}) => {
  const formatTime = (secs: number | null) => {
    if (secs === null) return '--:--';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-none font-sans">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[88dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white leading-tight">Player Profile</h2>
              <p className="text-[10px] sm:text-xs text-slate-400">Explorer identity & adventure statistics</p>
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
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto">
          {/* Identity Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-amber-400 mb-1.5">
                Explorer Name
              </label>
              <input
                type="text"
                value={customization.name}
                onChange={(e) => onUpdateCustomization({ name: e.target.value })}
                maxLength={20}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-amber-400 mb-1.5">
                Title Rank
              </label>
              <select
                value={customization.title}
                onChange={(e) => onUpdateCustomization({ title: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {TITLES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Outfit Customization */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-amber-400 mb-2">
                Explorer Tunic Color
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {TUNIC_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => {
                      sound.playClick();
                      onUpdateCustomization({ tunicColor: c.hex });
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      customization.tunicColor === c.hex
                        ? 'bg-slate-800 border-amber-400 shadow'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-lg border border-white/20 shadow-sm"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="text-[10px] text-slate-300 font-medium truncate w-full text-center">
                      {c.name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-amber-400 mb-2">
                Hat Color
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {HAT_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => {
                      sound.playClick();
                      onUpdateCustomization({ hatColor: c.hex });
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      customization.hatColor === c.hex
                        ? 'bg-slate-800 border-amber-400 shadow'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-lg border border-white/20 shadow-sm"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="text-[10px] text-slate-300 font-medium truncate w-full text-center">
                      {c.name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Player Statistics */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Award className="w-4 h-4" /> Lifetime Statistics
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Level {stats.level ?? 1} ({stats.xp ?? 0} XP)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <Clock className="w-4 h-4 text-sky-400 mx-auto mb-1" />
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Best Escape</div>
                <div className="text-sm font-black font-mono text-white mt-0.5">
                  {formatTime(stats.bestTime)}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <Key className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Keys Found</div>
                <div className="text-sm font-black font-mono text-white mt-0.5">
                  {stats.totalKeysCollected ?? 0}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <Coins className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Gold Coins</div>
                <div className="text-sm font-black font-mono text-amber-300 mt-0.5">
                  {stats.totalCoins ?? 0}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <Package className="w-4 h-4 text-sky-400 mx-auto mb-1" />
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Chests Opened</div>
                <div className="text-sm font-black font-mono text-sky-300 mt-0.5">
                  {stats.totalChests ?? 0}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <Award className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Puzzles Solved</div>
                <div className="text-sm font-black font-mono text-white mt-0.5">
                  {stats.puzzlesSolved ?? 0}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <CheckCircle className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Escapes Won</div>
                <div className="text-sm font-black font-mono text-white mt-0.5">
                  {stats.gamesCompleted ?? 0}
                </div>
              </div>
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
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
};
