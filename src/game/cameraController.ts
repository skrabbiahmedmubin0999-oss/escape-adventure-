import * as THREE from 'three';
import { getIslandHeight } from './proceduralAssets';
import { GameMode } from './types';

const _camTarget = new THREE.Vector3();
const _camPos = new THREE.Vector3();

export class CameraController {
  public cameraDistance: number = 6.8;
  public cameraPitch: number = 0.35; // radians
  public cameraYaw: number = 0; // radians
  public mouseSensitivity: number = 1.0;
  public invertY: boolean = false;

  private currentLookTarget: THREE.Vector3 = new THREE.Vector3();

  public onPointerDrag(deltaX: number, deltaY: number) {
    const factor = 0.003 * this.mouseSensitivity;
    this.cameraYaw -= deltaX * factor;
    const yDir = this.invertY ? -1 : 1;
    this.cameraPitch = THREE.MathUtils.clamp(
      this.cameraPitch - deltaY * factor * yDir,
      0.08,
      1.3
    );
  }

  public onZoom(delta: number) {
    this.cameraDistance = THREE.MathUtils.clamp(this.cameraDistance + delta * 0.005, 3.5, 14.0);
  }

  public update(
    camera: THREE.PerspectiveCamera,
    playerPos: THREE.Vector3,
    dt: number,
    mode: GameMode,
    time: number
  ) {
    const clampedDt = Math.min(dt, 0.05); // Clamp frame delta after tab suspension or lag

    if (mode === 'menu') {
      // Atmospheric cinematic orbit around the island
      const orbitRadius = 45;
      const orbitSpeed = 0.12;
      const camX = Math.sin(time * orbitSpeed) * orbitRadius;
      const camZ = Math.cos(time * orbitSpeed) * orbitRadius;
      camera.position.set(camX, 20 + Math.sin(time * 0.2) * 3, camZ);
      camera.lookAt(0, 4, 0);
      return;
    }

    if (mode === 'victory') {
      // Victory orbit around player at the opened gate
      const vicAngle = time * 0.6;
      camera.position.set(
        playerPos.x + Math.sin(vicAngle) * 7,
        playerPos.y + 4.5,
        playerPos.z + Math.cos(vicAngle) * 7
      );
      camera.lookAt(playerPos.x, playerPos.y + 1.2, playerPos.z);
      return;
    }

    if (mode === 'playing') {
      // Target is at player's torso level (1.4m height)
      _camTarget.set(playerPos.x, playerPos.y + 1.4, playerPos.z);


      // Calculate desired camera position using spherical coordinates
      const cy = Math.cos(this.cameraPitch) * this.cameraDistance;
      const cx = Math.sin(this.cameraYaw) * cy;
      const cz = Math.cos(this.cameraYaw) * cy;
      const ch = Math.sin(this.cameraPitch) * this.cameraDistance;

      _camPos.set(_camTarget.x + cx, _camTarget.y + ch, _camTarget.z + cz);

      // Clamp camera above terrain so it never clips under ground
      const groundBelowCam = getIslandHeight(_camPos.x, _camPos.z) + 0.6;
      if (_camPos.y < groundBelowCam) {
        _camPos.y = groundBelowCam;
      }

      // Exponential frame-rate-independent damping for camera position
      camera.position.x = THREE.MathUtils.damp(camera.position.x, _camPos.x, 10, clampedDt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, _camPos.y, 10, clampedDt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, _camPos.z, 10, clampedDt);

      // Decouple camera lookAt target with extra smooth Y damping (eliminates vertical step/jump bobbing)
      this.currentLookTarget.x = THREE.MathUtils.damp(this.currentLookTarget.x, _camTarget.x, 12, clampedDt);
      this.currentLookTarget.y = THREE.MathUtils.damp(this.currentLookTarget.y, _camTarget.y, 8, clampedDt);
      this.currentLookTarget.z = THREE.MathUtils.damp(this.currentLookTarget.z, _camTarget.z, 12, clampedDt);

      camera.lookAt(this.currentLookTarget);
    }
  }
}

export const cameraController = new CameraController();
