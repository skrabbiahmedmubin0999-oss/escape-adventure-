import React, { useEffect, useRef, useState, useCallback } from 'react';
import { IslandWorld } from './game/IslandWorld';
import { GameMode, GameSettings, PlayerCustomization, PlayerStats, QuestProgress, EnvironmentState, TimeOfDay, WeatherType, NotificationToast } from './game/types';
import { sound } from './audio/soundSystem';
import { MainMenu } from './components/MainMenu';
import { GameHUD } from './components/GameHUD';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { SettingsModal } from './components/SettingsModal';
import { ProfileModal } from './components/ProfileModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { VictoryModal } from './components/VictoryModal';
import { MobileControls } from './components/MobileControls';
import { NotificationToastContainer } from './components/NotificationToast';
import { PuzzleModal } from './components/PuzzleModal';
import { InventoryModal } from './components/InventoryModal';
import { AchievementsModal } from './components/AchievementsModal';
import { FailureModal } from './components/FailureModal';
import { runCollisionTestSuite } from './game/collisionTests';


const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  sfxVolume: 0.8,
  musicVolume: 0.5,
  graphicsQuality: 'high',
  mouseSensitivity: 1.0,
  invertY: false,
  showFps: false,
};

const DEFAULT_CUSTOMIZATION: PlayerCustomization = {
  name: 'Alex The Explorer',
  tunicColor: '#e67e22',
  hatColor: '#8e44ad',
  title: 'Island Quest Pioneer',
};

