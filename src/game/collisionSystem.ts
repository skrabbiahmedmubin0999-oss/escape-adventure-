import * as THREE from 'three';
import { getIslandHeight } from './proceduralAssets';

export enum CollisionLayer {
  STATIC_WORLD = 1 << 0, // 1: Trees, Rocks, Ruins, Terrain
  PLAYER       = 1 << 1, // 2: Player character
  GUARDS       = 1 << 2, // 4: Guard/Companion NPCs
  DOORS        = 1 << 3, // 8: Cottage and Gate Doors
  VEHICLES     = 1 << 4, // 16: Supply Wagons
  PROPS        = 1 << 5, // 32: Benches, Crates, Hedges, Fences, Streetlamps
  TRIGGERS     = 1 << 6, // 64: Interaction zones, Checkpoints
}

export interface CylinderCollider {
  type: 'cylinder';
  id?: string;
  x: number;
  z: number;
  radius: number;
  height?: number;
  layer: CollisionLayer;
  enabled: boolean;
}

export interface BoxCollider {
  type: 'box';
  id?: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  height?: number;
  layer: CollisionLayer;
  enabled: boolean;
}

export type Collider = CylinderCollider | BoxCollider;

export interface DoorColliderState {
  doorId: string;
  collider: BoxCollider;
  isOpen: boolean;
}

const _contactNormal = new THREE.Vector2();

export class CollisionSystem {
  private colliders: Collider[] = [];
  private doors: Map<string, DoorColliderState> = new Map();
  private colliderMeshes: THREE.Mesh[] = [];
  public showColliders: boolean = false;

  public registerCylinderObstacle(
    x: number,
    z: number,
    radius: number,
    layer: CollisionLayer = CollisionLayer.STATIC_WORLD,
    id?: string
  ) {
    this.colliders.push({
      type: 'cylinder',
      id,
      x,
      z,
      radius,
      layer,
      enabled: true,
    });
  }

  public registerBoxObstacle(
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number,
    layer: CollisionLayer = CollisionLayer.STATIC_WORLD,
    id?: string
  ) {
    this.colliders.push({
      type: 'box',
      id,
      minX,
      maxX,
      minZ,
      maxZ,
      layer,
      enabled: true,
    });
  }

  // Backward-compatible method
  public registerObstacle(x: number, z: number, radius: number) {
    this.registerCylinderObstacle(x, z, radius, CollisionLayer.STATIC_WORLD);
  }

  public registerDoor(doorId: string, minX: number, maxX: number, minZ: number, maxZ: number) {
    const collider: BoxCollider = {
      type: 'box',
      id: `door_${doorId}`,
      minX,
      maxX,
      minZ,
      maxZ,
      layer: CollisionLayer.DOORS,
      enabled: true,
    };
    this.colliders.push(collider);
    this.doors.set(doorId, { doorId, collider, isOpen: false });
  }

  public setDoorOpen(doorId: string, isOpen: boolean) {
    const door = this.doors.get(doorId);
    if (door) {
      door.isOpen = isOpen;
      door.collider.enabled = !isOpen; // Disables physical box collision when open
    }
  }

  public getObstacles(): Array<{ x: number; z: number; radius: number }> {
    return this.colliders
      .filter((c): c is CylinderCollider => c.type === 'cylinder')
      .map((c) => ({ x: c.x, z: c.z, radius: c.radius }));
  }

  public clearObstacles() {
    this.colliders = [];
    this.doors.clear();
    this.colliderMeshes.forEach((m) => {
      if (m.parent) m.parent.remove(m);
      m.geometry.dispose();
    });
    this.colliderMeshes = [];
  }

  /**
   * Checks if line-of-sight between two 3D points is unobstructed by any cylinder or box colliders
   */
  public checkLineOfSightClear(from: THREE.Vector3, to: THREE.Vector3): boolean {
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const dist = Math.hypot(dx, dz);

    if (dist < 0.001) return true;

    const dirX = dx / dist;
    const dirZNorm = dz / dist;

    for (const col of this.colliders) {
      if (!col.enabled) continue;

      if (col.type === 'cylinder') {
        const tox = col.x - from.x;
        const toz = col.z - from.z;
        const proj = tox * dirX + toz * dirZNorm;

        if (proj > 0.5 && proj < dist - 0.5) {
          const perpDistSq = tox * tox + toz * toz - proj * proj;
          if (perpDistSq < col.radius * col.radius) {
            return false; // Cylinder obstacle blocks vision
          }
        }
      } else if (col.type === 'box') {
        const invX = Math.abs(dirX) > 1e-6 ? 1 / dirX : 1e6;
        const invZ = Math.abs(dirZNorm) > 1e-6 ? 1 / dirZNorm : 1e6;

        let t1 = (col.minX - from.x) * invX;
        let t2 = (col.maxX - from.x) * invX;
        if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }

        let t3 = (col.minZ - from.z) * invZ;
        let t4 = (col.maxZ - from.z) * invZ;
        if (t3 > t4) { const tmp = t3; t3 = t4; t4 = tmp; }

        const tNear = Math.max(t1, t3);
        const tFar = Math.min(t2, t4);

        if (tNear <= tFar && tFar > 0.2 && tNear < dist - 0.2) {
          return false; // Box obstacle blocks vision
        }
      }
    }

