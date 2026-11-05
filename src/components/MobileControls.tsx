import React, { useRef, useState, useEffect } from 'react';
import { ArrowUp, Hand, Zap, EyeOff, Shield, Crosshair, Swords } from 'lucide-react';

interface MobileControlsProps {
  onJoystickMove: (x: number, y: number) => void;
  onJump: (active: boolean) => void;
  onSprint: (active: boolean) => void;
  onCrouch?: (active: boolean) => void;
  onInteract: () => void;
  isInteractAvailable: boolean;
  interactLabel?: string;
  stoneCooldownRemaining?: number;
  onThrowStone?: () => void;
  // Phase 7 Combat
  onAttack: (active: boolean) => void;
  onParry: (active: boolean) => void;
  onDodge: (active: boolean) => void;
  onShoot: (active: boolean) => void;
  firearmAuthorized: boolean;
  ammoCount: number;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onJoystickMove,
  onJump,
  onSprint,
  onCrouch,
  onInteract,
  isInteractAvailable,
  interactLabel,
  stoneCooldownRemaining = 0,
  onThrowStone,
  onAttack,
  onParry,
  onDodge,
  onShoot,
  firearmAuthorized,
  ammoCount,
}) => {
  const stickBaseRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isSprinting, setIsSprinting] = useState(false);
  const [isCrouching, setIsCrouching] = useState(false);

  // Global blur / visibility change listener: reset all inputs on focus loss / tab switch
  useEffect(() => {
    const handleResetAllInputs = () => {
      setIsDragging(false);
      setKnobPos({ x: 0, y: 0 });
      setIsSprinting(false);
      setIsCrouching(false);
      onJoystickMove(0, 0);
      onSprint(false);
      if (onCrouch) onCrouch(false);
      onJump(false);
    };

    window.addEventListener('blur', handleResetAllInputs);
    window.addEventListener('pointercancel', handleResetAllInputs);
    document.addEventListener('visibilitychange', handleResetAllInputs);

    return () => {
      window.removeEventListener('blur', handleResetAllInputs);
      window.removeEventListener('pointercancel', handleResetAllInputs);
      document.removeEventListener('visibilitychange', handleResetAllInputs);
    };
  }, [onJoystickMove, onSprint, onCrouch, onJump]);

  // Handle Joystick with Pointer Capture
  const handleJoystickDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    setIsDragging(true);
    updateKnob(e.clientX, e.clientY);
  };

  const handleJoystickMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updateKnob(e.clientX, e.clientY);
  };

  const handleJoystickUp = (e: React.PointerEvent) => {
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

  // Hold RUN handler
  const handleSprintStart = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsSprinting(true);
    onSprint(true);
  };

  const handleSprintEnd = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsSprinting(false);
    onSprint(false);
  };

  // Hold CROUCH/HIDE handler
  const handleCrouchStart = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsCrouching(true);
    if (onCrouch) onCrouch(true);
  };

  const handleCrouchEnd = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsCrouching(false);
    if (onCrouch) onCrouch(false);
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30 overflow-hidden" style={{ touchAction: 'none' }}>
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
          onPointerDown={handleJoystickDown}
          onPointerMove={handleJoystickMove}
          onPointerUp={handleJoystickUp}
          onPointerCancel={handleJoystickUp}
          className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-slate-950/75 border-2 border-amber-400/40 relative flex items-center justify-center touch-none shadow-2xl"
          style={{ touchAction: 'none' }}
        >
          {/* Directional cross guide */}
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

      {/* Action Buttons Cluster (Bottom-Right) */}
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
            className="group flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-500 active:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl border-2 border-emerald-300 active:scale-95 transition-all mb-1 cursor-pointer"
            aria-label="Interact"
          >
            <Hand className="w-5 h-5 text-slate-950" />
            <span>{interactLabel || 'Interact'}</span>
          </button>
        )}

        {/* Phase 7 Combat Action Buttons (Right-hand dominant cluster) */}
        <div className="flex items-center justify-end gap-2.5 sm:gap-3 mb-1">
          {/* DODGE / EVADE Button */}
          <button
            onClick={() => onDodge(true)}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center bg-slate-900/85 text-amber-500 border border-amber-500/40 active:bg-amber-600 active:scale-95 cursor-pointer shadow-lg transition-all"
            aria-label="Dodge"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-[8px] font-black uppercase tracking-tight">Dodge</span>
          </button>

          {/* BLOCK / PARRY Button (Hold) */}
          <button
            onTouchStart={(e) => { e.preventDefault(); onParry(true); }}
            onTouchEnd={(e) => { e.preventDefault(); onParry(false); }}
            onTouchCancel={(e) => { e.preventDefault(); onParry(false); }}
            onMouseDown={() => onParry(true)}
            onMouseUp={() => onParry(false)}
            onMouseLeave={() => onParry(false)}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center bg-slate-900/85 text-sky-400 border border-sky-400/40 active:bg-sky-600 active:scale-95 cursor-pointer shadow-lg transition-all"
            aria-label="Block"
          >
            <Shield className="w-4 h-4 text-sky-300" />
            <span className="text-[8px] font-black uppercase tracking-tight">Block</span>
          </button>

          {/* PRIMARY ATTACK: Strike (Sword) or Fire (Firearm) */}
          <button
            onClick={() => (firearmAuthorized && ammoCount > 0) ? onShoot(true) : onAttack(true)}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex flex-col items-center justify-center bg-gradient-to-tr from-red-700 to-red-500 active:from-red-600 active:to-red-400 text-white shadow-2xl border-2 border-white/50 active:scale-95 transition-all cursor-pointer relative"
            aria-label={(firearmAuthorized && ammoCount > 0) ? "Fire Weapon" : "Sword Strike"}
          >
            {(firearmAuthorized && ammoCount > 0) ? (
              <>
                <Crosshair className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-md" />
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest -mt-1">Fire</span>
                {/* Ammo Count Indicator */}
                <div className="absolute -top-1 -right-1 bg-slate-950 text-amber-400 text-[10px] font-black px-1.5 py-0.5 rounded-lg border border-amber-500 shadow-lg">
                  {ammoCount}
                </div>
              </>
            ) : (
              <>
                <Swords className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-md" />
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest -mt-1">Strike</span>
              </>
            )}
          </button>
        </div>

        {/* Action Buttons Cluster: DISTRACT, HIDE/CROUCH, RUN & JUMP */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Stone Throw Distraction Button */}
          <button
            onClick={() => {
              if (stoneCooldownRemaining <= 0) onThrowStone?.();
            }}
            disabled={stoneCooldownRemaining > 0}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center shadow-lg border transition-all ${
              stoneCooldownRemaining > 0
                ? 'bg-slate-950/90 text-slate-600 border-slate-800 opacity-60 cursor-not-allowed'
                : 'bg-slate-900/85 text-amber-500 border-amber-500/40 active:bg-amber-600 active:scale-95 cursor-pointer'
            }`}
            aria-label="Distract Guard"
          >
            <Zap className={`w-4 h-4 ${stoneCooldownRemaining > 0 ? 'text-slate-600' : 'text-amber-400'} rotate-180`} />
            <span className="text-[9px] font-extrabold uppercase tracking-tight">
              {stoneCooldownRemaining > 0 ? `${stoneCooldownRemaining.toFixed(0)}s` : 'Distract'}
            </span>
          </button>

          {/* Hold CROUCH / HIDE Button */}
          <button
            onTouchStart={handleCrouchStart}
            onTouchEnd={handleCrouchEnd}
            onTouchCancel={handleCrouchEnd}
            onMouseDown={handleCrouchStart}
            onMouseUp={handleCrouchEnd}
            onMouseLeave={handleCrouchEnd}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center shadow-lg border active:scale-95 transition-all cursor-pointer ${
              isCrouching
                ? 'bg-sky-400 text-slate-950 border-white shadow-sky-500/40'
                : 'bg-slate-900/85 text-sky-300 border-sky-400/40 active:bg-sky-600'
            }`}
            aria-label="Crouch / Hide"
          >
            <EyeOff className={`w-4 h-4 ${isCrouching ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[9px] font-extrabold uppercase tracking-tight">Hide</span>
          </button>

          {/* Hold RUN Button */}
          <button
            onTouchStart={handleSprintStart}
            onTouchEnd={handleSprintEnd}
            onTouchCancel={handleSprintEnd}
            onMouseDown={handleSprintStart}
            onMouseUp={handleSprintEnd}
            onMouseLeave={handleSprintEnd}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center shadow-lg border active:scale-95 transition-all cursor-pointer ${
              isSprinting
                ? 'bg-amber-400 text-slate-950 border-white shadow-amber-500/40'
                : 'bg-slate-900/85 text-amber-300 border-amber-400/40 active:bg-amber-600'
            }`}
            aria-label="Run"
          >
            <Zap className={`w-4 h-4 ${isSprinting ? 'fill-slate-950' : ''}`} />
            <span className="text-[9px] font-extrabold uppercase tracking-tight">Run</span>
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
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 active:from-amber-400 active:to-amber-200 text-slate-950 shadow-xl border-2 border-white/50 flex flex-col items-center justify-center active:scale-95 transition-all cursor-pointer"
            aria-label="Jump"
          >
            <ArrowUp className="w-6 h-6 stroke-[3]" />
            <span className="text-[10px] font-black uppercase tracking-wider -mt-0.5">Jump</span>
          </button>
        </div>
      </div>
    </div>
  );
};
