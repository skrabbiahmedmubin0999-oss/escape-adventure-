import * as THREE from 'three';
import { KeyType } from './types';

/**
 * Heightmap function for the island
 * Returns the ground elevation Y at any coordinate (x, z)
 */
export function getIslandHeight(x: number, z: number): number {
  const distFromCenter = Math.sqrt(x * x + z * z);
  const maxRadius = 48;

  // Ocean bounds - water level is 0
  if (distFromCenter > maxRadius) {
    return -2.5;
  }

  // Base island dome
  const normDist = distFromCenter / maxRadius;
  let height = (1 - normDist * normDist) * 5.5;

  // Gentle rolling hills using sine combinations
  height += Math.sin(x * 0.12) * Math.cos(z * 0.12) * 1.4;
  height += Math.sin(x * 0.25 + 1.2) * Math.cos(z * 0.2 - 0.8) * 0.8;

  // River carved channel from waterfall (x: -12, z: -10) down to the sea (x: -36, z: 20)
  // Distance to river bezier curve line
  const riverT = THREE.MathUtils.clamp((x + 36) / 24, 0, 1);
  const riverX = -36 + riverT * 24;
  const riverZ = 20 - riverT * 30 + Math.sin(riverT * Math.PI) * 5;
  const dRiver = Math.hypot(x - riverX, z - riverZ);
  if (dRiver < 4.5) {
    const carve = Math.cos((dRiver / 4.5) * (Math.PI / 2)) * 3.2;
    height -= carve;
  }

  // Waterfall rock cliff elevation
  const dCliff = Math.hypot(x - (-12), z - (-12));
  if (dCliff < 7) {
    height += (1 - dCliff / 7) * 4.5;
  }

  // Sun Temple hill (North-East: x: 18, z: -18)
  const dSunHill = Math.hypot(x - 18, z - (-18));
  if (dSunHill < 12) {
    height += Math.cos((dSunHill / 12) * (Math.PI / 2)) * 4.0;
  }

  // Sacred Grove terrace (South-East: x: 20, z: 18)
  const dGrove = Math.hypot(x - 20, z - 18);
  if (dGrove < 12) {
    height += Math.cos((dGrove / 12) * (Math.PI / 2)) * 2.5;
  }

  // Starting beach (South-West: x: -22, z: 24)
  const dBeach = Math.hypot(x - (-22), z - 24);
  if (dBeach < 10) {
    height = Math.max(0.4, height * 0.6);
  }

  // Central Rune Plaza flattening (x: 0, z: 2)
  const dPlaza = Math.hypot(x, z - 2);
  if (dPlaza < 8) {
    const factor = Math.cos((dPlaza / 8) * (Math.PI / 2));
    height = height * (1 - factor) + 2.8 * factor;
  }

  // Escape Gate plateau (North: x: 0, z: -30)
  const dGate = Math.hypot(x, z - (-30));
  if (dGate < 8) {
    const factor = Math.cos((dGate / 8) * (Math.PI / 2));
    height = height * (1 - factor) + 4.2 * factor;
  }

  return height;
}

/**
 * Character 3D Model: Stylized Adventurer with articulated limbs for animations
 */
export interface AdventurerCharacter {
  group: THREE.Group;
  head: THREE.Group;
  torso: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  backpack: THREE.Group;
  updateAnimation: (
    time: number,
    speed: number,
    isJumping: boolean,
    isRunning: boolean,
    isCrouching?: boolean
  ) => void;
  setOutfitColor: (tunicColor: string, hatColor: string) => void;
}

export function createAdventurerModel(initialTunic = '#e67e22', initialHat = '#8e44ad'): AdventurerCharacter {
  const root = new THREE.Group();
  root.name = 'Adventurer';

  // Materials
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xffd1a4,
    roughness: 0.6,
    metalness: 0.05,
  });

  const tunicMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(initialTunic),
    roughness: 0.75,
    metalness: 0.1,
  });

  const hatMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(initialHat),
    roughness: 0.8,
    metalness: 0.1,
  });

  const beltMat = new THREE.MeshStandardMaterial({
    color: 0x3e2723,
    roughness: 0.5,
    metalness: 0.2,
  });

  const buckleMat = new THREE.MeshStandardMaterial({
    color: 0xf1c40f,
    roughness: 0.3,
    metalness: 0.85,
  });

  const pantsMat = new THREE.MeshStandardMaterial({
    color: 0x2c3e50,
    roughness: 0.8,
    metalness: 0.1,
  });

  const bootMat = new THREE.MeshStandardMaterial({
    color: 0x4a2810,
    roughness: 0.6,
    metalness: 0.15,
  });

  const packMat = new THREE.MeshStandardMaterial({
    color: 0x795548,
    roughness: 0.7,
    metalness: 0.1,
  });

  // Torso
  const torso = new THREE.Group();
  torso.position.y = 1.05;

  const bodyGeo = new THREE.CylinderGeometry(0.32, 0.26, 0.65, 8);
  const bodyMesh = new THREE.Mesh(bodyGeo, tunicMat);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  torso.add(bodyMesh);

  // Belt & Buckle
  const beltGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.1, 8);
  const beltMesh = new THREE.Mesh(beltGeo, beltMat);
  beltMesh.position.y = -0.22;
  torso.add(beltMesh);

  const buckleGeo = new THREE.BoxGeometry(0.12, 0.1, 0.04);
  const buckleMesh = new THREE.Mesh(buckleGeo, buckleMat);
  buckleMesh.position.set(0, -0.22, 0.28);
  torso.add(buckleMesh);

  // Backpack on Torso
  const backpack = new THREE.Group();
  backpack.position.set(0, 0.05, -0.28);

  const packGeo = new THREE.BoxGeometry(0.38, 0.45, 0.2);
  const packMesh = new THREE.Mesh(packGeo, packMat);
  packMesh.castShadow = true;
  backpack.add(packMesh);

  // Sleeping bag roll on top of pack
  const rollGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.44, 8);
  rollGeo.rotateZ(Math.PI / 2);
  const rollMesh = new THREE.Mesh(rollGeo, new THREE.MeshStandardMaterial({ color: 0x16a085, roughness: 0.8 }));
  rollMesh.position.set(0, 0.28, 0);
  backpack.add(rollMesh);

  // Small brass canteen on side of pack
  const canteenGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.16, 6);
  const canteenMesh = new THREE.Mesh(canteenGeo, buckleMat);
  canteenMesh.position.set(0.24, -0.05, 0);
  backpack.add(canteenMesh);

  torso.add(backpack);

  // Head
  const head = new THREE.Group();
  head.position.y = 0.52;

  const faceGeo = new THREE.SphereGeometry(0.24, 12, 10);
  const faceMesh = new THREE.Mesh(faceGeo, skinMat);
  faceMesh.castShadow = true;
  head.add(faceMesh);

  // Stylized Hair / Explorer Cap / Fedora Hat
  const hatBrimGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.04, 12);
  const hatBrim = new THREE.Mesh(hatBrimGeo, hatMat);
  hatBrim.position.y = 0.14;
  head.add(hatBrim);

  const hatCrownGeo = new THREE.CylinderGeometry(0.22, 0.26, 0.22, 10);
  const hatCrown = new THREE.Mesh(hatCrownGeo, hatMat);
  hatCrown.position.y = 0.25;
  head.add(hatCrown);

  const hatBandGeo = new THREE.CylinderGeometry(0.27, 0.27, 0.06, 10);
  const hatBand = new THREE.Mesh(hatBandGeo, beltMat);
  hatBand.position.y = 0.18;
  head.add(hatBand);

  // Explorer Stylized Eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const eyeGeo = new THREE.SphereGeometry(0.035, 6, 6);
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(0.09, 0.02, 0.21);
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(-0.09, 0.02, 0.21);
  head.add(leftEye, rightEye);

  torso.add(head);

  // Arms (Left & Right articulated groups)
  function createArm(isLeft: boolean) {
    const armGroup = new THREE.Group();
    armGroup.position.set(isLeft ? 0.38 : -0.38, 0.2, 0);

    // Shoulder / Upper sleeve
    const sleeveGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.3, 6);
    const sleeve = new THREE.Mesh(sleeveGeo, tunicMat);
    sleeve.position.y = -0.15;
    sleeve.castShadow = true;
    armGroup.add(sleeve);

    // Forearm & Hand
    const handGeo = new THREE.SphereGeometry(0.09, 6, 6);
    const hand = new THREE.Mesh(handGeo, skinMat);
    hand.position.y = -0.34;
    armGroup.add(hand);

    return armGroup;
  }

  const leftArm = createArm(true);
  const rightArm = createArm(false);
  torso.add(leftArm, rightArm);

  // Legs (Left & Right articulated groups)
  function createLeg(isLeft: boolean) {
    const legGroup = new THREE.Group();
    legGroup.position.set(isLeft ? 0.16 : -0.16, 0.72, 0);

    const legGeo = new THREE.CylinderGeometry(0.11, 0.09, 0.42, 6);
    const legMesh = new THREE.Mesh(legGeo, pantsMat);
    legMesh.position.y = -0.21;
    legMesh.castShadow = true;
    legGroup.add(legMesh);

    // Boot
    const bootGeo = new THREE.BoxGeometry(0.16, 0.2, 0.24);
    const boot = new THREE.Mesh(bootGeo, bootMat);
    boot.position.set(0, -0.45, 0.04);
    boot.castShadow = true;
    legGroup.add(boot);

    return legGroup;
  }

  const leftLeg = createLeg(true);
  const rightLeg = createLeg(false);

  root.add(torso);
  root.add(leftLeg);
  root.add(rightLeg);

  // Animation method
  const updateAnimation = (
    time: number,
    speed: number,
    isJumping: boolean,
    isRunning: boolean,
    isCrouching: boolean = false
  ) => {
    const runMultiplier = isRunning ? 1.6 : 1.0;
    const walkFrequency = speed > 0.05 ? 10 * Math.max(0.4, speed) * runMultiplier : 2;

    if (isJumping) {
      // In air jump pose
      leftLeg.rotation.x = -0.6;
      rightLeg.rotation.x = 0.5;
      leftArm.rotation.x = -1.2;
      rightArm.rotation.x = -1.2;
      torso.position.y = 1.15;
      head.rotation.x = -0.2;
    } else if (isCrouching) {
      // Stealth Crouch Posture
      const swing = speed > 0.05 ? Math.sin(time * walkFrequency) * 0.4 : 0;
      leftLeg.rotation.x = 0.35 + swing;
      rightLeg.rotation.x = 0.35 - swing;
      leftArm.rotation.x = -0.5 - swing * 0.5;
      rightArm.rotation.x = -0.5 + swing * 0.5;
      torso.position.y = 0.72 + (speed > 0.05 ? Math.abs(Math.sin(time * walkFrequency)) * 0.03 : 0);
      head.rotation.x = 0.2;
    } else if (speed > 0.05) {
      // Running / Walking cycle
      const swing = Math.sin(time * walkFrequency) * 0.7 * (speed > 0.5 ? 1.2 : 0.8);
      leftLeg.rotation.x = swing;
      rightLeg.rotation.x = -swing;

      leftArm.rotation.x = -swing * 0.9;
      rightArm.rotation.x = swing * 0.9;

      // Subtle torso bobbing and twist
      torso.position.y = 1.05 + Math.abs(Math.sin(time * walkFrequency)) * 0.08;
      torso.rotation.y = Math.sin(time * walkFrequency) * 0.12;
      head.rotation.x = 0;
      head.rotation.y = -Math.sin(time * walkFrequency) * 0.08;
    } else {
      // Idle breathing pose
      const breath = Math.sin(time * 2.5);
      leftLeg.rotation.x = 0;
      rightLeg.rotation.x = 0;
      leftArm.rotation.x = breath * 0.06;
      rightArm.rotation.x = -breath * 0.06;
      torso.position.y = 1.05 + breath * 0.02;
      torso.rotation.y = 0;
      head.rotation.x = 0;
      head.rotation.y = 0;
      head.position.y = 0.52 + breath * 0.01;
    }
  };

  const setOutfitColor = (tunicColor: string, hatColor: string) => {
    tunicMat.color.set(tunicColor);
    hatMat.color.set(hatColor);
  };

  return {
    group: root,
    head,
    torso,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    backpack,
    updateAnimation,
    setOutfitColor,
  };
}

