import * as THREE from 'three';
import { CheckpointData, ObstacleCourseState } from './types';
import { sound } from '../audio/soundSystem';
import { getIslandHeight } from './proceduralAssets';

export interface MovingPlatformData {
  mesh: THREE.Group;
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  speed: number;
  progress: number;
  direction: number;
  width: number;
  depth: number;
}

export interface RotatingObstacleData {
  mesh: THREE.Group;
  centerPos: THREE.Vector3;
  beamLength: number;
  rotationSpeed: number;
}

export class ObstacleSystem {
  public platforms: MovingPlatformData[] = [];
  public rotatingObstacles: RotatingObstacleData[] = [];
  public courseState: ObstacleCourseState = {
    active: false,
    currentCheckpointIndex: 0,
    checkpoints: [],
    startTime: 0,
    elapsedTime: 0,
    completed: false,
    bestTime: null,
  };

  public onCheckpointReached?: (checkpoint: CheckpointData, index: number) => void;
  public onCourseCompleted?: (finalTime: number, rewardCoins: number, rewardXp: number) => void;

  constructor() {
    this.initCheckpoints();
  }

  public initCheckpoints() {
    const defaultCheckpoints: CheckpointData[] = [
      { id: 'cp_beach', name: '1. Beach Campsite Arch', position: [-22, getIslandHeight(-22, 24) + 0.5, 24], radius: 3.5, reached: false },
      { id: 'cp_gorge', name: '2. River Gorge Moving Bridge', position: [-16, getIslandHeight(-16, -4) + 0.5, -4], radius: 3.5, reached: false },
      { id: 'cp_temple', name: '3. Sun Temple Terrace', position: [18, getIslandHeight(18, -18) + 0.5, -18], radius: 3.5, reached: false },
      { id: 'cp_grove', name: '4. Sacred Grove Sanctuary', position: [20, getIslandHeight(20, 18) + 0.5, 18], radius: 3.5, reached: false },
      { id: 'cp_finish', name: '5. GRAND FINISH LINE', position: [0, getIslandHeight(0, -26) + 0.5, -26], radius: 4.0, reached: false },
    ];

    this.courseState = {
      active: true,
      currentCheckpointIndex: 0,
      checkpoints: defaultCheckpoints,
      startTime: 0,
      elapsedTime: 0,
      completed: false,
      bestTime: null,
    };
  }

  public registerPlatform(mesh: THREE.Group, startPos: THREE.Vector3, endPos: THREE.Vector3, speed = 2.5) {
    this.platforms.push({
      mesh,
      startPos,
      endPos,
      speed,
      progress: Math.random(),
      direction: 1,
      width: 3.4,
      depth: 3.4,
    });
  }

  public registerRotatingObstacle(mesh: THREE.Group, centerPos: THREE.Vector3, beamLength = 6.2, speed = 1.8) {
    this.rotatingObstacles.push({
      mesh,
      centerPos,
      beamLength,
      rotationSpeed: speed,
    });
  }

  // Update physics & platform carrier velocity
  public update(dt: number, time: number, playerPos: THREE.Vector3, playerVel: THREE.Vector3, isGrounded: boolean): { carriedDelta: THREE.Vector3 } {
    const carriedDelta = new THREE.Vector3();

    // 1. Update Moving Platforms
    this.platforms.forEach((p) => {
      p.progress += p.direction * p.speed * 0.15 * dt;
      if (p.progress >= 1.0) {
        p.progress = 1.0;
        p.direction = -1;
      } else if (p.progress <= 0) {
        p.progress = 0;
        p.direction = 1;
      }

      // Smooth cosine interpolation
      const smoothT = (1 - Math.cos(p.progress * Math.PI)) * 0.5;
      const prevPos = p.mesh.position.clone();
      p.mesh.position.lerpVectors(p.startPos, p.endPos, smoothT);

      // Carrier velocity calculation if player is standing on platform
      const deltaPos = p.mesh.position.clone().sub(prevPos);
      const dx = Math.abs(playerPos.x - p.mesh.position.x);
      const dz = Math.abs(playerPos.z - p.mesh.position.z);
      const dy = playerPos.y - p.mesh.position.y;

      if (dx < p.width * 0.5 + 0.3 && dz < p.depth * 0.5 + 0.3 && dy >= 0.1 && dy <= 0.85) {
        carriedDelta.add(deltaPos);
        if (isGrounded) {
          playerPos.y = p.mesh.position.y + 0.45;
        }
      }
    });

    // 2. Update Rotating Beam Hazards
    this.rotatingObstacles.forEach((ro) => {
      const beamShaft = ro.mesh.getObjectByName('BeamShaft');
      if (beamShaft) {
        beamShaft.rotation.y = time * ro.rotationSpeed;

        // Check hazard collision with player
        const dCenter = Math.hypot(playerPos.x - ro.centerPos.x, playerPos.z - ro.centerPos.z);
        const dY = Math.abs(playerPos.y - (ro.centerPos.y + 1.4));

        if (dCenter < ro.beamLength * 0.5 + 0.4 && dY < 0.9) {
          // Push player outward gently upon collision
          const pushDir = playerPos.clone().sub(ro.centerPos).normalize();
          playerVel.x = pushDir.x * 6.5;
          playerVel.z = pushDir.z * 6.5;
          sound.playLand();
        }
      }
    });

    // 3. Update Course Checkpoints & Timers
    if (this.courseState.active && !this.courseState.completed) {
      this.courseState.elapsedTime += dt;
      const currentCp = this.courseState.checkpoints[this.courseState.currentCheckpointIndex];

      if (currentCp && !currentCp.reached) {
        const cpPos = new THREE.Vector3(...currentCp.position);
        const dist = playerPos.distanceTo(cpPos);

        if (dist < currentCp.radius) {
          currentCp.reached = true;
          sound.playKeyPickup();

          if (this.onCheckpointReached) {
            this.onCheckpointReached(currentCp, this.courseState.currentCheckpointIndex);
          }

          if (this.courseState.currentCheckpointIndex < this.courseState.checkpoints.length - 1) {
            this.courseState.currentCheckpointIndex++;
          } else {
            // Course Completed!
            this.courseState.completed = true;
            this.courseState.bestTime = this.courseState.bestTime === null
              ? this.courseState.elapsedTime
              : Math.min(this.courseState.bestTime, this.courseState.elapsedTime);

            sound.playVictoryFanfare();

            if (this.onCourseCompleted) {
              this.onCourseCompleted(this.courseState.elapsedTime, 150, 300);
            }
          }
        }
      }
    }

    return { carriedDelta };
  }

  public resetCourse() {
    this.initCheckpoints();
  }
}

export const obstacleSystem = new ObstacleSystem();
