import * as THREE from 'three';
import { CollisionSystem, CollisionLayer } from './collisionSystem';

export interface PhysicsTestResult {
  testName: string;
  passed: boolean;
  details: string;
}

export function runCollisionTestSuite(): PhysicsTestResult[] {
  const results: PhysicsTestResult[] = [];
  const cs = new CollisionSystem();

  // Test 1: Cylinder Obstacle Pushback
  try {
    cs.clearObstacles();
    cs.registerCylinderObstacle(0, 0, 2.0, CollisionLayer.STATIC_WORLD);

    const pos = new THREE.Vector3(1.0, 1.0, 0); // Penetrates cylinder radius 2.0 + char radius 0.55
    const vel = new THREE.Vector3(-5, 0, 0);
    cs.resolveMovementWithSubstepping(pos, vel, 0.016, 0.55);

    const dist = Math.hypot(pos.x, pos.z);
    const expectedMinDist = 2.55;
    const passed = dist >= expectedMinDist - 0.01;

    results.push({
      testName: 'Cylinder Obstacle Pushback',
      passed,
      details: `Position pushed from (1,0) to dist=${dist.toFixed(3)}m (expected >= ${expectedMinDist.toFixed(2)}m)`,
    });
  } catch (err) {
    results.push({
      testName: 'Cylinder Obstacle Pushback',
      passed: false,
      details: String(err),
    });
  }

  // Test 2: AABB Box Obstacle Pushback
  try {
    cs.clearObstacles();
    cs.registerBoxObstacle(-2, 2, -2, 2, CollisionLayer.STATIC_WORLD);

    const pos = new THREE.Vector3(1.8, 1.0, 0); // Inside box boundary
    const vel = new THREE.Vector3(0, 0, 0);
    cs.resolveMovementWithSubstepping(pos, vel, 0.016, 0.55);

    const passed = pos.x >= 2.55 - 0.02;
    results.push({
      testName: 'AABB Box Obstacle Pushback',
      passed,
      details: `Position pushed out to X=${pos.x.toFixed(3)}m (expected >= 2.53m)`,
    });
  } catch (err) {
    results.push({
      testName: 'AABB Box Obstacle Pushback',
      passed: false,
      details: String(err),
    });
  }

  // Test 3: Wall Velocity Tangent Sliding
  try {
    cs.clearObstacles();
    // Wall along Z axis at X = 5.0 (minX: 4.8, maxX: 5.2, minZ: -10, maxZ: 10)
    cs.registerBoxObstacle(4.8, 5.2, -10, 10, CollisionLayer.STATIC_WORLD);

    const pos = new THREE.Vector3(4.5, 1.0, 0); // Near wall
    const vel = new THREE.Vector3(10, 0, 10); // Moving diagonally into wall
    cs.resolveMovementWithSubstepping(pos, vel, 0.016, 0.55);

    // X velocity into wall should be canceled, Z velocity along wall preserved
    const passed = pos.x < 4.8 - 0.5 && vel.z > 0;
    results.push({
      testName: 'Wall Tangent Velocity Sliding',
      passed,
      details: `Sliding velocity along wall: vx=${vel.x.toFixed(2)}, vz=${vel.z.toFixed(2)}`,
    });
  } catch (err) {
    results.push({
      testName: 'Wall Tangent Velocity Sliding',
      passed: false,
      details: String(err),
    });
  }

  // Test 4: Usable Door State Toggling
  try {
    cs.clearObstacles();
    cs.registerDoor('cottage_front', -0.7, 0.7, 4.8, 5.2);

    // Test Closed Door
    cs.setDoorOpen('cottage_front', false);
    const posClosed = new THREE.Vector3(0, 1.0, 4.5);
    const velClosed = new THREE.Vector3(0, 0, 10);
    cs.resolveMovementWithSubstepping(posClosed, velClosed, 0.016, 0.55);
    const closedBlocked = posClosed.z < 4.8 - 0.5;

    // Test Open Door
    cs.setDoorOpen('cottage_front', true);
    const posOpen = new THREE.Vector3(0, 1.0, 4.5);
    const velOpen = new THREE.Vector3(0, 0, 10);
    // Advance multiple sub-steps to traverse door
    for (let f = 0; f < 5; f++) {
      cs.resolveMovementWithSubstepping(posOpen, velOpen, 0.016, 0.55);
    }
    const openTraversed = posOpen.z > 4.8;

    const passed = closedBlocked && openTraversed;
    results.push({
      testName: 'Usable Door State Toggling',
      passed,
      details: `Closed door blocked=${closedBlocked}, Open door traversed=${openTraversed}`,
    });
  } catch (err) {
    results.push({
      testName: 'Usable Door State Toggling',
      passed: false,
      details: String(err),
    });
  }

  // Test 5: High-Speed Anti-Tunneling
  try {
    cs.clearObstacles();
    // Thin wall at Z = 10.0 (depth 0.35m: minZ: 9.825, maxZ: 10.175)
    cs.registerBoxObstacle(-10, 10, 9.825, 10.175, CollisionLayer.STATIC_WORLD);

    const pos = new THREE.Vector3(0, 1.0, 8.0);
    const vel = new THREE.Vector3(0, 0, 80.0); // Extreme sprint speed 80 m/s
    cs.resolveMovementWithSubstepping(pos, vel, 0.033, 0.55); // 1 frame at 30 fps

    const passed = pos.z < 9.825; // Did not tunnel through wall!
    results.push({
      testName: 'High-Speed Anti-Tunneling',
      passed,
      details: `End Z position=${pos.z.toFixed(3)}m (wall front at 9.825m)`,
    });
  } catch (err) {
    results.push({
      testName: 'High-Speed Anti-Tunneling',
      passed: false,
      details: String(err),
    });
  }

  // Test 6: Island Landmass Boundary Clamping
  try {
    cs.clearObstacles();
    const pos = new THREE.Vector3(60.0, 1.0, 0); // Way outside 46m boundary
    cs.clampIslandBounds(pos, 46);

    const dist = Math.hypot(pos.x, pos.z);
    const passed = Math.abs(dist - 46.0) < 0.001;
    results.push({
      testName: 'Island Boundary Clamping',
      passed,
      details: `Clamped distance=${dist.toFixed(3)}m (expected 46.000m)`,
    });
  } catch (err) {
    results.push({
      testName: 'Island Boundary Clamping',
      passed: false,
      details: String(err),
    });
  }

  return results;
}
