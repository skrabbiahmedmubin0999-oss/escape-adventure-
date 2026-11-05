import * as THREE from 'three';
import { AdventurerCharacter, createAdventurerModel, getIslandHeight } from './proceduralAssets';
import { collisionSystem, CollisionLayer } from './collisionSystem';
import { sound } from '../audio/soundSystem';

export type GuardAIState =
  | 'patrol'           // Following patrol waypoints
  | 'suspicious'       // Player spotted, detection meter rising
  | 'investigate'      // Moving to investigate last known noise/spotting
  | 'chase'            // Full alert chase!
  | 'search'           // Searching area after losing line-of-sight
  | 'return-to-patrol' // Returning to nearest waypoint
  | 'disabled';        // Stunned / takedown

export interface PatrolGuard {
  id: string;
  name: string;
  character: AdventurerCharacter;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: number;
  waypoints: THREE.Vector3[];
  currentWaypointIdx: number;
  state: GuardAIState;
  detectionLevel: number; // 0 to 100
  lastKnownPlayerPos: THREE.Vector3;
  searchTimer: number;
  disabledTimer: number;
  statusCanvasMesh?: THREE.Mesh;
  canvasTexture?: THREE.CanvasTexture;
}

const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _guardVel = new THREE.Vector3();
const _companionVel = new THREE.Vector3();

export class GuardAIController {
  private guards: PatrolGuard[] = [];
  public onPlayerCaught?: (guardName: string) => void;

  /**
   * Initializes 3 Patrol Guards stationed at key tactical island zones
   */
  public initGuards(scene: THREE.Scene) {
    this.clearGuards(scene);

    const guardConfigs = [
      {
        id: 'guard_outpost',
        name: 'Coastal Outpost Guard',
        tunic: '#991b1b', // Dark red
        hat: '#1e293b',
        waypoints: [
          new THREE.Vector3(-28, 0, 8),
          new THREE.Vector3(-22, 0, 14),
          new THREE.Vector3(-18, 0, 8),
          new THREE.Vector3(-24, 0, 2),
        ],
      },
      {
        id: 'guard_village',
        name: 'Valley Village Sentry',
        tunic: '#854d0e', // Bronze guard
        hat: '#0f172a',
        waypoints: [
          new THREE.Vector3(-8, 0, 8),
          new THREE.Vector3(-3, 0, 14),
          new THREE.Vector3(-10, 0, 18),
          new THREE.Vector3(-14, 0, 10),
        ],
      },
      {
        id: 'guard_temple',
        name: 'Sun Temple Sentinel',
        tunic: '#1e3a8a', // Royal guard blue
        hat: '#475569',
        waypoints: [
          new THREE.Vector3(18, 0, -18),
          new THREE.Vector3(24, 0, -14),
          new THREE.Vector3(14, 0, -22),
          new THREE.Vector3(20, 0, -24),
        ],
      },
    ];

    guardConfigs.forEach((cfg) => {
      const char = createAdventurerModel(cfg.tunic, cfg.hat);
      const startPos = cfg.waypoints[0].clone();
      startPos.y = getIslandHeight(startPos.x, startPos.z);
      char.group.position.copy(startPos);

      // Status indicator sprite overhead (? or !)
      const statusMesh = this.createStatusIndicatorMesh();
      statusMesh.position.set(0, 2.4, 0);
      char.group.add(statusMesh);

      scene.add(char.group);

      this.guards.push({
        id: cfg.id,
        name: cfg.name,
        character: char,
        position: startPos,
        velocity: new THREE.Vector3(),
        rotation: 0,
        waypoints: cfg.waypoints,
        currentWaypointIdx: 0,
        state: 'patrol',
        detectionLevel: 0,
        lastKnownPlayerPos: startPos.clone(),
        searchTimer: 0,
        disabledTimer: 0,
        statusCanvasMesh: statusMesh,
      });
    });
  }