/**
 * Procedural Island Terrain Geometry
 */
export function createIslandTerrain(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'IslandTerrain';

  const segments = 120;
  const size = 110;
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const posAttr = geometry.attributes.position;
  const colors: number[] = [];

  // Colors
  const sandColor = new THREE.Color(0xe6cca0);
  const grassLight = new THREE.Color(0x5ca83c);
  const grassDark = new THREE.Color(0x38761d);
  const rockColor = new THREE.Color(0x7f8c8d);
  const pathColor = new THREE.Color(0xd7ba89);

  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const z = posAttr.getZ(i);

    const y = getIslandHeight(x, z);
    posAttr.setY(i, y);

    // Color computation
    const vertexColor = new THREE.Color();
    const distCenter = Math.hypot(x, z);

    // Check if along main dirt path (connecting spawn -> plaza -> temple/gate)
    let isPath = false;
    // Path from beach to plaza
    const dPath1 = Math.abs((x - (-22)) * (2 - 24) - (z - 24) * (0 - (-22))) / Math.hypot(2 - 24, 0 - (-22));
    if (dPath1 < 2.0 && x > -22 && x < 2 && z < 25 && z > 0) isPath = true;

    // Path from plaza to gate
    if (Math.abs(x) < 2.2 && z < 2 && z > -30) isPath = true;

    // Path from plaza to Sun Temple
    const dPath3 = Math.abs((x - 0) * (-18 - 2) - (z - 2) * (18 - 0)) / Math.hypot(-18 - 2, 18 - 0);
    if (dPath3 < 2.2 && x > 0 && x < 18 && z < 2 && z > -18) isPath = true;

    if (y < 0.6 || distCenter > 42) {
      vertexColor.copy(sandColor);
    } else if (isPath) {
      vertexColor.copy(pathColor);
    } else if (y > 7.0) {
      vertexColor.copy(rockColor);
    } else {
      const t = THREE.MathUtils.clamp((y - 0.6) / 5.0, 0, 1);
      vertexColor.lerpColors(grassLight, grassDark, t);
    }

    colors.push(vertexColor.r, vertexColor.g, vertexColor.b);
  }

  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.85,
    metalness: 0.05,
    flatShading: true,
  });

  const terrainMesh = new THREE.Mesh(geometry, terrainMat);
  terrainMesh.receiveShadow = true;
  group.add(terrainMesh);

  return group;
}

/**
 * Animated Water Plane
 */
export function createWaterMesh(): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(240, 240, 64, 64);
  geo.rotateX(-Math.PI / 2);

  const mat = new THREE.MeshStandardMaterial({
    color: 0x1abc9c,
    roughness: 0.1,
    metalness: 0.25,
    transparent: true,
    opacity: 0.8,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0.0;
  mesh.name = 'WaterPlane';
  return mesh;
}

/**
 * Stylized Trees (Composite multi-part models with varied silhouettes)
 */
export function createTree(type: 'palm' | 'oak' | 'pine' | 'sacred'): THREE.Group {
  const tree = new THREE.Group();

  const woodMat = new THREE.MeshStandardMaterial({
    color: type === 'sacred' ? 0x4a2e18 : 0x6e4726,
    roughness: 0.85,
    metalness: 0.05,
  });

  const leafMat1 = new THREE.MeshStandardMaterial({
    color: type === 'sacred' ? 0x2ecc71 : 0x27ae60,
    roughness: 0.7,
    metalness: 0.05,
    flatShading: true,
  });

  const leafMat2 = new THREE.MeshStandardMaterial({
    color: type === 'sacred' ? 0xa3e4d7 : 0x2ecc71,
    roughness: 0.65,
    metalness: 0.05,
    flatShading: true,
  });

  if (type === 'palm') {
    // Curved trunk with segments
    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.3, 2, 0.1),
      new THREE.Vector3(0.8, 4.2, 0.4),
      new THREE.Vector3(1.1, 6.2, 0.6),
    ]);
    const trunkGeo = new THREE.TubeGeometry(trunkCurve, 8, 0.28, 6, false);
    const trunk = new THREE.Mesh(trunkGeo, woodMat);
    trunk.castShadow = true;
    tree.add(trunk);

    // Palm fronds
    const crownPos = new THREE.Vector3(1.1, 6.2, 0.6);
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      const frondGeo = new THREE.ConeGeometry(0.9, 3.2, 5);
      frondGeo.translate(0, 1.6, 0);
      frondGeo.rotateZ(Math.PI / 2.8);
      frondGeo.rotateY(angle);
      const frond = new THREE.Mesh(frondGeo, leafMat1);
      frond.position.copy(crownPos);
      frond.castShadow = true;
      tree.add(frond);
    }
  } else if (type === 'pine') {
    // Tall conical layered pine
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 3.5, 6);
    const trunk = new THREE.Mesh(trunkGeo, woodMat);
    trunk.position.y = 1.75;
    trunk.castShadow = true;
    tree.add(trunk);

    // 3 layered cones
    const layerSizes = [
      { r: 1.8, h: 2.2, y: 2.6 },
      { r: 1.4, h: 2.0, y: 3.8 },
      { r: 0.9, h: 1.8, y: 4.9 },
    ];
    layerSizes.forEach((layer, idx) => {
      const coneGeo = new THREE.ConeGeometry(layer.r, layer.h, 7);
      const cone = new THREE.Mesh(coneGeo, idx % 2 === 0 ? leafMat1 : leafMat2);
      cone.position.y = layer.y;
      cone.castShadow = true;
      tree.add(cone);
    });
  } else if (type === 'sacred') {
    // Massive Ancient Sacred Tree with 5 thick roots & glowing orbs
    const trunkGeo = new THREE.CylinderGeometry(0.9, 1.6, 6, 8);
    const trunk = new THREE.Mesh(trunkGeo, woodMat);
    trunk.position.y = 3;
    trunk.castShadow = true;
    tree.add(trunk);

    // Giant layered foliage spheres
    const foliageCluster = [
      { r: 2.8, pos: [0, 6.5, 0] },
      { r: 2.0, pos: [2.0, 5.5, 1.2] },
      { r: 2.2, pos: [-2.1, 5.8, -1.0] },
      { r: 1.8, pos: [0.8, 6.8, -1.8] },
    ];
    foliageCluster.forEach((c) => {
      const sphereGeo = new THREE.DodecahedronGeometry(c.r, 1);
      const mesh = new THREE.Mesh(sphereGeo, leafMat2);
      mesh.position.set(c.pos[0], c.pos[1], c.pos[2]);
      mesh.castShadow = true;
      tree.add(mesh);
    });

    // Glowing ancient runes / fireflies around tree
    const orbGeo = new THREE.SphereGeometry(0.18, 8, 8);
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0x58d68d,
      emissive: 0x2ecc71,
      emissiveIntensity: 1.5,
    });
    for (let o = 0; o < 6; o++) {
      const angle = (o / 6) * Math.PI * 2;
      const orb = new THREE.Mesh(orbGeo, orbMat);
      orb.position.set(Math.cos(angle) * 3.5, 3.5 + Math.sin(o * 2) * 1.5, Math.sin(angle) * 3.5);
      tree.add(orb);
    }
  } else {
    // Oak / Deciduous tree
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.45, 3, 6);
    const trunk = new THREE.Mesh(trunkGeo, woodMat);
    trunk.position.y = 1.5;
    trunk.castShadow = true;
    tree.add(trunk);

    // Clustered stylized foliage spheres
    const spheres = [
      { r: 1.7, pos: [0, 3.4, 0] },
      { r: 1.2, pos: [0.9, 3.1, 0.7] },
      { r: 1.1, pos: [-0.8, 3.2, -0.6] },
      { r: 1.0, pos: [0.2, 4.3, -0.4] },
    ];
    spheres.forEach((s, idx) => {
      const sGeo = new THREE.IcosahedronGeometry(s.r, 1);
      const mesh = new THREE.Mesh(sGeo, idx % 2 === 0 ? leafMat1 : leafMat2);
      mesh.position.set(s.pos[0], s.pos[1], s.pos[2]);
      mesh.castShadow = true;
      tree.add(mesh);
    });
  }

  return tree;
}