    return true;
  }

  /**
   * Swept multi-substep position integration & wall-sliding collision resolution
   * Prevents tunneling at high movement speeds and eliminates corner sticking or jitter.
   */
  public resolveMovementWithSubstepping(
    pos: THREE.Vector3,
    velocity: THREE.Vector3,
    dt: number,
    characterRadius: number = 0.55,
    layerMask: number = CollisionLayer.STATIC_WORLD |
      CollisionLayer.DOORS |
      CollisionLayer.VEHICLES |
      CollisionLayer.PROPS
  ) {
    // 1. Clamp unusually large dt after tab suspension
    const clampedDt = Math.min(dt, 0.05);

    // 2. Sub-stepping: Divide time step into 4 sub-steps to guarantee anti-tunneling
    const numSubSteps = 4;
    const subDt = clampedDt / numSubSteps;

    for (let step = 0; step < numSubSteps; step++) {
      // Integrate position sub-step
      pos.x += velocity.x * subDt;
      pos.z += velocity.z * subDt;

      // Resolve collision against all active matching colliders
      let collided = false;
      for (const col of this.colliders) {
        if (!col.enabled || !(col.layer & layerMask)) continue;

        if (col.type === 'cylinder') {
          const dx = pos.x - col.x;
          const dz = pos.z - col.z;
          const dist = Math.hypot(dx, dz);
          const minDist = characterRadius + col.radius;

          if (dist < minDist && dist > 0.0001) {
            collided = true;
            const overlap = minDist - dist;
            const nx = dx / dist;
            const nz = dz / dist;

            // Push out of collision
            pos.x += nx * (overlap + 0.001);
            pos.z += nz * (overlap + 0.001);

            // Slide velocity along wall tangent
            const dot = velocity.x * nx + velocity.z * nz;
            if (dot < 0) {
              velocity.x -= dot * nx;
              velocity.z -= dot * nz;
            }
          }
        } else if (col.type === 'box') {
          // Closest point on AABB box to circle center
          const closestX = THREE.MathUtils.clamp(pos.x, col.minX, col.maxX);
          const closestZ = THREE.MathUtils.clamp(pos.z, col.minZ, col.maxZ);

          const dx = pos.x - closestX;
          const dz = pos.z - closestZ;
          const distSq = dx * dx + dz * dz;

          if (distSq < characterRadius * characterRadius) {
            collided = true;
            const dist = Math.sqrt(distSq);

            if (dist > 0.0001) {
              const overlap = characterRadius - dist;
              const nx = dx / dist;
              const nz = dz / dist;

              pos.x += nx * (overlap + 0.001);
              pos.z += nz * (overlap + 0.001);

              const dot = velocity.x * nx + velocity.z * nz;
              if (dot < 0) {
                velocity.x -= dot * nx;
                velocity.z -= dot * nz;
              }
            } else {
              // Deep penetration fallback: push toward nearest box edge
              const dLeft = pos.x - col.minX;
              const dRight = col.maxX - pos.x;
              const dTop = pos.z - col.minZ;
              const dBottom = col.maxZ - pos.z;
              const minEdge = Math.min(dLeft, dRight, dTop, dBottom);

              let nx = 0;
              let nz = 0;
              if (minEdge === dLeft) nx = -1;
              else if (minEdge === dRight) nx = 1;
              else if (minEdge === dTop) nz = -1;
              else nz = 1;

              pos.x += nx * (characterRadius + 0.02);
              pos.z += nz * (characterRadius + 0.02);

              velocity.x = 0;
              velocity.z = 0;
            }
          }
        }
      }

      // Island landmass boundary clamp
      this.clampIslandBounds(pos, 46);
    }
  }

  /**
   * Backward-compatible simple collision check
   */
  public resolvePlayerCollision(playerPos: THREE.Vector3, playerRadius: number = 0.55) {
    const dummyVel = new THREE.Vector3(0, 0, 0);
    this.resolveMovementWithSubstepping(playerPos, dummyVel, 0.016, playerRadius);
  }

  /**
   * Clamps character within the island landmass boundary (46m radius)
   */
  public clampIslandBounds(playerPos: THREE.Vector3, maxRadius: number = 46) {
    const distFromCenter = Math.hypot(playerPos.x, playerPos.z);
    if (distFromCenter > maxRadius) {
      const angle = Math.atan2(playerPos.z, playerPos.x);
      playerPos.x = Math.cos(angle) * maxRadius;
      playerPos.z = Math.sin(angle) * maxRadius;
    }
  }

  /**
   * Toggles rendering of green/red wireframe colliders for real-time visual debugging
   */
  public togglePhysicsWireframes(scene: THREE.Scene): boolean {
    this.showColliders = !this.showColliders;

    if (this.colliderMeshes.length === 0 && this.showColliders) {
      const greenWireMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
      const redWireMat = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });

      for (const col of this.colliders) {
        if (col.type === 'cylinder') {
          const h = 4.0;
          const geo = new THREE.CylinderGeometry(col.radius, col.radius, h, 12);
          const mesh = new THREE.Mesh(geo, greenWireMat);
          const y = getIslandHeight(col.x, col.z) + h * 0.5;
          mesh.position.set(col.x, y, col.z);
          scene.add(mesh);
          this.colliderMeshes.push(mesh);
        } else if (col.type === 'box') {
          const w = col.maxX - col.minX;
          const d = col.maxZ - col.minZ;
          const h = 3.5;
          const geo = new THREE.BoxGeometry(w, h, d);
          const mat = col.layer === CollisionLayer.DOORS ? redWireMat : greenWireMat;
          const mesh = new THREE.Mesh(geo, mat);
          const cx = (col.minX + col.maxX) * 0.5;
          const cz = (col.minZ + col.maxZ) * 0.5;
          const cy = getIslandHeight(cx, cz) + h * 0.5;
          mesh.position.set(cx, cy, cz);
          scene.add(mesh);
          this.colliderMeshes.push(mesh);
        }
      }
    } else {
      this.colliderMeshes.forEach((m) => {
        m.visible = this.showColliders;
      });
    }

    return this.showColliders;
  }
}

export const collisionSystem = new CollisionSystem();
