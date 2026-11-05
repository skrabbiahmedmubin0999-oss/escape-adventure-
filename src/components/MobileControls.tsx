import React, { useRef, useState, useEffect } from 'react';
import { ArrowUp, Hand, Zap } from 'lucide-react';

interface MobileControlsProps {
  onJoystickMove: (x: number, y: number) => void;
  onJump: (active: boolean) => void;
  onSprint: (active: boolean) => void;
  onInteract: () => void;
  isInteractAvailable: boolean;
  interactLabel?: string;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onJoystickMove,
  onJump,
  onSprint,
  onInteract,
  isInteractAvailable,
  interactLabel,
}) => {
  const stickBaseRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const touchIdRef = useRef<number | null>(null);
  const [isSprintLocked, setIsSprintLocked] = useState(false);

  // Handle Joystick with Pointer Capture (works for both touch & mouse)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    setIsDragging(true);
    updateKnob(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updateKnob(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    setIsDragging(false);
    setKnobPos({ x: 0, y: 0 });
    onJoystickMove(0, 0);
  };

  const updateKnob = (clientX: number, clientY: number) => {
    if (!stickBaseRef.current) return;
    const rect = stickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const maxRadius = rect.width / 2;

    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const nx = (Math.cos(angle) * clampedDist) / maxRadius;
    const ny = (Math.sin(angle) * clampedDist) / maxRadius;

    setKnobPos({
      x: nx * maxRadius,
      y: ny * maxRadius,
    });

    onJoystickMove(nx, ny);
  };

  // Toggle sprint for mobile convenience
  const handleToggleSprint = () => {
    const next = !isSprintLocked;
    setIsSprintLocked(next);
    onSprint(next);
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30 overflow-hidden">
      {/* Virtual Joystick (Bottom-Left) */}
      <div
        className="absolute pointer-events-auto touch-none"
        style={{
          left: 'max(16px, env(safe-area-inset-left, 16px))',
          bottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
        }}
      >
        <div
          ref={stickBaseRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-slate-950/70 border-2 border-amber-400/30 relative flex items-center justify-center touch-none shadow-2xl"
          style={{ touchAction: 'none' }}
        >
          {/* Subtle directional cross markings */}
          <div className="absolute w-20 h-20 rounded-full border border-white/10 pointer-events-none" />
          <div className="absolute w-full h-[1px] bg-white/10 pointer-events-none" />
          <div className="absolute h-full w-[1px] bg-white/10 pointer-events-none" />

          {/* Thumb Knob */}
          <div
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg border border-white/40 absolute flex items-center justify-center pointer-events-none transition-transform duration-75 ${
              isDragging
                ? 'bg-gradient-to-tr from-amber-500 to-amber-300 scale-105'
                : 'bg-gradient-to-tr from-amber-600 to-amber-400'
            }`}
            style={{
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            }}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-amber-900/50 shadow-inner" />
          </div>
        </div>
        <div className="text-center text-[10px] uppercase font-bold text-slate-300/80 tracking-widest mt-1">
          Move
        </div>
      </div>

      {/* Action Buttons (Bottom-Right) */}
      <div
        className="absolute pointer-events-auto flex flex-col items-end gap-2.5"
        style={{
          right: 'max(16px, env(safe-area-inset-right, 16px))',
          bottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
        }}
      >
        {/* Proximity Interact Button */}
        {isInteractAvailable && (
          <button
            onClick={onInteract}
            className="group flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-emerald-500 active:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl border-2 border-emerald-300 active:scale-95 transition-all mb-1 cursor-pointer"
            aria-label="Interact"
          >
            <Hand className="w-5 h-5 text-slate-950" />
            <span>{interactLabel || 'Interact'}</span>
          </button>
        )}

        {/* Buttons Cluster: RUN & JUMP */}
        <div className="flex items-center gap-3">
          {/* RUN Button (Tap to toggle sprint or hold) */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              handleToggleSprint();
            }}
            onClick={handleToggleSprint}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center shadow-lg border active:scale-95 transition-all cursor-pointer ${
              isSprintLocked
                ? 'bg-amber-400 text-slate-950 border-white shadow-amber-500/40'
                : 'bg-slate-900/85 text-amber-300 border-amber-400/40 active:bg-amber-600'
            }`}
            aria-label="Run"
          >
            <Zap className={`w-4 h-4 ${isSprintLocked ? 'fill-slate-950' : ''}`} />
            <span className="text-[10px] font-extrabold uppercase tracking-tight">Run</span>
          </button>

          {/* JUMP Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onJump(true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              onJump(false);
            }}
            onTouchCancel={(e) => {
              e.preventDefault();
              onJump(false);
            }}
            onMouseDown={() => onJump(true)}
            onMouseUp={() => onJump(false)}
            onMouseLeave={() => onJump(false)}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-sky-600 to-sky-400 active:from-sky-500 active:to-sky-300 text-white shadow-xl border-2 border-white/50 flex flex-col items-center justify-center active:scale-95 transition-all cursor-pointer"
            aria-label="Jump"
          >
            <ArrowUp className="w-6 h-6 stroke-[2.5]" />
            <span className="text-[10px] font-black uppercase tracking-wider -mt-0.5">Jump</span>
          </button>
        </div>
      </div>
    </div>
  );
};