/**
 * Stylized Rocks & Boulders
 */
export function createRock(scale = 1): THREE.Group {
  const rockGroup = new THREE.Group();

  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x8a9597,
    roughness: 0.9,
    metalness: 0.05,
    flatShading: true,
  });

  const geo = new THREE.DodecahedronGeometry(1.2 * scale, 1);
  const mesh = new THREE.Mesh(geo, rockMat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.scale.set(1.2, 0.8, 1.0);
  mesh.position.y = 0.5 * scale;
  rockGroup.add(mesh);

  return rockGroup;
}

/**
 * Wooden Bridge across the River
 */
export function createBridge(): THREE.Group {
  const bridge = new THREE.Group();
  bridge.name = 'RiverBridge';

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x8d6e63,
    roughness: 0.8,
    metalness: 0.05,
  });
  const ropeMat = new THREE.MeshStandardMaterial({
    color: 0xbcaaa4,
    roughness: 0.9,
  });

  // Planks
  const numPlanks = 12;
  const plankLength = 8.5;
  for (let i = 0; i < numPlanks; i++) {
    const t = i / (numPlanks - 1);
    const zOffset = (t - 0.5) * plankLength;
    const archY = Math.sin(t * Math.PI) * 0.45;

    const plankGeo = new THREE.BoxGeometry(2.4, 0.12, 0.6);
    const plank = new THREE.Mesh(plankGeo, woodMat);
    plank.position.set(0, archY, zOffset);
    plank.rotation.x = -Math.cos(t * Math.PI) * 0.12;
    plank.castShadow = true;
    plank.receiveShadow = true;
    bridge.add(plank);
  }

  // Support posts
  const postPositions = [
    [-1.1, -4.0], [1.1, -4.0],
    [-1.1, 4.0], [1.1, 4.0],
  ];
  postPositions.forEach(([px, pz]) => {
    const postGeo = new THREE.CylinderGeometry(0.12, 0.14, 2.2, 6);
    const post = new THREE.Mesh(postGeo, woodMat);
    post.position.set(px, 0.4, pz);
    post.castShadow = true;
    bridge.add(post);
  });

  // Rope handrails
  const ropeGeo = new THREE.CylinderGeometry(0.04, 0.04, plankLength, 6);
  ropeGeo.rotateX(Math.PI / 2);

  const leftRope = new THREE.Mesh(ropeGeo, ropeMat);
  leftRope.position.set(-1.1, 1.1, 0);
  const rightRope = new THREE.Mesh(ropeGeo, ropeMat);
  rightRope.position.set(1.1, 1.1, 0);

  bridge.add(leftRope, rightRope);

  return bridge;
}

/**
 * Collectible Key 3D Item
 */
export function createKeyItem(type: KeyType): THREE.Group {
  const keyGroup = new THREE.Group();
  keyGroup.name = `KeyItem_${type}`;

  const colors = {
    sun: { body: 0xf1c40f, gem: 0xf39c12, glow: 0xffd700 },
    ocean: { body: 0x3498db, gem: 0x2980b9, glow: 0x00ffff },
    forest: { body: 0x2ecc71, gem: 0x27ae60, glow: 0x2ecc71 },
  };
  const c = colors[type];

  const goldMat = new THREE.MeshStandardMaterial({
    color: c.body,
    metalness: 0.9,
    roughness: 0.2,
  });

  const gemMat = new THREE.MeshStandardMaterial({
    color: c.gem,
    emissive: c.glow,
    emissiveIntensity: 0.8,
    metalness: 0.3,
    roughness: 0.1,
  });

  // Key handle / ornate ring
  const ringGeo = new THREE.TorusGeometry(0.35, 0.08, 10, 16);
  const ring = new THREE.Mesh(ringGeo, goldMat);
  ring.position.y = 0.55;
  ring.castShadow = true;
  keyGroup.add(ring);

  // Gem in center of handle
  const gemGeo = new THREE.OctahedronGeometry(0.18, 0);
  const gem = new THREE.Mesh(gemGeo, gemMat);
  gem.position.y = 0.55;
  keyGroup.add(gem);

  // Shaft
  const shaftGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.75, 8);
  const shaft = new THREE.Mesh(shaftGeo, goldMat);
  shaft.position.y = 0.05;
  shaft.castShadow = true;
  keyGroup.add(shaft);

  // Teeth
  const tooth1Geo = new THREE.BoxGeometry(0.18, 0.1, 0.06);
  const tooth1 = new THREE.Mesh(tooth1Geo, goldMat);
  tooth1.position.set(0.12, -0.15, 0);
  const tooth2Geo = new THREE.BoxGeometry(0.24, 0.1, 0.06);
  const tooth2 = new THREE.Mesh(tooth2Geo, goldMat);
  tooth2.position.set(0.15, -0.28, 0);
  keyGroup.add(tooth1, tooth2);

  // Floating mystical rune halo around key
  const haloGeo = new THREE.RingGeometry(0.65, 0.75, 24);
  const haloMat = new THREE.MeshBasicMaterial({
    color: c.glow,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6,
  });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.name = 'KeyHalo';
  keyGroup.add(halo);

  // Soft point light
  const light = new THREE.PointLight(c.glow, 1.2, 5);
  light.position.y = 0.3;
  keyGroup.add(light);

  return keyGroup;
}

/**
 * Ancient Rune Altar Puzzle
 */
export function createRuneAltar(): {
  group: THREE.Group;
  pedestals: THREE.Group[];
  centerCrystal: THREE.Mesh;
  setSolved: (solved: boolean) => void;
} {
  const group = new THREE.Group();
  group.name = 'RuneAltar';

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x95a5a6,
    roughness: 0.85,
    metalness: 0.1,
  });

  const runeInactiveMat = new THREE.MeshStandardMaterial({
    color: 0x34495e,
    roughness: 0.5,
  });

  const runeActiveMat = new THREE.MeshStandardMaterial({
    color: 0x2ecc71,
    emissive: 0x2ecc71,
    emissiveIntensity: 1.2,
  });

  // Base circular dais
  const daisGeo = new THREE.CylinderGeometry(4.2, 4.6, 0.4, 16);
  const dais = new THREE.Mesh(daisGeo, stoneMat);
  dais.position.y = 0.2;
  dais.receiveShadow = true;
  group.add(dais);

  // 3 Surrounding Rune Pedestals for each elemental key
  const pedestals: THREE.Group[] = [];
  const angles = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];
  const keyColors = [0xf1c40f, 0x3498db, 0x2ecc71];

  angles.forEach((ang, idx) => {
    const ped = new THREE.Group();
    const x = Math.cos(ang) * 2.8;
    const z = Math.sin(ang) * 2.8;
    ped.position.set(x, 0.4, z);

    // Pillar
    const pillarGeo = new THREE.CylinderGeometry(0.45, 0.55, 1.2, 8);
    const pillar = new THREE.Mesh(pillarGeo, stoneMat);
    pillar.position.y = 0.6;
    pillar.castShadow = true;
    ped.add(pillar);

    // Receptacle bowl
    const bowlGeo = new THREE.CylinderGeometry(0.55, 0.4, 0.25, 8);
    const bowl = new THREE.Mesh(bowlGeo, stoneMat);
    bowl.position.y = 1.25;
    ped.add(bowl);

    // Rune socket / crystal slot
    const slotGeo = new THREE.BoxGeometry(0.2, 0.25, 0.2);
    const slotMat = new THREE.MeshStandardMaterial({
      color: keyColors[idx],
      emissive: keyColors[idx],
      emissiveIntensity: 0.2,
    });
    const slot = new THREE.Mesh(slotGeo, slotMat);
    slot.name = `KeySlot_${idx}`;
    slot.position.y = 1.35;
    ped.add(slot);

    pedestals.push(ped);
    group.add(ped);
  });

  // Central Obelisk / Core Crystal
  const coreBaseGeo = new THREE.CylinderGeometry(0.9, 1.1, 1.4, 8);
  const coreBase = new THREE.Mesh(coreBaseGeo, stoneMat);
  coreBase.position.y = 0.9;
  coreBase.castShadow = true;
  group.add(coreBase);

  const crystalGeo = new THREE.OctahedronGeometry(0.65, 0);
  const crystal = new THREE.Mesh(crystalGeo, runeInactiveMat);
  crystal.position.y = 2.1;
  crystal.name = 'CenterCrystal';
  group.add(crystal);

  const setSolved = (solved: boolean) => {
    crystal.material = solved ? runeActiveMat : runeInactiveMat;
  };

  return { group, pedestals, centerCrystal: crystal, setSolved };
}

/**
 * Grand Ancient Escape Gate
 */