const DEFAULT_STATS: PlayerStats = {
  bestTime: null,
  totalKeysCollected: 0,
  gamesCompleted: 0,
  puzzlesSolved: 0,
  totalCoins: 0,
  totalChests: 0,
  xp: 0,
  level: 1,
};

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<IslandWorld | null>(null);

  // Game UI States
  const [mode, setMode] = useState<GameMode>('menu');
  const [prompt, setPrompt] = useState<string | null>(null);
  const [tutorialNotice, setTutorialNotice] = useState<{ title: string; text: string } | null>(null);
  const isTutorialDismissedRef = useRef<boolean>(false);
  const [quest, setQuest] = useState<QuestProgress>({
    keysCollected: { sun: false, ocean: false, forest: false },
    keysCount: 0,
    altarActivated: false,
    gateUnlocked: false,
    gateOpening: false,
    gateOpenProgress: 0,
    timeElapsed: 0,
    coinsCollected: 0,
    chestsOpened: 0,
    totalChests: 6,
    xpEarned: 0,
    puzzlesSolvedCount: 0,
    totalPuzzles: 3,
    crystalsCollected: 0,
    totalCrystals: 5,
    checkpointsReached: 0,
    totalCheckpoints: 5,
    survivalTimeRemaining: 240,
    survivalActive: true,
  });

  const [environmentState, setEnvironmentState] = useState<EnvironmentState>({
    timeOfDay: 'day',
    weather: 'clear',
    autoCycle: false,
    cycleProgress: 0.3,
  });

  const [playerPos, setPlayerPos] = useState({ x: -22, z: 24, rotation: 0 });

  useEffect(() => {
    let animId: number;
    const updatePlayerPos = () => {
      if (worldRef.current && mode === 'playing') {
        const p = worldRef.current.playerPos;
        const rot = worldRef.current.playerRotation;
        setPlayerPos((prev) => {
          if (
            Math.abs(prev.x - p.x) > 0.1 ||
            Math.abs(prev.z - p.z) > 0.1 ||
            Math.abs(prev.rotation - rot) > 0.05
          ) {
            return { x: p.x, z: p.z, rotation: rot };
          }
          return prev;
        });
      }
      animId = requestAnimationFrame(updatePlayerPos);
    };
    animId = requestAnimationFrame(updatePlayerPos);
    return () => cancelAnimationFrame(animId);
  }, [mode]);

  // Modals & Expansion UI
  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [activePuzzleId, setActivePuzzleId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<NotificationToast[]>([]);
  const [finalTime, setFinalTime] = useState<number>(0);
  const [failureReason, setFailureReason] = useState<string>('Mission Failed!');

  const addToast = useCallback((toast: Omit<NotificationToast, 'id' | 'timestamp'>) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    const newToast: NotificationToast = { ...toast, id, timestamp: Date.now() };
    setToasts((prev) => [newToast, ...prev].slice(0, 4));

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const saveGameProgress = useCallback(() => {
    const currentPos = worldRef.current
      ? {
          x: parseFloat(worldRef.current.playerPos.x.toFixed(2)),
          y: parseFloat(worldRef.current.playerPos.y.toFixed(2)),
          z: parseFloat(worldRef.current.playerPos.z.toFixed(2)),
        }
      : { x: -22, y: 1.0, z: 24 };

    const currentQuest = worldRef.current ? worldRef.current.questProgress : quest;

    const saveData = {
      quest: currentQuest,
      playerPos: currentPos,
      savedAt: Date.now(),
    };

    try {
      localStorage.setItem('escape_adventure_saved_game', JSON.stringify(saveData));
      addToast({
        type: 'checkpoint',
        title: 'Progress Saved',
        message: `Saved at (${currentPos.x}, ${currentPos.z}) with ${currentQuest.keysCount}/3 keys!`,
      });
      sound.playLand();
    } catch (err) {
      console.error('Failed to save progress to localStorage', err);
    }
  }, [quest, addToast]);


  // Settings & Profile (Stored in localStorage)
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem('escape_adventure_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [customization, setCustomization] = useState<PlayerCustomization>(() => {
    try {
      const saved = localStorage.getItem('escape_adventure_profile');
      return saved ? { ...DEFAULT_CUSTOMIZATION, ...JSON.parse(saved) } : DEFAULT_CUSTOMIZATION;
    } catch {
      return DEFAULT_CUSTOMIZATION;
    }
  });

  const [stats, setStats] = useState<PlayerStats>(() => {
    try {
      const saved = localStorage.getItem('escape_adventure_stats');
      return saved ? { ...DEFAULT_STATS, ...JSON.parse(saved) } : DEFAULT_STATS;
    } catch {
      return DEFAULT_STATS;
    }
  });

  // Pointer dragging state for camera orbit
  const isPointerDownRef = useRef(false);
  const lastPointerPosRef = useRef({ x: 0, y: 0 });

  // 1. Initialize IslandWorld Three.js Scene
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const world = new IslandWorld(canvasMountRef.current);
    worldRef.current = world;

    // Apply saved settings and customization
    world.setGraphicsQuality(settings.graphicsQuality);
    world.mouseSensitivity = settings.mouseSensitivity;
    world.invertY = settings.invertY;
    if (settings.timeOfDay) world.setTimeOfDay(settings.timeOfDay);
    if (settings.weather) world.setWeather(settings.weather);
    if (settings.autoDayNight !== undefined && settings.autoDayNight !== world.environmentState.autoCycle) {
      world.toggleAutoCycle();
    }
    world.setPlayerCustomization(customization.tunicColor, customization.hatColor);
    sound.setVolumes(settings.sfxVolume, settings.musicVolume, !settings.soundEnabled);
    sound.startAmbient();

    // Run automated physics & collision test suite
    const physicsTestResults = runCollisionTestSuite();
    console.log('[Physics Collision Test Suite Results]', physicsTestResults);
    (window as any).__runPhysicsTests = runCollisionTestSuite;
    (window as any).__togglePhysicsWireframes = () => worldRef.current?.togglePhysicsWireframes();

    const unlockUserAudio = () => {
      sound.unlockAudio();
    };
    window.addEventListener('pointerdown', unlockUserAudio, { once: true });
    window.addEventListener('keydown', unlockUserAudio, { once: true });

    // Callbacks
    world.onEnvironmentChange = (newEnv) => {
      setEnvironmentState(newEnv);
    };

    world.onPromptChange = (newPrompt) => {
      setPrompt(newPrompt);
    };

    world.onTutorialNotice = (notice) => {
      if (!isTutorialDismissedRef.current) {
        setTutorialNotice(notice);
      }
    };

    world.onToastNotification = (t) => {
      addToast(t);
    };

    world.onOpenPuzzleModal = (pId) => {
      setActivePuzzleId(pId);
    };

    world.onQuestUpdate = (newQuest) => {
      setQuest(newQuest);

      // Update stats for keys collected
      setStats((prev) => {
        const nextStats = {
          ...prev,
          totalKeysCollected: prev.totalKeysCollected + 1,
        };
        try {
          localStorage.setItem('escape_adventure_stats', JSON.stringify(nextStats));
        } catch {}
        return nextStats;
      });
    };

    world.onVictory = (time) => {
      setFinalTime(time);
      setMode('victory');

      setStats((prev) => {
        const best = prev.bestTime === null ? time : Math.min(prev.bestTime, time);
        const currentQuest = worldRef.current ? worldRef.current.questProgress : quest;
        const newTotalCoins = (prev.totalCoins || 0) + (currentQuest?.coinsCollected || 0);
        const newTotalChests = (prev.totalChests || 0) + (currentQuest?.chestsOpened || 0);
        const newXp = (prev.xp || 0) + (currentQuest?.xpEarned || 0);
        const newLevel = Math.max(1, Math.floor(newXp / 250) + 1);

        const nextStats: PlayerStats = {
          ...prev,
          bestTime: best,
          gamesCompleted: prev.gamesCompleted + 1,
          puzzlesSolved: prev.puzzlesSolved + 1,
          totalCoins: newTotalCoins,
          totalChests: newTotalChests,
          xp: newXp,
          level: newLevel,
        };
        try {
          localStorage.setItem('escape_adventure_stats', JSON.stringify(nextStats));
        } catch {}
        return nextStats;
      });
    };

    world.onFailure = (reason) => {
      setFailureReason(reason);
      setMode('failure');
    };

    return () => {
      window.removeEventListener('pointerdown', unlockUserAudio);
      window.removeEventListener('keydown', unlockUserAudio);
      sound.stopAmbient();
      world.dispose();
      worldRef.current = null;
    };
  }, []);

  // Sync settings changes to world and audio
  useEffect(() => {
    if (worldRef.current) {
      worldRef.current.mouseSensitivity = settings.mouseSensitivity;
      worldRef.current.invertY = settings.invertY;
      worldRef.current.setGraphicsQuality(settings.graphicsQuality);
      if (settings.timeOfDay) worldRef.current.setTimeOfDay(settings.timeOfDay);
      if (settings.weather) worldRef.current.setWeather(settings.weather);
      if (settings.autoDayNight !== undefined && settings.autoDayNight !== worldRef.current.environmentState.autoCycle) {
        worldRef.current.toggleAutoCycle();
      }
    }
    sound.setVolumes(settings.sfxVolume, settings.musicVolume, !settings.soundEnabled);
    try {
      localStorage.setItem('escape_adventure_settings', JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // Sync customization changes to 3D player
  useEffect(() => {
    if (worldRef.current) {
      worldRef.current.setPlayerCustomization(customization.tunicColor, customization.hatColor);
    }
    try {
      localStorage.setItem('escape_adventure_profile', JSON.stringify(customization));
    } catch {}
  }, [customization]);

  // 2. Keyboard Input Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (!worldRef.current) return;

      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') worldRef.current.inputs.forward = true;
      if (code === 'KeyS' || code === 'ArrowDown') worldRef.current.inputs.backward = true;
      if (code === 'KeyA' || code === 'ArrowLeft') worldRef.current.inputs.left = true;
      if (code === 'KeyD' || code === 'ArrowRight') worldRef.current.inputs.right = true;
      if (code === 'ShiftLeft' || code === 'ShiftRight') worldRef.current.inputs.sprint = true;
      if (code === 'KeyC' || code === 'ControlLeft' || code === 'ControlRight') worldRef.current.inputs.crouch = true;
      if (code === 'Space') {
        e.preventDefault();
        worldRef.current.inputs.jump = true;
      }
      if (code === 'KeyE') {
        worldRef.current.inputs.interact = true;
      }
      if (code === 'KeyI') {
        setShowInventory((prev) => !prev);
      }
      if (code === 'KeyT') {
        setShowAchievements((prev) => !prev);
      }
      if (code === 'KeyM') {
        toggleMute();
      }
      if (code === 'KeyP') {
        worldRef.current.togglePhysicsWireframes();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!worldRef.current) return;
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') worldRef.current.inputs.forward = false;
      if (code === 'KeyS' || code === 'ArrowDown') worldRef.current.inputs.backward = false;
      if (code === 'KeyA' || code === 'ArrowLeft') worldRef.current.inputs.left = false;
      if (code === 'KeyD' || code === 'ArrowRight') worldRef.current.inputs.right = false;
      if (code === 'ShiftLeft' || code === 'ShiftRight') worldRef.current.inputs.sprint = false;
      if (code === 'KeyC' || code === 'ControlLeft' || code === 'ControlRight') worldRef.current.inputs.crouch = false;
      if (code === 'Space') worldRef.current.inputs.jump = false;
    };

    const handleBlur = () => {
      // Clear held keys on window blur to prevent sticky inputs
      if (worldRef.current) {
        worldRef.current.inputs.forward = false;
        worldRef.current.inputs.backward = false;
        worldRef.current.inputs.left = false;
        worldRef.current.inputs.right = false;
        worldRef.current.inputs.sprint = false;
        worldRef.current.inputs.crouch = false;
        worldRef.current.inputs.jump = false;
        worldRef.current.inputs.joystickX = 0;
        worldRef.current.inputs.joystickY = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // 3. Pointer Drag for Camera Orbiting
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag on canvas background (not inside interactive buttons/modals)
    if ((e.target as HTMLElement).closest('button, input, select, .pointer-events-auto')) return;
    isPointerDownRef.current = true;
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current || !worldRef.current) return;
    const deltaX = e.clientX - lastPointerPosRef.current.x;
    const deltaY = e.clientY - lastPointerPosRef.current.y;
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };

    worldRef.current.onPointerDrag(deltaX, deltaY);
  };

  const handlePointerUp = () => {
    isPointerDownRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (worldRef.current && mode === 'playing') {
      worldRef.current.onZoom(e.deltaY);
    }
  };

  // Actions
  const handleStartGame = (withCompanion = false, loadSave = true) => {
    isTutorialDismissedRef.current = false;
    setTutorialNotice(null);
    if (worldRef.current) {
      worldRef.current.resetGame();
      worldRef.current.mode = 'playing';
      worldRef.current.setCompanionVisible(withCompanion);

      if (loadSave) {
        try {
          const savedStr = localStorage.getItem('escape_adventure_saved_game');
          if (savedStr) {
            const savedData = JSON.parse(savedStr);
            if (savedData.quest && savedData.playerPos) {
              worldRef.current.restoreSavedProgress(savedData.quest, savedData.playerPos);
              setQuest(savedData.quest);
              addToast({
                type: 'checkpoint',
                title: 'Checkpoint Loaded',
                message: `Loaded saved progress at (${savedData.playerPos.x}, ${savedData.playerPos.z})!`,
              });
            }
          }
        } catch (err) {
          console.error('Failed to load saved progress', err);
        }
      }
    }
    setMode('playing');
    setShowMultiplayer(false);
  };

  const handleReturnToMenu = () => {
    if (worldRef.current) {
      worldRef.current.mode = 'menu';
      worldRef.current.setCompanionVisible(false);
    }
    setMode('menu');
  };

  const toggleMute = () => {
    setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  };

  return (
    <div
      className="relative w-full h-[100dvh] overflow-hidden bg-slate-950 select-none touch-none overscroll-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
    >
      {/* 3D WebGL Canvas Mount Container */}
      <div ref={canvasMountRef} className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing" />

      {/* Main Menu State */}
      {mode === 'menu' && (
        <MainMenu
          onStartGame={() => handleStartGame(false)}
          onOpenMultiplayer={() => setShowMultiplayer(true)}
          onOpenHowToPlay={() => setShowHowToPlay(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenProfile={() => setShowProfile(true)}
          playerName={customization.name}
          playerTitle={customization.title}
          isMuted={!settings.soundEnabled}
          onToggleMute={toggleMute}
        />
      )}

      {/* In-Game Playing HUD */}
      {mode === 'playing' && (
        <>
          <GameHUD
            quest={quest}
            prompt={prompt}
            tutorialNotice={tutorialNotice}
            onDismissTutorial={() => {
              isTutorialDismissedRef.current = true;
              setTutorialNotice(null);
              sound.playClick();
            }}
            onOpenSettings={() => setShowSettings(true)}
            onReturnToMenu={handleReturnToMenu}
            isMuted={!settings.soundEnabled}
            onToggleMute={toggleMute}
            onTriggerInteract={() => {
              if (worldRef.current) worldRef.current.handleInteract();
            }}
            environmentState={environmentState}
            onChangeTimeOfDay={(t) => {
              if (worldRef.current) worldRef.current.setTimeOfDay(t);
              setSettings((prev) => ({ ...prev, timeOfDay: t, autoDayNight: false }));
            }}
            onChangeWeather={(w) => {
              if (worldRef.current) worldRef.current.setWeather(w);
              setSettings((prev) => ({ ...prev, weather: w }));
            }}
            onToggleAutoCycle={() => {
              if (worldRef.current) worldRef.current.toggleAutoCycle();
              setSettings((prev) => ({ ...prev, autoDayNight: !prev.autoDayNight }));
            }}
            onOpenInventory={() => setShowInventory(true)}
            onOpenAchievements={() => setShowAchievements(true)}
            showFps={settings.showFps}
            playerPos={playerPos}
          />

          {/* Toast Notification Popups */}
          <NotificationToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

          {/* Mobile Virtual Joystick & Touch Controls */}
          <MobileControls
            onJoystickMove={(jx, jy) => {
              if (worldRef.current) {
                worldRef.current.inputs.joystickX = jx;
                worldRef.current.inputs.joystickY = jy;
              }
            }}
            onJump={(active) => {
              if (worldRef.current) worldRef.current.inputs.jump = active;
            }}
            onSprint={(active) => {
              if (worldRef.current) worldRef.current.inputs.sprint = active;
            }}
            onCrouch={(active) => {
              if (worldRef.current) worldRef.current.inputs.crouch = active;
            }}
            onInteract={() => {
              if (worldRef.current) worldRef.current.handleInteract();
            }}
            isInteractAvailable={Boolean(
              prompt &&
                (prompt.includes('Press [E]') ||
                  prompt.includes('Collect') ||
                  prompt.includes('Activate') ||
                  prompt.includes('Place') ||
                  prompt.includes('Solve') ||
                  prompt.includes('Inspect') ||
                  prompt.includes('Toggle'))
            )}
            interactLabel={
              prompt?.includes('Collect')
                ? 'Collect'
                : prompt?.includes('Activate') || prompt?.includes('Place')
                ? 'Activate'
                : prompt?.includes('Solve') || prompt?.includes('Inspect') || prompt?.includes('Toggle')
                ? 'Puzzle'
                : 'Interact'
            }
          />
        </>
      )}

      {/* Interactive Puzzle Modal */}
      {activePuzzleId && (
        <PuzzleModal
          activePuzzleId={activePuzzleId}
          onClose={() => setActivePuzzleId(null)}
          onPuzzleSolved={(pId) => {
            console.log(`[Puzzle] Solved ${pId}`);
          }}
        />
      )}

      {/* Inventory Modal */}
      {showInventory && (
        <InventoryModal
          onClose={() => setShowInventory(false)}
          quest={quest}
          stats={stats}
        />
      )}

      {/* Achievements Modal */}
      {showAchievements && (
        <AchievementsModal
          onClose={() => setShowAchievements(false)}
          stats={stats}
          quest={quest}
        />
      )}

      {/* Victory Celebration Modal */}
      {mode === 'victory' && (
        <VictoryModal
          timeElapsed={finalTime}
          bestTime={stats.bestTime}
          coinsCollected={quest.coinsCollected ?? 0}
          chestsOpened={quest.chestsOpened ?? 0}
          totalChests={quest.totalChests ?? 6}
          xpEarned={quest.xpEarned ?? 0}
          onPlayAgain={() => handleStartGame(worldRef.current?.companionActive ?? false)}
          onReturnToMenu={handleReturnToMenu}
        />
      )}

      {/* Mission Failure Modal */}
      {mode === 'failure' && (
        <FailureModal
          reason={failureReason}
          crystalsCollected={quest.crystalsCollected ?? 0}
          totalCrystals={quest.totalCrystals ?? 5}
          coinsCollected={quest.coinsCollected ?? 0}
          timeElapsed={quest.timeElapsed ?? 0}
          onRetry={() => handleStartGame(worldRef.current?.companionActive ?? false)}
          onReturnToMenu={handleReturnToMenu}
        />
      )}

      {/* Multiplayer Lobby Modal */}
      {showMultiplayer && (
        <MultiplayerLobby
          onClose={() => setShowMultiplayer(false)}
          onStartMultiplayerGame={(withCompanion) => handleStartGame(withCompanion)}
          playerName={customization.name}
          playerColor={customization.tunicColor}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          settings={settings}
          onUpdateSettings={(newVals) => setSettings((prev) => ({ ...prev, ...newVals }))}
          onSaveProgress={mode === 'playing' ? saveGameProgress : undefined}
        />
      )}

      {/* Profile Modal */}
      {showProfile && (
        <ProfileModal
          onClose={() => setShowProfile(false)}
          customization={customization}
          onUpdateCustomization={(newVals) => setCustomization((prev) => ({ ...prev, ...newVals }))}
          stats={stats}
        />
      )}

      {/* How to Play Modal */}
      {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}
    </div>
  );
}

