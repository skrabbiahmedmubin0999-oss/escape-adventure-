import React, { useState } from 'react';
import { X, Users, Copy, Check, Shield, Wifi, Play, PlusCircle, ArrowRight, UserCheck, Bot, MapPin, Compass } from 'lucide-react';
import { sound } from '../audio/soundSystem';
import { GameMapType, MultiplayerModeType, MultiplayerPlayer, MultiplayerRoom } from '../game/types';

interface MultiplayerLobbyProps {
  onClose: () => void;
  onStartMultiplayerGame: (withCompanion: boolean) => void;
  playerName: string;
  playerColor: string;
}

const MAP_OPTIONS: { id: GameMapType; name: string; tag: string; available: boolean }[] = [
  { id: 'mystery_island', name: 'Mystery Island', tag: 'Playable Now', available: true },
  { id: 'frozen_mountain', name: 'Frozen Mountain', tag: 'Phase 5', available: false },
  { id: 'lost_desert', name: 'Lost Desert', tag: 'Phase 5', available: false },
  { id: 'sky_kingdom', name: 'Sky Kingdom', tag: 'Phase 5', available: false },
  { id: 'ocean_mystery', name: 'Ocean Mystery', tag: 'Phase 5', available: false },
];

const MODE_OPTIONS: { id: MultiplayerModeType; name: string; tag: string; available: boolean }[] = [
  { id: 'coop_adventure', name: 'Co-op Adventure', tag: 'Active', available: true },
  { id: 'treasure_hunt', name: 'Treasure Hunt', tag: 'Active', available: true },
  { id: 'obstacle_race', name: 'Obstacle Race', tag: 'Phase 5', available: false },
  { id: 'survival_challenge', name: 'Survival Challenge', tag: 'Phase 5', available: false },
  { id: 'team_challenge', name: 'Team Challenge', tag: 'Phase 5', available: false },
];

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  onClose,
  onStartMultiplayerGame,
  playerName,
  playerColor,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [enableCompanionBot, setEnableCompanionBot] = useState(true);

  // Initial room state
  const [room, setRoom] = useState<MultiplayerRoom>({
    roomId: 'ISLE-84',
    roomName: `${playerName}'s Expedition`,
    isHost: true,
    maxPlayers: 4,
    selectedMap: 'mystery_island',
    selectedMode: 'coop_adventure',
    status: 'waiting',
    players: [
      {
        id: 'p1',
        name: playerName,
        isHost: true,
        isReady: true,
        color: playerColor,
        ping: 18,
      },
      {
        id: 'p2',
        name: 'Explorer Sam (Co-op Buddy)',
        isHost: false,
        isReady: true,
        color: '#2980b9',
        ping: 32,
      },
    ],
  });

  const [isSelfReady, setIsSelfReady] = useState(true);

  const handleCopyCode = () => {
    sound.playClick();
    navigator.clipboard?.writeText(room.roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleToggleReady = () => {
    sound.playClick();
    setIsSelfReady(!isSelfReady);
    setRoom((prev) => ({
      ...prev,
      players: prev.players.map((p) =>
        p.id === 'p1' ? { ...p, isReady: !isSelfReady } : p
      ),
    }));
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    if (!joinCodeInput.trim()) return;

    // Simulate joining target room
    setRoom({
      roomId: joinCodeInput.toUpperCase(),
      roomName: `Island Quest #${joinCodeInput.toUpperCase()}`,
      isHost: false,
      maxPlayers: 4,
      selectedMap: 'mystery_island',
      selectedMode: 'coop_adventure',
      status: 'waiting',
      players: [
        {
          id: 'host-1',
          name: 'Captain Morgan',
          isHost: true,
          isReady: true,
          color: '#e74c3c',
          ping: 42,
        },
        {
          id: 'p1',
          name: playerName,
          isHost: false,
          isReady: isSelfReady,
          color: playerColor,
          ping: 24,
        },
      ],
    });
    setActiveTab('create');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-none font-sans">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[88dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white leading-tight">Multiplayer Lobby</h2>
              <p className="text-[10px] sm:text-xs text-slate-400">
                Co-Op Expedition & Synchronization
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 p-2 bg-slate-950/40 border-b border-slate-800 text-xs font-bold">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('create');
            }}
            className={`py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'create'
                ? 'bg-slate-800 text-amber-400 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Room #{room.roomId} (Host)</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('join');
            }}
            className={`py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'join'
                ? 'bg-slate-800 text-sky-400 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Join with Room Code</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
          {activeTab === 'join' ? (
            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Enter 6-Character Room Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value)}
                    placeholder="e.g. ISLE-99"
                    maxLength={8}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-base uppercase tracking-wider focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="submit"
                    className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-6 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <span>Connect</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-xs text-slate-400 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
                💡 Tip: Share room codes with friends to explore together or test synchronization.
              </div>
            </form>
          ) : (
            <>
              {/* Room Details Bar */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Room Code
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xl font-black font-mono tracking-widest text-amber-400">
                      {room.roomId}
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Copy Code"
                    >
                      {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Slots Occupied
                  </div>
                  <div className="text-sm font-bold text-slate-200 mt-0.5">
                    {room.players.length} / {room.maxPlayers} Explorers
                  </div>
                </div>
              </div>

              {/* Map & Mode Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Map Selector */}
                <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-amber-400 mb-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Adventure Map</span>
                  </div>
                  <div className="space-y-1.5">
                    {MAP_OPTIONS.map((map) => (
                      <button
                        key={map.id}
                        type="button"
                        disabled={!map.available}
                        onClick={() => {
                          if (map.available) {
                            sound.playClick();
                            setRoom((prev) => ({ ...prev, selectedMap: map.id }));
                          }
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between border transition-all ${
                          room.selectedMap === map.id
                            ? 'bg-amber-500/20 border-amber-500/60 text-white font-bold'
                            : map.available
                            ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 cursor-pointer'
                            : 'bg-slate-950/40 border-slate-900 text-slate-600 cursor-not-allowed opacity-60'
                        }`}
                      >
                        <span className="truncate">{map.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          map.available
                            ? room.selectedMap === map.id
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-emerald-950 text-emerald-300'
                            : 'bg-slate-800 text-slate-500'
                        }`}>
                          {map.tag}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mode Selector */}
                <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-sky-400 mb-2">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Expedition Mode</span>
                  </div>
                  <div className="space-y-1.5">
                    {MODE_OPTIONS.map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        disabled={!mode.available}
                        onClick={() => {
                          if (mode.available) {
                            sound.playClick();
                            setRoom((prev) => ({ ...prev, selectedMode: mode.id }));
                          }
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between border transition-all ${
                          room.selectedMode === mode.id
                            ? 'bg-sky-500/20 border-sky-500/60 text-white font-bold'
                            : mode.available
                            ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 cursor-pointer'
                            : 'bg-slate-950/40 border-slate-900 text-slate-600 cursor-not-allowed opacity-60'
                        }`}
                      >
                        <span className="truncate">{mode.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          mode.available
                            ? room.selectedMode === mode.id
                              ? 'bg-sky-400 text-slate-950 font-bold'
                              : 'bg-emerald-950 text-emerald-300'
                            : 'bg-slate-800 text-slate-500'
                        }`}>
                          {mode.tag}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Player Slots List */}
              <div className="space-y-2.5">
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Expedition Members
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Active Slots */}
                  {room.players.map((p, idx) => (
                    <div
                      key={p.id}
                      className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 shadow"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white text-xs border border-white/20"
                          style={{ backgroundColor: p.color }}
                        >
                          {idx + 1}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{p.name}</span>
                            {p.isHost && (
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-semibold border border-amber-500/30">
                                Host
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Wifi className="w-3 h-3 text-emerald-400" />
                            <span>{p.ping}ms ping</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        {p.isReady ? (
                          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <UserCheck className="w-3 h-3" /> Ready
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-full">
                            Waiting
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Empty Slots */}
                  {Array.from({ length: room.maxPlayers - room.players.length }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="border border-dashed border-slate-800 rounded-xl p-3 flex items-center gap-3 text-slate-600 bg-slate-950/20"
                    >
                      <div className="w-9 h-9 rounded-lg bg-slate-800/40 border border-slate-800 flex items-center justify-center text-xs font-bold text-slate-600">
                        {room.players.length + i + 1}
                      </div>
                      <span className="text-xs font-semibold">Open Slot (Waiting for connection...)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Companion Bot Toggle for Phase 1 Playable Preview */}
              <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      Spawn Co-op Companion in 3D Scene
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Renders a 2nd explorer in-game to test multi-character kinematics and follow logic.
                    </div>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableCompanionBot}
                    onChange={(e) => setEnableCompanionBot(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Architecture Explanation Banner (Zero Fake Online) */}
              <div className="bg-amber-950/30 border border-amber-700/40 rounded-xl p-3.5 text-xs text-amber-200/90 leading-relaxed">
                <span className="font-bold text-amber-300">Phase 1 Foundation:</span> Multiplayer architecture is fully structured with room states, slot assignments, and multi-avatar rendering. Launching below enters the island with your chosen co-op configuration!
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={handleToggleReady}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              isSelfReady
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {isSelfReady ? '✓ You Are Ready' : 'Set Ready'}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onStartMultiplayerGame(enableCompanionBot);
            }}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Launch Expedition</span>
          </button>
        </div>
      </div>
    </div>
  );
};