export function createEscapeGate(): {
  group: THREE.Group;
  portalMesh: THREE.Mesh;
  runeSockets: THREE.Mesh[];
  setUnlocked: (unlocked: boolean, progress: number) => void;
} {
  const group = new THREE.Group();
  group.name = 'GrandEscapeGate';

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x5d6d7e,
    roughness: 0.85,
    metalness: 0.15,
  });

  const pillarLGeo = new THREE.BoxGeometry(1.6, 9.0, 1.8);
  const pillarL = new THREE.Mesh(pillarLGeo, stoneMat);
  pillarL.position.set(-3.2, 4.5, 0);
  pillarL.castShadow = true;
  pillarL.receiveShadow = true;

  const pillarRGeo = new THREE.BoxGeometry(1.6, 9.0, 1.8);
  const pillarR = new THREE.Mesh(pillarRGeo, stoneMat);
  pillarR.position.set(3.2, 4.5, 0);
  pillarR.castShadow = true;
  pillarR.receiveShadow = true;

  // Lintel arch atop pillars
  const lintelGeo = new THREE.BoxGeometry(8.8, 1.8, 2.2);
  const lintel = new THREE.Mesh(lintelGeo, stoneMat);
  lintel.position.set(0, 9.2, 0);
  lintel.castShadow = true;
  group.add(pillarL, pillarR, lintel);

  // 3 Glowing Rune Sockets on the lintel
  const runeSockets: THREE.Mesh[] = [];
  const socketColors = [0xf1c40f, 0x3498db, 0x2ecc71];
  for (let i = 0; i < 3; i++) {
    const sGeo = new THREE.OctahedronGeometry(0.35, 0);
    const sMat = new THREE.MeshStandardMaterial({
      color: 0x2c3e50,
      emissive: socketColors[i],
      emissiveIntensity: 0.1,
    });
    const socket = new THREE.Mesh(sGeo, sMat);
    socket.position.set((i - 1) * 1.8, 9.2, 1.15);
    runeSockets.push(socket);
    group.add(socket);
  }

  // Energy Portal Barrier inside Gate
  const portalGeo = new THREE.PlaneGeometry(5.0, 8.0);
  const portalMat = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x00a8ff,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide,
  });
  const portalMesh = new THREE.Mesh(portalGeo, portalMat);
  portalMesh.position.set(0, 4.2, 0);
  group.add(portalMesh);

  // Portal Rune Circle
  const runeCircleGeo = new THREE.RingGeometry(1.8, 2.2, 32);
  const runeCircleMat = new THREE.MeshBasicMaterial({
    color: 0x64b5f6,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.4,
  });
  const runeCircle = new THREE.Mesh(runeCircleGeo, runeCircleMat);
  runeCircle.position.set(0, 4.5, 0.05);
  group.add(runeCircle);

  const setUnlocked = (unlocked: boolean, progress: number) => {
    if (unlocked) {
      portalMat.opacity = THREE.MathUtils.lerp(0.3, 0.85, progress);
      portalMat.emissiveIntensity = THREE.MathUtils.lerp(0.4, 2.5, progress);
      runeCircleMat.opacity = THREE.MathUtils.lerp(0.4, 1.0, progress);
      runeSockets.forEach((s) => {
        (s.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.0;
      });
    }
  };

  return { group, portalMesh, runeSockets, setUnlocked };
}

/**
 * Sun Temple Ruins atop the North-East Hill
 */
export function createSunTempleRuins(): THREE.Group {
  const ruins = new THREE.Group();
  ruins.name = 'SunTempleRuins';

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0xdfba76, // Warm sandstone
    roughness: 0.8,
    metalness: 0.1,
  });

  // Raised stone terrace
  const platformGeo = new THREE.BoxGeometry(10, 0.8, 10);
  const platform = new THREE.Mesh(platformGeo, stoneMat);
  platform.position.y = 0.4;
  platform.receiveShadow = true;
  ruins.add(platform);

  // 4 Ruined Columns
  const colPositions = [
    [-3.8, -3.8], [3.8, -3.8],
    [-3.8, 3.8], [3.8, 3.8],
  ];
  colPositions.forEach(([cx, cz], idx) => {
    const colHeight = idx === 1 ? 2.5 : 4.5; // Broken column effect
    const colGeo = new THREE.CylinderGeometry(0.45, 0.5, colHeight, 8);
    const col = new THREE.Mesh(colGeo, stoneMat);
    col.position.set(cx, 0.8 + colHeight / 2, cz);
    col.castShadow = true;
    ruins.add(col);

    if (idx !== 1) {
      // Capital on top
      const capGeo = new THREE.BoxGeometry(1.2, 0.35, 1.2);
      const cap = new THREE.Mesh(capGeo, stoneMat);
      cap.position.set(cx, 0.8 + colHeight + 0.17, cz);
      cap.castShadow = true;
      ruins.add(cap);
    }
  });

  // Central Sun Altar Pedestal
  const altarGeo = new THREE.CylinderGeometry(0.8, 1.0, 1.2, 8);
  const altar = new THREE.Mesh(altarGeo, stoneMat);
  altar.position.set(0, 1.2, 0);
  altar.castShadow = true;
  ruins.add(altar);

  return ruins;
}

/**
 * Beach Campsite Decor (Starting point)
 */
export function createCampsiteDecor(): THREE.Group {
  const camp = new THREE.Group();
  camp.name = 'BeachCampsite';

  // Explorer Tent
  const tentMat = new THREE.MeshStandardMaterial({
    color: 0xe67e22,
    roughness: 0.9,
    side: THREE.DoubleSide,
  });
  const tentGeo = new THREE.ConeGeometry(2.2, 2.5, 4);
  tentGeo.rotateY(Math.PI / 4);
  const tent = new THREE.Mesh(tentGeo, tentMat);
  tent.position.set(-2, 1.25, 1);
  tent.castShadow = true;
  camp.add(tent);

  // Campfire with Firewood & Glowing Embers
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 });
  for (let i = 0; i < 4; i++) {
    const logGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.9, 5);
    logGeo.rotateZ(Math.PI / 3);
    logGeo.rotateY((i * Math.PI) / 2);
    const log = new THREE.Mesh(logGeo, woodMat);
    log.position.set(1.5, 0.15, 0.5);
    camp.add(log);
  }

  const emberMat = new THREE.MeshStandardMaterial({
    color: 0xff5722,
    emissive: 0xff3d00,
    emissiveIntensity: 1.5,
  });
  const emberGeo = new THREE.SphereGeometry(0.2, 6, 6);
  const ember = new THREE.Mesh(emberGeo, emberMat);
  ember.position.set(1.5, 0.2, 0.5);
  camp.add(ember);

  // Campfire warm light
  const fireLight = new THREE.PointLight(0xff7043, 1.2, 6);
  fireLight.position.set(1.5, 0.8, 0.5);
  camp.add(fireLight);

  // Wooden Supply Crate
  const crateMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.8 });
  const crateGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
  const crate = new THREE.Mesh(crateGeo, crateMat);
  crate.position.set(0.2, 0.4, 2.5);
  crate.rotation.y = 0.3;
  crate.castShadow = true;
  camp.add(crate);

  // Welcome Explorer Signpost
  const signPostGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.6, 6);
  const post = new THREE.Mesh(signPostGeo, woodMat);
  post.position.set(3.0, 0.8, -1.0);
  camp.add(post);

  const boardGeo = new THREE.BoxGeometry(1.2, 0.4, 0.06);
  const board = new THREE.Mesh(boardGeo, crateMat);
  board.position.set(3.0, 1.35, -1.0);
  camp.add(board);

  return camp;
}

/**
 * Procedural Ancient Treasure Chest with Hinged Animated Lid
 */
export interface TreasureChestInstance {
  group: THREE.Group;
  lid: THREE.Group;
  goldGlow: THREE.PointLight;
  isOpen: boolean;
  openProgress: number;
  open: () => void;
  update: (dt: number) => void;
}

export function createTreasureChest(): TreasureChestInstance {
  const root = new THREE.Group();
  root.name = 'TreasureChest';

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x4e342e,
    roughness: 0.8,
    metalness: 0.1,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xd4ac0d, // Antique brass
    roughness: 0.35,
    metalness: 0.85,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf1c40f,
    emissive: 0xf39c12,
    emissiveIntensity: 0.6,
    roughness: 0.2,
    metalness: 0.9,
  });

  // Main Chest Box Base (w: 1.1, h: 0.55, d: 0.75)
  const baseGeo = new THREE.BoxGeometry(1.1, 0.55, 0.75);
  const baseMesh = new THREE.Mesh(baseGeo, woodMat);
  baseMesh.position.y = 0.275;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  root.add(baseMesh);

  // Metal Corner Straps
  const strapLGeo = new THREE.BoxGeometry(0.08, 0.56, 0.77);
  const strapL = new THREE.Mesh(strapLGeo, metalMat);
  strapL.position.set(-0.48, 0.275, 0);
  const strapR = new THREE.Mesh(strapLGeo, metalMat);
  strapR.position.set(0.48, 0.275, 0);
  root.add(strapL, strapR);

  // Front Lock Latch
  const lockGeo = new THREE.BoxGeometry(0.18, 0.2, 0.06);
  const lockMesh = new THREE.Mesh(lockGeo, metalMat);
  lockMesh.position.set(0, 0.42, 0.39);
  root.add(lockMesh);

  // Gold coins inside chest (revealed when lid opens)
  const goldPileGeo = new THREE.CylinderGeometry(0.35, 0.48, 0.22, 8);
  const goldPile = new THREE.Mesh(goldPileGeo, goldMat);
  goldPile.position.set(0, 0.45, 0);
  goldPile.visible = false;
  root.add(goldPile);

  // Golden interior point light
  const goldGlow = new THREE.PointLight(0xffd700, 0, 4);
  goldGlow.position.set(0, 0.65, 0);
  root.add(goldGlow);

  // Hinged Lid Group (Pivot placed at back upper edge: y=0.55, z=-0.375)
  const lid = new THREE.Group();
  lid.position.set(0, 0.55, -0.375);

  // Arched Lid Top
  const lidGeo = new THREE.CylinderGeometry(0.38, 0.38, 1.12, 12, 1, false, 0, Math.PI);
  lidGeo.rotateZ(Math.PI / 2);
  const lidMesh = new THREE.Mesh(lidGeo, woodMat);
  lidMesh.position.set(0, 0, 0.375);
  lidMesh.castShadow = true;
  lid.add(lidMesh);

  // Metal Bands on Lid
  const lidBandGeo = new THREE.CylinderGeometry(0.39, 0.39, 0.08, 12, 1, false, 0, Math.PI);
  lidBandGeo.rotateZ(Math.PI / 2);
  const lidBandL = new THREE.Mesh(lidBandGeo, metalMat);
  lidBandL.position.set(-0.48, 0, 0.375);
  const lidBandR = new THREE.Mesh(lidBandGeo, metalMat);
  lidBandR.position.set(0.48, 0, 0.375);
  lid.add(lidBandL, lidBandR);

  root.add(lid);

  let isOpen = false;
  let openProgress = 0;

  const open = () => {
    isOpen = true;
    goldPile.visible = true;
  };

  const update = (dt: number) => {
    if (isOpen && openProgress < 1.0) {
      openProgress = Math.min(1.0, openProgress + dt * 2.2);
      // Hinge lid open to ~105 degrees (-1.85 rad)
      lid.rotation.x = -openProgress * 1.85;
      goldGlow.intensity = openProgress * 1.8;
    }
  };

  return {
    group: root,
    lid,
    goldGlow,
    isOpen,
    openProgress,
    open,
    update,
  };
}