  private createStatusIndicatorMesh(): THREE.Mesh {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      side: THREE.DoubleSide,
    });
    const geo = new THREE.PlaneGeometry(0.8, 0.8);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.visible = false;
    return mesh;
  }

  private updateStatusIndicator(guard: PatrolGuard) {
    if (!guard.statusCanvasMesh) return;

    if (guard.state === 'patrol' || guard.state === 'disabled') {
      guard.statusCanvasMesh.visible = false;
      return;
    }

    guard.statusCanvasMesh.visible = true;
    const canvas = (guard.statusCanvasMesh.material as THREE.MeshBasicMaterial).map?.image as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 128, 128);

    if (guard.state === 'suspicious' || guard.state === 'investigate' || guard.state === 'search') {
      ctx.fillStyle = '#f59e0b'; // Amber ?
      ctx.beginPath();
      ctx.arc(64, 64, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 72px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', 64, 68);
    } else if (guard.state === 'chase') {
      ctx.fillStyle = '#ef4444'; // Red !
      ctx.beginPath();
      ctx.arc(64, 64, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 72px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', 64, 68);
    }

    ((guard.statusCanvasMesh.material as THREE.MeshBasicMaterial).map as THREE.CanvasTexture).needsUpdate = true;
  }

  /**
   * Main Guard AI Update Loop
   * Handles state machine, vision FOV, obstacle raycast line-of-sight, detection levels, and chase/caught triggers.
   */
  public updateGuards(
    playerPos: THREE.Vector3,
    isCrouching: boolean,
    isRunning: boolean,
    dt: number,
    time: number
  ) {
    this.guards.forEach((guard) => {
      // 1. Handle Disabled / Stunned State
      if (guard.state === 'disabled') {
        guard.disabledTimer -= dt;
        guard.character.updateAnimation(time, 0, false, false);
        guard.character.group.rotation.x = -Math.PI * 0.45; // Knocked down posture
        guard.character.group.position.y = getIslandHeight(guard.position.x, guard.position.z);
        if (guard.disabledTimer <= 0) {
          guard.state = 'return-to-patrol';
          guard.character.group.rotation.x = 0;
          guard.detectionLevel = 0;
        }
        this.updateStatusIndicator(guard);
        return;
      }

      // Reset pitch orientation
      guard.character.group.rotation.x = 0;

      // 2. Line of Sight (LOS) & Vision Cone Check
      const distToPlayer = guard.position.distanceTo(playerPos);
      const maxVisionDist = 18.0; // 18 meters
      let hasLineOfSight = false;

      if (distToPlayer < maxVisionDist) {
        // Forward facing direction vector
        const facingAngle = guard.rotation;
        _vec3A.set(Math.sin(facingAngle), 0, Math.cos(facingAngle)).normalize();

        // Vector from guard to player
        _vec3B.subVectors(playerPos, guard.position).normalize();

        const dot = _vec3A.dot(_vec3B);
        const fovCos = Math.cos((Math.PI * 0.5) * 0.5); // 90 degree FOV cone

        if (dot >= fovCos || distToPlayer < 3.0) { // Always notice player if extremely close (< 3m)
          // Solid obstacle raycast check (walls/cottages/trees block vision)
          hasLineOfSight = this.checkLineOfSightClear(guard.position, playerPos);
        }
      }

      // 3. Detection Accumulation / Decay
      if (hasLineOfSight) {
        const distFactor = 1.0 - distToPlayer / maxVisionDist;
        const stealthFactor = isCrouching ? 0.35 : isRunning ? 1.5 : 1.0;
        const rate = 45.0 * distFactor * stealthFactor;

        guard.detectionLevel = Math.min(100, guard.detectionLevel + rate * dt);
        guard.lastKnownPlayerPos.copy(playerPos);

        if (guard.detectionLevel > 15 && guard.state === 'patrol') {
          guard.state = 'suspicious';
        }

        if (guard.detectionLevel >= 100 && guard.state !== 'chase') {
          guard.state = 'chase';
          sound.playAltarActivate(); // Alert sound cue
        }
      } else {
        // Decay detection when out of vision
        guard.detectionLevel = Math.max(0, guard.detectionLevel - 20.0 * dt);

        if (guard.state === 'chase') {
          guard.state = 'search';
          guard.searchTimer = 5.0; // Search area for 5s
        }
      }

      // 4. State Machine Execution
      let targetPos: THREE.Vector3 | null = null;
      let moveSpeed = 3.2; // Normal patrol speed

      if (guard.state === 'patrol' || guard.state === 'return-to-patrol') {
        const wp = guard.waypoints[guard.currentWaypointIdx];
        targetPos = wp;
        moveSpeed = 2.8;

        if (guard.position.distanceTo(wp) < 1.5) {
          guard.currentWaypointIdx = (guard.currentWaypointIdx + 1) % guard.waypoints.length;
          guard.state = 'patrol';
        }
      } else if (guard.state === 'suspicious' || guard.state === 'investigate') {
        targetPos = guard.lastKnownPlayerPos;
        moveSpeed = 3.5;
        if (guard.position.distanceTo(targetPos) < 1.5 && !hasLineOfSight) {
          guard.state = 'search';
          guard.searchTimer = 4.0;
        }
      } else if (guard.state === 'chase') {
        targetPos = playerPos;
        moveSpeed = 6.2; // Sprint chase speed!

        // Caught trigger check
        if (distToPlayer < 1.35) {
          if (this.onPlayerCaught) {
            this.onPlayerCaught(guard.name);
          }
        }
      } else if (guard.state === 'search') {
        guard.searchTimer -= dt;
        moveSpeed = 0; // Look around
        guard.rotation += dt * 1.5; // Turn around scanning
        if (guard.searchTimer <= 0) {
          guard.state = 'return-to-patrol';
          guard.detectionLevel = 0;
        }
      }

      // 5. Apply Movement Kinematics
      if (targetPos && moveSpeed > 0) {
        _vec3A.subVectors(targetPos, guard.position);
        _vec3A.y = 0;
        const distToTarget = _vec3A.length();

        if (distToTarget > 0.1) {
          _vec3A.normalize().multiplyScalar(moveSpeed);
          _guardVel.set(_vec3A.x, 0, _vec3A.z);

          // Apply substepping collision resolution to guard position
          collisionSystem.resolveMovementWithSubstepping(guard.position, _guardVel, dt, 0.55);

          guard.rotation = Math.atan2(_vec3A.x, _vec3A.z);
          guard.character.updateAnimation(time, moveSpeed / 4.5, false, moveSpeed > 4.5);
        } else {
          guard.character.updateAnimation(time, 0, false, false);
        }
      } else {
        guard.character.updateAnimation(time, 0, false, false);
      }

      const groundY = getIslandHeight(guard.position.x, guard.position.z);
      guard.position.y = groundY;
      guard.character.group.position.copy(guard.position);
      guard.character.group.rotation.y = guard.rotation;

      this.updateStatusIndicator(guard);
    });
  }

  /**
   * Raycast check to verify if vision between guard and player is unobstructed by solid walls or cottages
   */
  private checkLineOfSightClear(from: THREE.Vector3, to: THREE.Vector3): boolean {
    return collisionSystem.checkLineOfSightClear(from, to);
  }

  /**
   * Attempt stealth takedown behind guard
   */
  public attemptTakedown(playerPos: THREE.Vector3, playerRotation: number): { success: boolean; guardName?: string } {
    for (const guard of this.guards) {
      if (guard.state === 'disabled' || guard.state === 'chase') continue;

      const d = guard.position.distanceTo(playerPos);
      if (d < 2.2) {
        // Angle check: player must be behind guard
        const guardFacing = guard.rotation;
        _vec3A.set(Math.sin(guardFacing), 0, Math.cos(guardFacing));
        _vec3B.subVectors(playerPos, guard.position).normalize();

        const dot = _vec3A.dot(_vec3B);
        if (dot < -0.2) { // Behind guard
          guard.state = 'disabled';
          guard.disabledTimer = 18.0; // Stunned for 18 seconds
          sound.playLand();
          return { success: true, guardName: guard.name };
        }
      }
    }
    return { success: false };
  }

  /**
   * Returns current highest detection level for HUD stealth gauge
   */
  public getHighestDetection(): { level: number; state: GuardAIState } {
    let maxLevel = 0;
    let worstState: GuardAIState = 'patrol';

    this.guards.forEach((g) => {
      if (g.detectionLevel > maxLevel) {
        maxLevel = g.detectionLevel;
        worstState = g.state;
      }
    });

    return { level: maxLevel, state: worstState };
  }

  /**
   * Legacy companion update compatibility
   */
  public updateCompanion(
    companion: AdventurerCharacter | null,
    companionPos: THREE.Vector3,
    playerPos: THREE.Vector3,
    companionActive: boolean,
    dt: number,
    time: number
  ) {
    if (!companionActive || !companion) return;

    const distToPlayer = companionPos.distanceTo(playerPos);
    if (distToPlayer > 2.8) {
      _vec3A.subVectors(playerPos, companionPos).normalize().multiplyScalar(3.8);
      _companionVel.set(_vec3A.x, 0, _vec3A.z);

      collisionSystem.resolveMovementWithSubstepping(companionPos, _companionVel, dt, 0.55);

      companion.group.rotation.y = Math.atan2(_vec3A.x, _vec3A.z);
      companion.updateAnimation(time, 1, false, false);
    } else {
      companion.updateAnimation(time, 0, false, false);
    }

    const companionGroundY = getIslandHeight(companionPos.x, companionPos.z);
    companionPos.y = companionGroundY;
    companion.group.position.copy(companionPos);
  }

  public resetGuards() {
    this.guards.forEach((g) => {
      g.currentWaypointIdx = 0;
      const startWp = g.waypoints[0].clone();
      startWp.y = getIslandHeight(startWp.x, startWp.z);
      g.position.copy(startWp);
      g.character.group.position.copy(startWp);
      g.character.group.rotation.set(0, 0, 0);
      g.state = 'patrol';
      g.detectionLevel = 0;
      g.disabledTimer = 0;
      g.searchTimer = 0;
      this.updateStatusIndicator(g);
    });
  }

  public clearGuards(scene: THREE.Scene) {
    this.guards.forEach((g) => {
      scene.remove(g.character.group);
    });
    this.guards = [];
  }
}

export const guardAIController = new GuardAIController();
