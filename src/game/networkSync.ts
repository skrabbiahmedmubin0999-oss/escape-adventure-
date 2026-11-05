import { NetworkSyncPayload, QuestProgress } from './types';

export type NetworkEventHandler = (payload: NetworkSyncPayload) => void;

/**
 * Authoritative Multiplayer Synchronization Manager Interface
 * Handles local event emissions and remote sync payloads for co-op missions.
 */
export class NetworkSyncManager {
  private localPlayerId: string;
  private listeners: Set<NetworkEventHandler> = new Set();
  private isConnected: boolean = false;

  constructor(localPlayerId: string = 'player_local') {
    this.localPlayerId = localPlayerId;
  }

  public connect(roomId: string) {
    this.isConnected = true;
    console.log(`[NetworkSync] Connected to co-op session room: ${roomId}`);
  }

  public disconnect() {
    this.isConnected = false;
    console.log(`[NetworkSync] Disconnected from co-op session`);
  }

  public subscribe(handler: NetworkEventHandler) {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  public broadcastState(
    position: [number, number, number],
    rotation: number,
    anim: string,
    quest: Partial<QuestProgress>,
    puzzleUpdate?: NetworkSyncPayload['puzzleUpdate'],
    chestUpdate?: NetworkSyncPayload['chestUpdate'],
    checkpointUpdate?: NetworkSyncPayload['checkpointUpdate']
  ) {
    const payload: NetworkSyncPayload = {
      playerId: this.localPlayerId,
      position,
      rotation,
      animationState: anim,
      questProgress: quest,
      puzzleUpdate,
      chestUpdate,
      checkpointUpdate,
      timestamp: Date.now(),
    };

    // Dispatch to registered listeners
    this.listeners.forEach((fn) => fn(payload));
  }
}

export const networkSync = new NetworkSyncManager();