/**
 * Collectible Ancient Gold Doubloon Coin
 */
export function createCoinItem(): THREE.Group {
  const coinGroup = new THREE.Group();
  coinGroup.name = 'GoldCoin';

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf39c12,
    emissive: 0xd4ac0d,
    emissiveIntensity: 0.35,
    roughness: 0.25,
    metalness: 0.9,
  });

  // Coin disk
  const coinGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.06, 12);
  coinGeo.rotateZ(Math.PI / 2);
  const coinMesh = new THREE.Mesh(coinGeo, goldMat);
  coinMesh.castShadow = true;
  coinGroup.add(coinMesh);

  // Sparkling star emblem on face
  const starGeo = new THREE.OctahedronGeometry(0.1, 0);
  const starMat = new THREE.MeshStandardMaterial({
    color: 0xfff2a3,
    emissive: 0xffd700,
    emissiveIntensity: 0.8,
  });
  const starMesh = new THREE.Mesh(starGeo, starMat);
  coinGroup.add(starMesh);

  // Soft sparkle light
  const light = new THREE.PointLight(0xffd700, 0.6, 2.5);
  coinGroup.add(light);

  return coinGroup;
}

/**
 * Ancient Bouncy Launch Pad
 */
export function createBouncePad(): THREE.Group {
  const pad = new THREE.Group();
  pad.name = 'AncientBouncePad';

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x7f8c8d,
    roughness: 0.85,
    metalness: 0.1,
  });

  const runeMat = new THREE.MeshStandardMaterial({
    color: 0x1abc9c,
    emissive: 0x16a085,
    emissiveIntensity: 1.2,
    roughness: 0.3,
  });

  // Outer carved stone ring
  const ringGeo = new THREE.CylinderGeometry(1.4, 1.6, 0.25, 16);
  const ring = new THREE.Mesh(ringGeo, stoneMat);
  ring.position.y = 0.125;
  ring.receiveShadow = true;
  pad.add(ring);

  // Inner energy trampoline membrane
  const energyGeo = new THREE.CylinderGeometry(1.05, 1.05, 0.08, 16);
  const energy = new THREE.Mesh(energyGeo, runeMat);
  energy.position.y = 0.22;
  pad.add(energy);

  // Rune ring glow
  const runeLight = new THREE.PointLight(0x1abc9c, 1.2, 4.5);
  runeLight.position.y = 0.5;
  pad.add(runeLight);

  return pad;
}

/**
 * Procedural Instanced Grass Tufts (Lush, stylized, 0-lag for mobile)
 */
export function createInstancedGrass(
  count: number,
  isObstacle: (x: number, z: number) => boolean
): { mesh: THREE.InstancedMesh; updateWind: (time: number, windStrength: number) => void } {
  // Simple 3-blade crossed grass tuft
  const bladeGeo = new THREE.PlaneGeometry(0.35, 0.65);
  bladeGeo.translate(0, 0.325, 0);

  const tuftGeo = new THREE.BufferGeometry();
  // Combine 3 crossed vertical planes for full 3D silhouette with tiny vertex count
  const p1 = bladeGeo.clone();
  const p2 = bladeGeo.clone();
  p2.rotateY(Math.PI / 3);
  const p3 = bladeGeo.clone();
  p3.rotateY((Math.PI * 2) / 3);

  // Merge geometries
  const mergedGeo = new THREE.BoxGeometry(0.08, 0.45, 0.08); // fallback simple blade or cone
  const coneGeo = new THREE.ConeGeometry(0.25, 0.65, 4);
  coneGeo.translate(0, 0.325, 0);

  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x48bb78,
    roughness: 0.75,
    metalness: 0.05,
    flatShading: true,
  });

  const instancedMesh = new THREE.InstancedMesh(coneGeo, grassMat, count);
  instancedMesh.castShadow = false;
  instancedMesh.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const dummyColor = new THREE.Color();
  const baseColors = [0x38a169, 0x48bb78, 0x2f855a, 0x68d391];

  let placed = 0;
  let attempts = 0;
  const maxRadius = 42;

  while (placed < count && attempts < count * 8) {
    attempts++;
    const angle = Math.random() * Math.PI * 2;
    const r = 3 + Math.sqrt(Math.random()) * maxRadius;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const y = getIslandHeight(x, z);

    // Only place on lush ground above water (y > 0.6) and away from paths/campsite/altar/gate
    if (y > 0.7 && !isObstacle(x, z)) {
      const scale = 0.65 + Math.random() * 0.7;
      dummy.position.set(x, y, z);
      dummy.rotation.set(
        (Math.random() - 0.5) * 0.15,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 0.15
      );
      dummy.scale.set(scale, scale * (0.8 + Math.random() * 0.5), scale);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(placed, dummy.matrix);

      // Varied lush green shades
      const colorHex = baseColors[Math.floor(Math.random() * baseColors.length)];
      dummyColor.set(colorHex);
      instancedMesh.setColorAt(placed, dummyColor);

      placed++;
    }
  }

  instancedMesh.instanceMatrix.needsUpdate = true;
  if (instancedMesh.instanceColor) {
    instancedMesh.instanceColor.needsUpdate = true;
  }
  instancedMesh.count = placed;

  const updateWind = (time: number, windStrength: number) => {
    // Subtle sway via material or geometry if needed
    grassMat.color.setRGB(
      0.22 + Math.sin(time * 0.5) * 0.02 * windStrength,
      0.65 + Math.cos(time * 0.5) * 0.03 * windStrength,
      0.35
    );
  };

  return { mesh: instancedMesh, updateWind };
}

/**
 * Procedural Instanced Wildflowers (Meadows of vibrant tropical blooms)
 */
export function createInstancedFlowers(
  count: number,
  isObstacle: (x: number, z: number) => boolean
): THREE.InstancedMesh {
  // Low-poly 5-sided flower head
  const flowerGeo = new THREE.CylinderGeometry(0.18, 0.05, 0.12, 5);
  flowerGeo.translate(0, 0.35, 0);

  const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.35, 3);
  stemGeo.translate(0, 0.175, 0);

  // Group stem + bloom into single merged buffer for 1 draw call
  const flowerMat = new THREE.MeshStandardMaterial({
    roughness: 0.6,
    metalness: 0.1,
    flatShading: true,
  });

  const instancedMesh = new THREE.InstancedMesh(flowerGeo, flowerMat, count);
  const dummy = new THREE.Object3D();
  const flowerColors = [
    new THREE.Color(0xf6ad55), // Warm marigold orange
    new THREE.Color(0xf6e05e), // Bright golden yellow
    new THREE.Color(0xf687b3), // Coral pink
    new THREE.Color(0x63b3ed), // Sky cyan blue
    new THREE.Color(0xb794f4), // Lavender purple
    new THREE.Color(0xffffff), // Mountain white daisy
  ];

  let placed = 0;
  let attempts = 0;

  while (placed < count && attempts < count * 9) {
    attempts++;
    const angle = Math.random() * Math.PI * 2;
    const r = 4 + Math.sqrt(Math.random()) * 40;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const y = getIslandHeight(x, z);

    if (y > 0.8 && !isObstacle(x, z)) {
      const scale = 0.8 + Math.random() * 0.5;
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(placed, dummy.matrix);

      const color = flowerColors[Math.floor(Math.random() * flowerColors.length)];
      instancedMesh.setColorAt(placed, color);

      placed++;
    }
  }

  instancedMesh.instanceMatrix.needsUpdate = true;
  if (instancedMesh.instanceColor) {
    instancedMesh.instanceColor.needsUpdate = true;
  }
  instancedMesh.count = placed;

  return instancedMesh;
}

/**
 * Stylized Shrub / Bush
 */
export function createBush(scale = 1.0): THREE.Group {
  const bush = new THREE.Group();
  bush.name = 'StylizedBush';

  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x276749,
    roughness: 0.8,
    flatShading: true,
  });

  // 3-4 clustered spheres forming a plump, stylized leafy bush
  const spheres = [
    { x: 0, y: 0.35, z: 0, r: 0.45 },
    { x: 0.22, y: 0.3, z: 0.15, r: 0.35 },
    { x: -0.2, y: 0.28, z: -0.12, r: 0.32 },
    { x: 0.05, y: 0.52, z: -0.05, r: 0.3 },
  ];

  spheres.forEach((s) => {
    const geo = new THREE.DodecahedronGeometry(s.r * scale, 1);
    const m = new THREE.Mesh(geo, leafMat);
    m.position.set(s.x * scale, s.y * scale, s.z * scale);
    m.castShadow = true;
    m.receiveShadow = true;
    bush.add(m);
  });

  return bush;
}

/**
 * Night Starfield Particle Dome
 */
export function createStarfield(): { points: THREE.Points; material: THREE.PointsMaterial } {
  const starCount = 260;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    // Upper hemisphere
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(0.08 + Math.random() * 0.92);
    const radius = 130 + Math.random() * 30;

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi);
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

    // Warm white to soft celestial cyan stars
    const isTinted = Math.random() > 0.6;
    colors[i * 3] = isTinted ? 0.8 : 1.0;
    colors[i * 3 + 1] = isTinted ? 0.9 : 1.0;
    colors[i * 3 + 2] = 1.0;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 1.6,
    vertexColors: true,
    transparent: true,
    opacity: 0.0, // Fades in dynamically at dusk/night
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  return { points, material };
}

/**
 * Lightweight Rain Particle System (Centers dynamically around player)
 */
