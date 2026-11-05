import React from 'react';
import { NotificationToast as ToastItem } from '../game/types';
import { Coins, Sparkles, Trophy, Key, CheckCircle, ShieldAlert, Package, Compass } from 'lucide-react';

interface Props {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const NotificationToastContainer: React.FC<Props> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 max-w-xs sm:max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        let icon = <Sparkles className="w-5 h-5 text-amber-400" />;
        let borderColor = 'border-amber-500/40 bg-slate-900/90';

        if (toast.type === 'coin') {
          icon = <Coins className="w-5 h-5 text-yellow-400" />;
          borderColor = 'border-yellow-500/50 bg-slate-900/90 text-yellow-200';
        } else if (toast.type === 'xp') {
          icon = <Sparkles className="w-5 h-5 text-cyan-400" />;
          borderColor = 'border-cyan-500/50 bg-slate-900/90 text-cyan-200';
        } else if (toast.type === 'chest') {
          icon = <Package className="w-5 h-5 text-amber-300" />;
          borderColor = 'border-amber-400/60 bg-amber-950/80 text-amber-100';
        } else if (toast.type === 'puzzle') {
          icon = <CheckCircle className="w-5 h-5 text-emerald-400" />;
          borderColor = 'border-emerald-500/60 bg-slate-900/95 text-emerald-100';
        } else if (toast.type === 'checkpoint') {
          icon = <Compass className="w-5 h-5 text-sky-400" />;
          borderColor = 'border-sky-500/50 bg-slate-900/90 text-sky-100';
        } else if (toast.type === 'achievement') {
          icon = <Trophy className="w-5 h-5 text-yellow-300" />;
          borderColor = 'border-yellow-400/80 bg-amber-950/90 text-yellow-100 animate-pulse';
        } else if (toast.type === 'key') {
          icon = <Key className="w-5 h-5 text-amber-400" />;
          borderColor = 'border-amber-500/60 bg-slate-900/95 text-amber-100';
        } else if (toast.type === 'survival') {
          icon = <ShieldAlert className="w-5 h-5 text-cyan-300" />;
          borderColor = 'border-cyan-400/60 bg-cyan-950/90 text-cyan-100';
        }

        return (
          <div
            key={toast.id}
            onClick={() => onDismiss(toast.id)}
            className={`pointer-events-auto flex items-start gap-3 p-3 rounded-xl border backdrop-blur-md shadow-xl transition-all duration-300 transform translate-x-0 animate-in fade-in slide-in-from-right-8 cursor-pointer ${borderColor}`}
          >
            <div className="p-1.5 rounded-lg bg-slate-800/80 shrink-0">{icon}</div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold uppercase tracking-wider opacity-90">{toast.title}</h4>
              <p className="text-sm font-medium leading-tight mt-0.5">{toast.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