export function createRainSystem(count = 450): {
  points: THREE.Points;
  update: (playerPos: THREE.Vector3, dt: number) => void;
  setVisible: (visible: boolean) => void;
} {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count);
  const range = 32;

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * range;
    positions[i * 3 + 1] = Math.random() * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * range;
    velocities[i] = 16 + Math.random() * 10;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: 0x93c5fd,
    size: 0.16,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });

  const points = new THREE.Points(geo, mat);
  points.visible = false;

  const update = (playerPos: THREE.Vector3, dt: number) => {
    if (!points.visible) return;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const array = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      let y = array[i * 3 + 1] - velocities[i] * dt;
      if (y < 0) {
        y = 18 + Math.random() * 4;
        array[i * 3] = playerPos.x + (Math.random() - 0.5) * range;
        array[i * 3 + 2] = playerPos.z + (Math.random() - 0.5) * range;
      }
      array[i * 3 + 1] = y;
    }
    posAttr.needsUpdate = true;
  };

  const setVisible = (v: boolean) => {
    points.visible = v;
  };

  return { points, update, setVisible };
}

/**
 * Gentle Wind Drifting Leaf / Petal System
 */
export function createWindLeavesSystem(count = 50): {
  points: THREE.Points;
  update: (playerPos: THREE.Vector3, dt: number, time: number) => void;
  setVisible: (visible: boolean) => void;
} {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  const range = 36;

  const leafPalette = [
    new THREE.Color(0x68d391), // Emerald leaf
    new THREE.Color(0xf6ad55), // Golden petal
    new THREE.Color(0xfbb6ce), // Pink petal
  ];

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * range;
    positions[i * 3 + 1] = 1 + Math.random() * 8;
    positions[i * 3 + 2] = (Math.random() - 0.5) * range;
    speeds[i] = 3.5 + Math.random() * 3.0;

    const col = leafPalette[Math.floor(Math.random() * leafPalette.length)];
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.32,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  });

  const points = new THREE.Points(geo, mat);
  points.visible = false;

  const update = (playerPos: THREE.Vector3, dt: number, time: number) => {
    if (!points.visible) return;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const array = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      // Drift east-north-east with sine wave fluttering
      array[i * 3] += speeds[i] * dt;
      array[i * 3 + 1] -= Math.sin(time * 2 + i) * 0.015 + dt * 0.4;
      array[i * 3 + 2] += Math.cos(time * 1.5 + i) * 0.02 * speeds[i];

      // Respawn if too far from player or ground hit
      if (
        array[i * 3] > playerPos.x + range / 2 ||
        array[i * 3 + 1] < 0.2
      ) {
        array[i * 3] = playerPos.x - range / 2 + (Math.random() - 0.5) * 6;
        array[i * 3 + 1] = 3 + Math.random() * 7;
        array[i * 3 + 2] = playerPos.z + (Math.random() - 0.5) * range;
      }
    }
    posAttr.needsUpdate = true;
  };

  const setVisible = (v: boolean) => {
    points.visible = v;
  };

  return { points, update, setVisible };
}

/**
 * Bioluminescent Magical Flora for Sacred Grove & Night Atmosphere
 */
export function createBioluminescentFlora(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'BioluminescentFlora';

  const mushroomMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 1.4,
    roughness: 0.3,
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    roughness: 0.8,
  });

  // Cluster of glowing magical mushrooms near Sacred Grove
  const locations = [
    { x: 19, z: 19.5, s: 0.3 },
    { x: 18.5, z: 20, s: 0.22 },
    { x: 19.5, z: 20.3, s: 0.26 },
    { x: -13, z: -11, s: 0.28 }, // Waterfall grotto
    { x: -11.5, z: -9.5, s: 0.24 },
  ];

  locations.forEach((loc) => {
    const y = getIslandHeight(loc.x, loc.z);
    const mGroup = new THREE.Group();
    mGroup.position.set(loc.x, y, loc.z);

    // Stem
    const stemGeo = new THREE.CylinderGeometry(0.04 * loc.s, 0.06 * loc.s, 0.3 * loc.s, 6);
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.15 * loc.s;
    mGroup.add(stem);

    // Glowing Cap
    const capGeo = new THREE.SphereGeometry(0.18 * loc.s, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const cap = new THREE.Mesh(capGeo, mushroomMat);
    cap.position.y = 0.28 * loc.s;
    mGroup.add(cap);

    // Soft point light
    const pLight = new THREE.PointLight(0x38bdf8, 0.6, 2.5);
    pLight.position.y = 0.35 * loc.s;
    mGroup.add(pLight);

    group.add(mGroup);
  });

  return group;
}

/**
 * 3D Moving Platform with Anti-Gravity Core
 */
export function createMovingPlatform(width = 3.4, depth = 3.4): THREE.Group {
  const group = new THREE.Group();
  group.name = 'MovingPlatform';

  // Base stone platform slab
  const slabGeo = new THREE.BoxGeometry(width, 0.45, depth);
  const slabMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.65,
    metalness: 0.2,
  });
  const slab = new THREE.Mesh(slabGeo, slabMat);
  slab.castShadow = true;
  slab.receiveShadow = true;
  group.add(slab);

  // Golden Rune Edges
  const edgeGeo = new THREE.BoxGeometry(width + 0.1, 0.1, depth + 0.1);
  const edgeMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.6,
    roughness: 0.3,
  });
  const edge = new THREE.Mesh(edgeGeo, edgeMat);
  group.add(edge);

  // Anti-gravity glowing core underneath
  const coreGeo = new THREE.OctahedronGeometry(0.5, 0);
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 1.5,
    roughness: 0.2,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.y = -0.4;
  group.add(core);

  // Soft glow point light
  const pLight = new THREE.PointLight(0x38bdf8, 0.8, 4);
  pLight.position.y = -0.5;
  group.add(pLight);

  return group;
}

/**
 * 3D Rotating Hazard Obstacle Beam
 */
export function createRotatingObstacle(beamLength = 6.2): THREE.Group {
  const group = new THREE.Group();
  group.name = 'RotatingObstacle';

  // Central Stone Base Pillar
  const baseGeo = new THREE.CylinderGeometry(0.5, 0.7, 1.8, 12);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.7,
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.9;
  base.castShadow = true;
  group.add(base);

  // Rotating Beam Shaft
  const beamGroup = new THREE.Group();
  beamGroup.name = 'BeamShaft';
  beamGroup.position.y = 1.4;

  const logGeo = new THREE.CylinderGeometry(0.25, 0.25, beamLength, 8);
  const logMat = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.8,
  });
  const log = new THREE.Mesh(logGeo, logMat);
  log.rotation.z = Math.PI * 0.5;
  log.castShadow = true;
  beamGroup.add(log);

  // Glowing Warning Crystal Tips
  const tipGeo = new THREE.SphereGeometry(0.35, 8, 8);
  const tipMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xd97706,
    emissiveIntensity: 1.2,
  });

  const tip1 = new THREE.Mesh(tipGeo, tipMat);
  tip1.position.x = beamLength * 0.5;
  beamGroup.add(tip1);

  const tip2 = new THREE.Mesh(tipGeo, tipMat);
  tip2.position.x = -beamLength * 0.5;
  beamGroup.add(tip2);

  group.add(beamGroup);

  return group;
}

/**
 * 3D Interactive Puzzle Switch Lever
 */
export interface PuzzleSwitchInstance {
  group: THREE.Group;
  handle: THREE.Group;
  crystal: THREE.Mesh;
  light: THREE.PointLight;
  activated: boolean;
  setActivated: (active: boolean) => void;
}

export function createPuzzleSwitchLever(label: string): PuzzleSwitchInstance {
  const group = new THREE.Group();
  group.name = `SwitchLever_${label}`;

  // Pedestal
  const pedGeo = new THREE.CylinderGeometry(0.4, 0.55, 0.9, 8);
  const pedMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 });
  const ped = new THREE.Mesh(pedGeo, pedMat);
  ped.position.y = 0.45;
  ped.castShadow = true;
  group.add(ped);

  // Lever Handle Pivot
  const handle = new THREE.Group();
  handle.position.set(0, 0.9, 0);

  const stickGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.8, 8);
  const stickMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });
  const stick = new THREE.Mesh(stickGeo, stickMat);
  stick.position.y = 0.4;
  handle.add(stick);

  const knobGeo = new THREE.SphereGeometry(0.14, 8, 8);
  const knobMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 });
  const knob = new THREE.Mesh(knobGeo, knobMat);
  knob.position.y = 0.8;
  handle.add(knob);

  handle.rotation.z = -0.4; // Default unswitched position
  group.add(handle);

  // Status Indicator Crystal
  const crystalGeo = new THREE.OctahedronGeometry(0.2, 0);
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xb91c1c,
    emissiveIntensity: 0.8,
  });
  const crystal = new THREE.Mesh(crystalGeo, crystalMat);
  crystal.position.set(0, 1.15, 0);
  group.add(crystal);

  const light = new THREE.PointLight(0xef4444, 0.5, 3);
  light.position.set(0, 1.2, 0);
  group.add(light);

  let isActivated = false;

  const setActivated = (active: boolean) => {
    isActivated = active;
    handle.rotation.z = active ? 0.4 : -0.4;
    if (active) {
      crystalMat.color.setHex(0x10b981);
      crystalMat.emissive.setHex(0x059669);
      crystalMat.emissiveIntensity = 1.6;
      light.color.setHex(0x10b981);
      light.intensity = 1.2;
    } else {
      crystalMat.color.setHex(0xef4444);
      crystalMat.emissive.setHex(0xb91c1c);
      crystalMat.emissiveIntensity = 0.8;
      light.color.setHex(0xef4444);
      light.intensity = 0.5;
    }
  };

  return { group, handle, crystal, light, activated: isActivated, setActivated };
}

/**
 * 3D Symbol Matching Pillar (Pillar A)
 */
export function createSymbolPillar(pillarId: string): THREE.Group {
  const group = new THREE.Group();
  group.name = `SymbolPillar_${pillarId}`;

  // Base stone pillar
  const pillarGeo = new THREE.CylinderGeometry(0.55, 0.65, 2.4, 8);
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
  const pillar = new THREE.Mesh(pillarGeo, pillarMat);
  pillar.position.y = 1.2;
  pillar.castShadow = true;
  group.add(pillar);

  // Rotating Symbol Ring Disk
  const diskGeo = new THREE.CylinderGeometry(0.68, 0.68, 0.6, 12);
  const diskMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4, metalness: 0.3 });
  const disk = new THREE.Mesh(diskGeo, diskMat);
  disk.name = 'SymbolDisk';
  disk.position.y = 1.4;
  group.add(disk);

  // Solar Emblem Top Cap
  const capGeo = new THREE.SphereGeometry(0.4, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const capMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.8 });
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.position.y = 2.4;
  group.add(cap);

  const light = new THREE.PointLight(0x0ea5e9, 0.8, 3.5);
  light.position.y = 1.5;
  group.add(light);

  return group;
}

/**
 * 3D Ancient Rune Dial Altar (Pillar C)
 */
export function createRuneDialAltar(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'RuneDialAltar';

  // Base Pedestal
  const baseGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.7, 16);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.35;
  base.castShadow = true;
  group.add(base);

  // Outer Ring
  const outerGeo = new THREE.TorusGeometry(1.3, 0.12, 8, 24);
  const ringMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, emissiveIntensity: 0.9 });
  const outerRing = new THREE.Mesh(outerGeo, ringMat);
  outerRing.rotation.x = Math.PI * 0.5;
  outerRing.position.y = 0.72;
  group.add(outerRing);

  // Middle Ring
  const midGeo = new THREE.TorusGeometry(0.9, 0.1, 8, 24);
  const midRing = new THREE.Mesh(midGeo, ringMat);
  midRing.rotation.x = Math.PI * 0.5;
  midRing.position.y = 0.75;
  group.add(midRing);

  // Inner Core Gem
  const gemGeo = new THREE.OctahedronGeometry(0.35, 0);
  const gemMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0x9333ea, emissiveIntensity: 1.5 });
  const gem = new THREE.Mesh(gemGeo, gemMat);
  gem.position.y = 1.1;
  group.add(gem);

  const pLight = new THREE.PointLight(0xa855f7, 1.2, 5);
  pLight.position.y = 1.2;
  group.add(pLight);

  return group;
}

/**
 * 3D Survival Energy Crystal
 */
export function createSurvivalCrystal(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'SurvivalCrystal';

  const crystalGeo = new THREE.OctahedronGeometry(0.45, 0);
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: 0x0891b2,
    emissiveIntensity: 1.4,
    roughness: 0.2,
    metalness: 0.1,
  });
  const crystal = new THREE.Mesh(crystalGeo, crystalMat);
  crystal.name = 'CrystalMesh';
  crystal.position.y = 0.8;
  crystal.castShadow = true;
  group.add(crystal);

  const light = new THREE.PointLight(0x06b6d4, 1.0, 4);
  light.position.y = 0.8;
  group.add(light);

  return group;
}

/**
 * 3D Checkpoint Archway
 */
export function createCheckpointArch(label: string): THREE.Group {
  const group = new THREE.Group();
  group.name = `CheckpointArch_${label}`;

  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
  const pillarGeo = new THREE.CylinderGeometry(0.35, 0.45, 3.2, 8);

  const p1 = new THREE.Mesh(pillarGeo, stoneMat);
  p1.position.set(-1.8, 1.6, 0);
  p1.castShadow = true;
  group.add(p1);

  const p2 = new THREE.Mesh(pillarGeo, stoneMat);
  p2.position.set(1.8, 1.6, 0);
  p2.castShadow = true;
  group.add(p2);

  const archTopGeo = new THREE.BoxGeometry(4.2, 0.4, 0.5);
  const archTop = new THREE.Mesh(archTopGeo, stoneMat);
  archTop.position.set(0, 3.2, 0);
  archTop.castShadow = true;
  group.add(archTop);

  // Glowing Checkpoint Ring
  const ringGeo = new THREE.TorusGeometry(1.6, 0.08, 8, 20);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 1.2,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.set(0, 1.6, 0);
  group.add(ring);

  const pLight = new THREE.PointLight(0x38bdf8, 1.0, 5);
  pLight.position.set(0, 1.6, 0);
  group.add(pLight);

  return group;
}

/**
 * 3D Finish Line Archway
 */
export function createFinishLineArch(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'FinishLineArch';

  const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.3 });
  const pGeo = new THREE.CylinderGeometry(0.4, 0.5, 3.8, 12);

  const p1 = new THREE.Mesh(pGeo, goldMat);
  p1.position.set(-2.2, 1.9, 0);
  p1.castShadow = true;
  group.add(p1);

  const p2 = new THREE.Mesh(pGeo, goldMat);
  p2.position.set(2.2, 1.9, 0);
  p2.castShadow = true;
  group.add(p2);

  const archGeo = new THREE.BoxGeometry(5.0, 0.5, 0.6);
  const arch = new THREE.Mesh(archGeo, goldMat);
  arch.position.set(0, 3.8, 0);
  arch.castShadow = true;
  group.add(arch);

  // Floating Crown Gem
  const gemGeo = new THREE.OctahedronGeometry(0.45, 0);
  const gemMat = new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xdb2777, emissiveIntensity: 1.6 });
  const gem = new THREE.Mesh(gemGeo, gemMat);
  gem.position.set(0, 4.6, 0);
  group.add(gem);

  const light = new THREE.PointLight(0xf59e0b, 1.8, 8);
  light.position.set(0, 2.5, 0);
  group.add(light);

  return group;
}




/**
 * Procedural PBR Canvas Texture Generators (0-dependency, razor sharp)
 */
export function createCobblestoneCanvasTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#b3a280';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#5c4e36';
    ctx.lineWidth = 4;
    const cols = 16;
    const rows = 16;
    const cw = 512 / cols;
    const rh = 512 / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cw + ((r % 2) * cw * 0.5);
        const y = r * rh;
        ctx.fillStyle = (r + c) % 2 === 0 ? '#bfae8a' : '#a89874';
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, cw - 4, rh - 4, 6);
        ctx.fill();
        ctx.stroke();
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Real-world Stone Cottage with Wall Thickness, Windows, Timber Roof, and Usable Doorway
 */
export function createStoneCottage(width = 6.0, height = 3.5, depth = 5.0): THREE.Group {
  const building = new THREE.Group();
  building.name = 'StoneCottage';

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8, // Slate stone
    roughness: 0.85,
    metalness: 0.1,
  });

  const timberMat = new THREE.MeshStandardMaterial({
    color: 0x78350f, // Dark timber wood
    roughness: 0.75,
    metalness: 0.05,
  });

  const roofMat = new THREE.MeshStandardMaterial({
    color: 0xb91c1c, // Terracotta roof tiles
    roughness: 0.7,
    metalness: 0.1,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xbae6fd,
    transmission: 0.85,
    roughness: 0.1,
    ior: 1.5,
    thickness: 0.2,
    transparent: true,
    opacity: 0.9,
  });

  // Base stone foundation slab
  const foundGeo = new THREE.BoxGeometry(width + 0.4, 0.4, depth + 0.4);
  const found = new THREE.Mesh(foundGeo, wallMat);
  found.position.y = 0.2;
  found.receiveShadow = true;
  building.add(found);

  // Outer Walls with Doorway Opening
  const wallThick = 0.35;
  const h = height;

  // Back Wall (solid)
  const backWallGeo = new THREE.BoxGeometry(width, h, wallThick);
  const backWall = new THREE.Mesh(backWallGeo, wallMat);
  backWall.position.set(0, h * 0.5 + 0.4, -depth * 0.5 + wallThick * 0.5);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  building.add(backWall);

  // Left Wall (solid)
  const leftWallGeo = new THREE.BoxGeometry(wallThick, h, depth - wallThick * 2);
  const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
  leftWall.position.set(-width * 0.5 + wallThick * 0.5, h * 0.5 + 0.4, 0);
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  building.add(leftWall);

  // Right Wall (with Window cutout)
  const rightWallGeo = new THREE.BoxGeometry(wallThick, h, depth - wallThick * 2);
  const rightWall = new THREE.Mesh(rightWallGeo, wallMat);
  rightWall.position.set(width * 0.5 - wallThick * 0.5, h * 0.5 + 0.4, 0);
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  building.add(rightWall);

  // Front Wall (Split around 1.4m wide Usable Doorway at center)
  const doorWidth = 1.4;
  const sideWallWidth = (width - doorWidth) * 0.5;

  const frontWallLGeo = new THREE.BoxGeometry(sideWallWidth, h, wallThick);
  const frontWallL = new THREE.Mesh(frontWallLGeo, wallMat);
  frontWallL.position.set(-width * 0.5 + sideWallWidth * 0.5, h * 0.5 + 0.4, depth * 0.5 - wallThick * 0.5);
  frontWallL.castShadow = true;
  building.add(frontWallL);

  const frontWallRGeo = new THREE.BoxGeometry(sideWallWidth, h, wallThick);
  const frontWallR = new THREE.Mesh(frontWallRGeo, wallMat);
  frontWallR.position.set(width * 0.5 - sideWallWidth * 0.5, h * 0.5 + 0.4, depth * 0.5 - wallThick * 0.5);
  frontWallR.castShadow = true;
  building.add(frontWallR);

  // Lintel / Header over doorway
  const lintelGeo = new THREE.BoxGeometry(doorWidth + 0.2, 0.8, wallThick + 0.05);
  const lintel = new THREE.Mesh(lintelGeo, timberMat);
  lintel.position.set(0, h + 0.0, depth * 0.5 - wallThick * 0.5);
  lintel.castShadow = true;
  building.add(lintel);

  // Recessed Open Wooden Door
  const doorPanelGeo = new THREE.BoxGeometry(0.08, 2.3, 1.25);
  const doorPanel = new THREE.Mesh(doorPanelGeo, timberMat);
  doorPanel.position.set(-doorWidth * 0.45, 1.55, depth * 0.5 - wallThick * 0.5 - 0.5);
  doorPanel.rotation.y = Math.PI * 0.35; // Ajar open into room
  doorPanel.castShadow = true;
  building.add(doorPanel);

  // Timber Roof Gable & Overhang
  const roofGableGeo = new THREE.ConeGeometry(Math.hypot(width, depth) * 0.42, 2.2, 4);
  roofGableGeo.rotateY(Math.PI * 0.25);
  const roof = new THREE.Mesh(roofGableGeo, roofMat);
  roof.position.set(0, h + 1.5, 0);
  roof.scale.set(1.15, 1.0, 1.15);
  roof.castShadow = true;
  building.add(roof);

  // Glass Window with Timber Frame on Front Right Wall
  const winFrameGeo = new THREE.BoxGeometry(0.9, 1.1, 0.15);
  const winFrame = new THREE.Mesh(winFrameGeo, timberMat);
  winFrame.position.set(width * 0.25, 2.1, depth * 0.5 - 0.05);
  building.add(winFrame);

  const winGlassGeo = new THREE.PlaneGeometry(0.7, 0.9);
  const winGlass = new THREE.Mesh(winGlassGeo, glassMat);
  winGlass.position.set(width * 0.25, 2.1, depth * 0.5 + 0.02);
  building.add(winGlass);

  // Warm indoor lantern glowing through window & doorway
  const indoorLight = new THREE.PointLight(0xf59e0b, 1.2, 8);
  indoorLight.position.set(0, 2.2, 0);
  building.add(indoorLight);

  return building;
}

/**
 * Guard Watchtower with Deck, Ladder, & Torch Lantern
 */
export function createWatchtower(): THREE.Group {
  const tower = new THREE.Group();
  tower.name = 'GuardWatchtower';

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.8 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x3f2a1d, roughness: 0.9 });

  // 4 Thick Corner Posts
  const postPositions = [
    [-1.4, -1.4], [1.4, -1.4],
    [-1.4, 1.4], [1.4, 1.4],
  ];
  postPositions.forEach(([px, pz]) => {
    const postGeo = new THREE.CylinderGeometry(0.18, 0.24, 6.2, 6);
    const post = new THREE.Mesh(postGeo, woodMat);
    post.position.set(px, 3.1, pz);
    post.castShadow = true;
    tower.add(post);
  });

  // Cross Bracing Timber Beams
  const braceGeo = new THREE.CylinderGeometry(0.1, 0.1, 3.8, 6);
  const brace1 = new THREE.Mesh(braceGeo, woodMat);
  brace1.position.set(0, 2.2, 1.4);
  brace1.rotation.z = Math.PI * 0.25;
  tower.add(brace1);

  // Guard Deck Platform
  const deckGeo = new THREE.BoxGeometry(3.6, 0.25, 3.6);
  const deck = new THREE.Mesh(deckGeo, woodMat);
  deck.position.set(0, 4.5, 0);
  deck.castShadow = true;
  tower.add(deck);

  // Safety Railings around deck
  const railGeo = new THREE.BoxGeometry(3.6, 0.1, 0.1);
  const railF = new THREE.Mesh(railGeo, woodMat);
  railF.position.set(0, 5.3, 1.7);
  const railB = new THREE.Mesh(railGeo, woodMat);
  railB.position.set(0, 5.3, -1.7);
  tower.add(railF, railB);

  // Roof Canopy
  const roofGeo = new THREE.ConeGeometry(2.8, 1.6, 4);
  roofGeo.rotateY(Math.PI * 0.25);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.set(0, 6.8, 0);
  roof.castShadow = true;
  tower.add(roof);

  // Guard Torch / Lantern on deck
  const torchLight = new THREE.PointLight(0xff7700, 1.5, 12);
  torchLight.position.set(0, 5.2, 0);
  tower.add(torchLight);

  return tower;
}

/**
 * Merchant Wooden Supply Wagon
 */
export function createSupplyWagon(): THREE.Group {
  const wagon = new THREE.Group();
  wagon.name = 'SupplyWagon';

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
  const canvasMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.9 });

  // Main Wagon Bed Box
  const bedGeo = new THREE.BoxGeometry(1.8, 0.7, 3.2);
  const bed = new THREE.Mesh(bedGeo, woodMat);
  bed.position.y = 1.0;
  bed.castShadow = true;
  wagon.add(bed);

  // Arched Canvas Cover
  const coverGeo = new THREE.CylinderGeometry(0.95, 0.95, 3.2, 12, 1, false, 0, Math.PI);
  coverGeo.rotateZ(Math.PI * 0.5);
  coverGeo.rotateY(Math.PI * 0.5);
  const cover = new THREE.Mesh(coverGeo, canvasMat);
  cover.position.set(0, 1.35, 0);
  cover.castShadow = true;
  wagon.add(cover);

  // 4 Spoked Wheels
  const wheelPositions = [
    [-1.0, 0.55, -1.1], [1.0, 0.55, -1.1],
    [-1.0, 0.55, 1.1], [1.0, 0.55, 1.1],
  ];
  wheelPositions.forEach(([wx, wy, wz]) => {
    const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.12, 12);
    wheelGeo.rotateZ(Math.PI * 0.5);
    const wheel = new THREE.Mesh(wheelGeo, ironMat);
    wheel.position.set(wx, wy, wz);
    wheel.castShadow = true;
    wagon.add(wheel);
  });

  // Front Hitch Bar
  const hitchGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.8, 6);
  const hitch = new THREE.Mesh(hitchGeo, woodMat);
  hitch.rotation.x = Math.PI * 0.5;
  hitch.position.set(0, 0.4, 2.4);
  wagon.add(hitch);

  return wagon;
}

/**
 * Iron Streetlamp with Glass Lantern and Warm Light
 */
export function createStreetlamp(): THREE.Group {
  const lamp = new THREE.Group();
  lamp.name = 'IronStreetlamp';

  const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.25 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xfef08a, transmission: 0.8, roughness: 0.1 });

  // Base Pedestal
  const baseGeo = new THREE.CylinderGeometry(0.28, 0.35, 0.4, 8);
  const base = new THREE.Mesh(baseGeo, ironMat);
  base.position.y = 0.2;
  base.castShadow = true;
  lamp.add(base);

  // Pole Shaft
  const poleGeo = new THREE.CylinderGeometry(0.08, 0.12, 3.2, 8);
  const pole = new THREE.Mesh(poleGeo, ironMat);
  pole.position.y = 1.8;
  pole.castShadow = true;
  lamp.add(pole);

  // Ornate Lantern Housing
  const lanternGeo = new THREE.BoxGeometry(0.4, 0.5, 0.4);
  const lantern = new THREE.Mesh(lanternGeo, glassMat);
  lantern.position.y = 3.5;
  lamp.add(lantern);

  const capGeo = new THREE.ConeGeometry(0.35, 0.25, 4);
  capGeo.rotateY(Math.PI * 0.25);
  const cap = new THREE.Mesh(capGeo, ironMat);
  cap.position.y = 3.82;
  lamp.add(cap);

  // Point Light
  const pLight = new THREE.PointLight(0xf59e0b, 1.6, 12);
  pLight.position.y = 3.5;
  lamp.add(pLight);

  return lamp;
}

/**
 * Courtyard Park Bench
 */
export function createParkBench(): THREE.Group {
  const bench = new THREE.Group();
  bench.name = 'ParkBench';

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.75 });
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });

  // Cast iron legs
  const legGeo = new THREE.BoxGeometry(0.1, 0.6, 0.6);
  const legL = new THREE.Mesh(legGeo, ironMat);
  legL.position.set(-0.7, 0.3, 0);
  const legR = new THREE.Mesh(legGeo, ironMat);
  legR.position.set(0.7, 0.3, 0);
  bench.add(legL, legR);

  // Wooden slatted seat
  for (let i = 0; i < 3; i++) {
    const slatGeo = new THREE.BoxGeometry(1.6, 0.05, 0.14);
    const slat = new THREE.Mesh(slatGeo, woodMat);
    slat.position.set(0, 0.58, (i - 1) * 0.18);
    slat.castShadow = true;
    bench.add(slat);
  }

  // Backrest slats
  for (let i = 0; i < 2; i++) {
    const slatGeo = new THREE.BoxGeometry(1.6, 0.14, 0.05);
    const slat = new THREE.Mesh(slatGeo, woodMat);
    slat.position.set(0, 0.85 + i * 0.18, -0.22);
    slat.castShadow = true;
    bench.add(slat);
  }

  return bench;
}

/**
 * Dense Green Boxwood Hedge
 */
export function createHedge(length = 4.0): THREE.Group {
  const hedge = new THREE.Group();
  hedge.name = 'BoxwoodHedge';

  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x15803d,
    roughness: 0.85,
    metalness: 0.05,
    flatShading: true,
  });

  const geo = new THREE.BoxGeometry(0.8, 1.4, length);
  const mesh = new THREE.Mesh(geo, leafMat);
  mesh.position.y = 0.7;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  hedge.add(mesh);

  return hedge;
}

/**
 * Timber Fence Section
 */
export function createPerimeterFence(length = 5.0): THREE.Group {
  const fence = new THREE.Group();
  fence.name = 'PerimeterFence';

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });

  const numPosts = Math.max(2, Math.floor(length / 1.8));
  for (let i = 0; i < numPosts; i++) {
    const t = i / (numPosts - 1);
    const z = (t - 0.5) * length;

    const postGeo = new THREE.CylinderGeometry(0.08, 0.1, 1.3, 6);
    const post = new THREE.Mesh(postGeo, woodMat);
    post.position.set(0, 0.65, z);
    post.castShadow = true;
    fence.add(post);
  }

  // Cross rails
  const railGeo = new THREE.BoxGeometry(0.06, 0.08, length);
  const rail1 = new THREE.Mesh(railGeo, woodMat);
  rail1.position.set(0, 0.45, 0);
  const rail2 = new THREE.Mesh(railGeo, woodMat);
  rail2.position.set(0, 0.95, 0);
  fence.add(rail1, rail2);

  return fence;
}
