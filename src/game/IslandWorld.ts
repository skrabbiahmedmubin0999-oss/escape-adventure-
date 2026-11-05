import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { sound } from '../audio/soundSystem';
import {
  createAdventurerModel,
  createBridge,
  createCampsiteDecor,
  createEscapeGate,
  createIslandTerrain,
  createKeyItem,
  createRock,
  createRuneAltar,
  createSunTempleRuins,
  createSunTempleRuinsLOD,
  createTree,
  createWaterMesh,
  createTreasureChest,
  createCoinItem,
  createBouncePad,
  createInstancedGrass,
  createInstancedFlowers,
  createBush,
  createStarfield,
  createRainSystem,
  createWindLeavesSystem,
  createBioluminescentFlora,
  createMovingPlatform,
  createRotatingObstacle,
  createPuzzleSwitchLever,
  createSymbolPillar,
  createRuneDialAltar,
  createSurvivalCrystal,
  createCheckpointArch,
  createFinishLineArch,
  createStoneCottage,
  createStoneCottageLOD,
  createWatchtower,
  createWatchtowerLOD,
  createSupplyWagon,
  createSupplyWagonLOD,
  createStreetlamp,
  createParkBench,
  createHedge,
  createPerimeterFence,
  TreasureChestInstance,
  getIslandHeight,
  AdventurerCharacter,
} from './proceduralAssets';
import { GameMode, KeyType, QuestProgress, TimeOfDay, WeatherType, EnvironmentState, NotificationToast } from './types';
import { puzzleSystem } from './puzzleSystem';
import { obstacleSystem } from './obstacleSystem';
import { survivalSystem } from './survivalSystem';
import { networkSync } from './networkSync';
import { CameraController } from './cameraController';
import { CollisionSystem, CollisionLayer, ISLAND_PLAYABLE_RADIUS, clampStoneLandingLocation } from './collisionSystem';
import { GuardAIController } from './guardAI';
import { LODSystem } from './lodSystem';
import { getMissionConfig } from './levelManifest';

export function seededRng(seed: number) {
  let s = Math.abs(seed | 0) || 12345;
  return function() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}


// Pre-allocated math variables for 0-GC loop
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _vec3Move = new THREE.Vector3();
const _targetSunPos = new THREE.Vector3();
const _targetSunColor = new THREE.Color();
const _targetHemiSky = new THREE.Color();
const _targetHemiGround = new THREE.Color();
const _targetSkyColor = new THREE.Color();
const _targetFogColor = new THREE.Color();

const TIME_CONFIGS: Record<TimeOfDay, {
  sunColor: number;
  sunIntensity: number;
  sunPos: [number, number, number];
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
  skyColor: number;
  fogColor: number;
  fogDensity: number;
  starOpacity: number;
  campLightIntensity: number;
}> = {
  morning: {
    sunColor: 0xffedd5,
    sunIntensity: 1.8,
    sunPos: [42, 20, 15],
    hemiSky: 0xfdba74,
    hemiGround: 0x166534,
    hemiIntensity: 0.75,
    skyColor: 0xfed7aa,
    fogColor: 0xffedd5,
    fogDensity: 0.009,
    starOpacity: 0.0,
    campLightIntensity: 0.4,
  },
  day: {
    sunColor: 0xfff7e6,
    sunIntensity: 2.2,
    sunPos: [25, 48, 20],
    hemiSky: 0x8cd3ff,
    hemiGround: 0x4d7c0f,
    hemiIntensity: 0.85,
    skyColor: 0x8cd3ff,
    fogColor: 0x8cd3ff,
    fogDensity: 0.007,
    starOpacity: 0.0,
    campLightIntensity: 0.1,
  },
  sunset: {
    sunColor: 0xfb923c,
    sunIntensity: 2.1,
    sunPos: [-45, 15, -15],
    hemiSky: 0xf43f5e,
    hemiGround: 0x064e3b,
    hemiIntensity: 0.65,
    skyColor: 0xf97316,
    fogColor: 0xc084fc,
    fogDensity: 0.010,
    starOpacity: 0.25,
    campLightIntensity: 1.3,
  },
  night: {
    sunColor: 0x93c5fd,
    sunIntensity: 0.75,
    sunPos: [-20, 42, -25],
    hemiSky: 0x1e1b4b,
    hemiGround: 0x022c22,
    hemiIntensity: 0.5,
    skyColor: 0x0a0f1d,
    fogColor: 0x0c1427,
    fogDensity: 0.012,
    starOpacity: 0.95,
    campLightIntensity: 2.2,
  },
};

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  crouch: boolean;
  jump: boolean;
  interact: boolean;
  attack: boolean;
  parry: boolean;
  dodge: boolean;
  shoot: boolean;
  // Virtual joystick (-1 to 1)
  joystickX: number;
  joystickY: number;
}

export class IslandWorld {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean = false;
  private animationFrameId: number = 0;
  private clock: THREE.Clock;

  // Sub-system Controllers
  public cameraController: CameraController = new CameraController();
  public collisionSystem: CollisionSystem = new CollisionSystem();
  public guardAIController: GuardAIController = new GuardAIController();
  public lodSystem: LODSystem = new LODSystem();

  // Game mode
  public mode: GameMode = 'menu';

  // Player Character
  public player: AdventurerCharacter;
  public playerPos: THREE.Vector3 = new THREE.Vector3(-22, 1.0, 24); // Starting beach campsite
  public playerVel: THREE.Vector3 = new THREE.Vector3();
  public playerVelocity: THREE.Vector3 = new THREE.Vector3(); // Smoothed velocity vector for lerp-based movement
  public playerRotation: number = 0;
  public isGrounded: boolean = true;
  private footstepTimer: number = 0;

  // Co-op Companion (prepared for multiplayer)
  public companion: AdventurerCharacter | null = null;
  public companionPos: THREE.Vector3 = new THREE.Vector3(-20, 1.0, 25);
  public companionActive: boolean = false;

  // Camera Orbit Settings (Delegated to cameraController)
  public get cameraDistance(): number { return this.cameraController.cameraDistance; }
  public set cameraDistance(val: number) { this.cameraController.cameraDistance = val; }

  public get cameraPitch(): number { return this.cameraController.cameraPitch; }
  public set cameraPitch(val: number) { this.cameraController.cameraPitch = val; }

  public get cameraYaw(): number { return this.cameraController.cameraYaw; }
  public set cameraYaw(val: number) { this.cameraController.cameraYaw = val; }

  public get mouseSensitivity(): number { return this.cameraController.mouseSensitivity; }
  public set mouseSensitivity(val: number) { this.cameraController.mouseSensitivity = val; }

  public get invertY(): boolean { return this.cameraController.invertY; }
  public set invertY(val: boolean) { this.cameraController.invertY = Boolean(val); }

  // World Elements
  private waterMesh: THREE.Mesh;
  private keys: Map<KeyType, { group: THREE.Group; collected: boolean; pos: THREE.Vector3 }> = new Map();
  private altar: ReturnType<typeof createRuneAltar>;
  private gate: ReturnType<typeof createEscapeGate>;
  private gatePosition: THREE.Vector3 = new THREE.Vector3(0, 4.2, -30);
  private altarPosition: THREE.Vector3 = new THREE.Vector3(0, 2.8, 2);

  // Collectibles, Obstacles & Hazards
  public currentSeed: number = 104729;
  public stoneCooldown: number = 0;
  private stoneRipples: Array<{ mesh: THREE.Mesh; life: number }> = [];

  public get worldObstacles() {
    return this.collisionSystem.getObstacles();
  }

  private chests: Array<{
    id: string;
    name: string;
    instance: TreasureChestInstance;
    pos: THREE.Vector3;
    opened: boolean;
    coinsReward: number;
    xpReward: number;
  }> = [];
  private coins: Array<{ group: THREE.Group; collected: boolean; pos: THREE.Vector3 }> = [];
  private bouncePads: Array<{ group: THREE.Group; pos: THREE.Vector3; strength: number }> = [];

  // Particles
  private motes: THREE.Points | null = null;
  private victoryParticles: THREE.Points | null = null;
  private isVictoryCelebration: boolean = false;

  // Quest State
  public questProgress: QuestProgress = {
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
    caughtCount: 0,
    missionPhase: 'orient',
    sessionSeed: 104729,
    stoneCooldown: 0,
    // Phase 7 Hybrid Combat
    currentMissionId: 'mission_shadow_escape',
    firearmAuthorized: false,
    ammoCount: 0,
    maxAmmo: 0,
    playerHealth: 100,
    maxPlayerHealth: 100,
    attackCooldown: 0,
    dodgeCooldown: 0,
    isParrying: false,
  };

  // Combat State Tracking
  private playerCombatState: 'idle' | 'attack' | 'parry' | 'dodge' | 'hit' = 'idle';
  private playerCombatTimer: number = 0;
  private playerDodgeTimer: number = 0;
  private playerInvincibilityTimer: number = 0;
  private currentWeapon: 'none' | 'blade' | 'firearm' = 'blade';

  // Interaction prompt, tutorial, puzzle & notification callbacks for HUD
  public onPromptChange?: (prompt: string | null) => void;
  public onTutorialNotice?: (notice: { title: string; text: string } | null) => void;
  public onQuestUpdate?: (quest: QuestProgress) => void;
  public onVictory?: (time: number) => void;
  public onFailure?: (reason: string) => void;
  public onToastNotification?: (toast: Omit<NotificationToast, 'id' | 'timestamp'>) => void;
  public onOpenPuzzleModal?: (puzzleId: string) => void;

  private lastReportedSecond: number = -1;

  public togglePhysicsWireframes(): boolean {
    const isVisible = this.collisionSystem.togglePhysicsWireframes(this.scene);

    // Iterate through all Mesh objects in the scene and toggle visibility of associated physics wireframe meshes
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.userData && object.userData.physicsWireframe instanceof THREE.Mesh) {
          object.userData.physicsWireframe.visible = isVisible;
        }
        if (object.userData && object.userData.isPhysicsWireframe) {
          object.visible = isVisible;
        }
      }
    });

    return isVisible;
  }

  // Active inputs
  public inputs: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    crouch: false,
    jump: false,
    interact: false,
    attack: false,
    parry: false,
    dodge: false,
    shoot: false,
    joystickX: 0,
    joystickY: 0,
  };

  private currentInteractTarget: string | null = null;
  private lastActivePrompt: string | null = null;
  private wasNearSign: boolean = false;

  // Dynamic Environment & Lighting System
  private sunLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private ambientLight!: THREE.AmbientLight;
  private campFireLight: THREE.PointLight | null = null;
  private starfield: ReturnType<typeof createStarfield> | null = null;
  private rainSystem: ReturnType<typeof createRainSystem> | null = null;
  private windSystem: ReturnType<typeof createWindLeavesSystem> | null = null;
  private grassSystem: ReturnType<typeof createInstancedGrass> | null = null;
  private flowerSystem: THREE.InstancedMesh | null = null;
  public environmentState: EnvironmentState = {
    timeOfDay: 'day',
    weather: 'clear',
    autoCycle: false,
    cycleProgress: 0.3,
  };
  public onEnvironmentChange?: (env: EnvironmentState) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.clock = new THREE.Clock();

    // 1. Detect Software WebGL
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // 2. Setup Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);
    (window as any).__rendererInfo = () => this.renderer.info.render;
    (window as any).__getPerformanceStats = () => this.getPerformanceStats();

    // 3. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x8cd3ff);
    this.scene.fog = new THREE.FogExp2(0x8cd3ff, 0.011);

    this.camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      350
    );
    this.camera.position.set(0, 15, 30);

    // 4. Procedural Studio Environment Reflection
    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch {
      // Graceful fallback
    }

    // 5. Lighting Setup
    this.setupLighting();

    // 6. Build Island World Elements
    this.scene.add(createIslandTerrain());

    this.waterMesh = createWaterMesh();
    this.scene.add(this.waterMesh);

    this.setupIslandDecorations();

    // 7. Interactive Altar & Gate
    this.altar = createRuneAltar();
    this.altar.group.position.copy(this.altarPosition);
    this.scene.add(this.altar.group);

    this.gate = createEscapeGate();
    this.gate.group.position.copy(this.gatePosition);
    this.scene.add(this.gate.group);

    // 8. Place Keys, Chests, Coins, Bounce Pads, Obstacles & Puzzles
    this.setupKeys();
    this.setupTreasureChests();
    this.setupCoins();
    this.setupBouncePads();
    this.setupObstaclesAndPuzzles();

    // 9. Floating light motes
    this.setupMotes();

    // 10. Player Character
    this.player = createAdventurerModel('#e67e22', '#8e44ad');
    this.player.group.position.copy(this.playerPos);
    this.scene.add(this.player.group);
    this.player.setSwordVisible?.(true);

    // 11. Companion setup (Multiplayer preview)
    this.companion = createAdventurerModel('#2980b9', '#16a085');
    this.companion.group.position.copy(this.companionPos);
    this.companion.group.visible = false;
    this.scene.add(this.companion.group);

    // 12. Guard Patrol AI setup
    this.guardAIController.initGuards(this.scene);
    this.guardAIController.onPlayerSpotted = (_guardName) => {
      this.questProgress.caughtCount++;
      if (this.onQuestUpdate) this.onQuestUpdate({ ...this.questProgress });
      if (this.onToastNotification) {
        this.onToastNotification({
          type: 'achievement',
          title: 'Alert: Guard Spotted You!',
          message: 'Break line of sight and hide before the guard catches up!',
        });
      }
    };
    this.guardAIController.onPlayerCaught = (guardName) => {
      this.triggerFailure(`Spotted and caught by ${guardName}!`);
    };
    this.guardAIController.onGuardStrike = (guard) => {
      this.takeDamage(15);
    };

    // Bind event listeners
    window.addEventListener('resize', this.onResize);

    // Start loop
    this.tick();
  }

  private setupLighting() {
    // Directional Sun / Moon key light
    this.sunLight = new THREE.DirectionalLight(0xfff7e6, 2.2);
    this.sunLight.position.set(25, 48, 20);
    this.sunLight.castShadow = !this.isSoftwareGl;
    if (this.sunLight.castShadow) {
      this.sunLight.shadow.mapSize.width = 1024;
      this.sunLight.shadow.mapSize.height = 1024;
      this.sunLight.shadow.camera.near = 0.5;
      this.sunLight.shadow.camera.far = 120;
      const d = 36;
      this.sunLight.shadow.camera.left = -d;
      this.sunLight.shadow.camera.right = d;
      this.sunLight.shadow.camera.top = d;
      this.sunLight.shadow.camera.bottom = -d;
      this.sunLight.shadow.bias = -0.0005;
      this.sunLight.shadow.normalBias = 0.02;
    }
    this.scene.add(this.sunLight);

    // Sky & ground hemisphere fill
    this.hemiLight = new THREE.HemisphereLight(0x8cd3ff, 0x4d7c0f, 0.7);
    this.scene.add(this.hemiLight);

    // Ambient light for subtle fill in shadows
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(this.ambientLight);

    // Campsite flickering fire point light
    this.campFireLight = new THREE.PointLight(0xff7700, 1.2, 14);
    this.campFireLight.position.set(-22, getIslandHeight(-22, 24) + 0.9, 24);
    this.scene.add(this.campFireLight);

    // Celestial Starfield
    this.starfield = createStarfield();
    this.scene.add(this.starfield.points);
  }

  private setupIslandDecorations() {
    // Starting beach campsite
    const camp = createCampsiteDecor();
    camp.position.set(-22, getIslandHeight(-22, 24), 24);
    this.scene.add(camp);

    // Sun Temple ruins on North-East hill
    const sunTemple = createSunTempleRuinsLOD();
    sunTemple.position.set(18, getIslandHeight(18, -18), -18);
    this.scene.add(sunTemple);
    this.lodSystem.register(sunTemple, 160);

    // Register colliders for stealth cover debris
    const debrisOffsets = [
      [-2.5, 2.5], [2.5, -2.5], [3.5, 3.5], [-3.5, -3.5]
    ];
    debrisOffsets.forEach(([dx, dz]) => {
      this.collisionSystem.registerBoxObstacle(
        18 + dx - 0.6, 18 + dx + 0.6,
        -18 + dz - 0.6, -18 + dz + 0.6,
        CollisionLayer.PROPS,
        'temple_debris'
      );
    });


    // River Bridge
    const bridge = createBridge();
    const bridgeX = -18;
    const bridgeZ = 4;
    bridge.position.set(bridgeX, getIslandHeight(bridgeX, bridgeZ) + 0.6, bridgeZ);
    bridge.rotation.y = 0.45;
    this.scene.add(bridge);

    // --- Architectural Outpost & Settlement Structures ---
    // 1. Village Cottage North (x: -10, z: 12)
    const cottageN = createStoneCottageLOD(6.2, 3.6, 5.2);
    const cottageNy = getIslandHeight(-10, 12);
    cottageN.position.set(-10, cottageNy, 12);
    cottageN.rotation.y = 0.2;
    this.scene.add(cottageN);
    this.lodSystem.register(cottageN, 120);
    this.collisionSystem.registerBoxObstacle(-13.1, -6.9, 9.4, 14.6, CollisionLayer.STATIC_WORLD);
    this.collisionSystem.registerDoor('cottage_north_door', -10.7, -9.3, 14.3, 14.7);
    this.collisionSystem.setDoorOpen('cottage_north_door', true);

    // 2. Village Storehouse South (x: -4, z: 16)
    const cottageS = createStoneCottageLOD(5.4, 3.4, 4.8);
    const cottageSy = getIslandHeight(-4, 16);
    cottageS.position.set(-4, cottageSy, 16);
    cottageS.rotation.y = -0.35;
    this.scene.add(cottageS);
    this.lodSystem.register(cottageS, 120);
    this.collisionSystem.registerBoxObstacle(-6.7, -1.3, 13.6, 18.4, CollisionLayer.STATIC_WORLD);
    this.collisionSystem.registerDoor('cottage_south_door', -4.7, -3.3, 18.2, 18.6);
    this.collisionSystem.setDoorOpen('cottage_south_door', true);

    // 3. Coastal Guard Watchtower (x: -28, z: 8)
    const tower = createWatchtowerLOD();
    const towerY = getIslandHeight(-28, 8);
    tower.position.set(-28, towerY, 8);
    this.scene.add(tower);
    this.lodSystem.register(tower, 150);
    this.collisionSystem.registerObstacle(-28, 8, 1.8);

    // 4. Merchant Supply Wagon (x: -12, z: 18)
    const wagon = createSupplyWagonLOD();
    const wagonY = getIslandHeight(-12, 18);
    wagon.position.set(-12, wagonY, 18);
    wagon.rotation.y = 0.6;
    this.scene.add(wagon);
    this.lodSystem.register(wagon, 100);
    this.collisionSystem.registerObstacle(-12, 18, 1.6);

    // 5. Village Iron Streetlamps
    const lampCoords = [
      { x: -8, z: 8 },
      { x: 8, z: -8 },
      { x: 0, z: -4 },
      { x: -18, z: 20 },
    ];
    lampCoords.forEach((lp) => {
      const lamp = createStreetlamp();
      const ly = getIslandHeight(lp.x, lp.z);
      lamp.position.set(lp.x, ly, lp.z);
      this.scene.add(lamp);
      this.collisionSystem.registerObstacle(lp.x, lp.z, 0.4);
    });

    // 6. Courtyard Park Bench
    const bench = createParkBench();
    const benchY = getIslandHeight(-7, 6);
    bench.position.set(-7, benchY, 6);
    bench.rotation.y = 0.5;
    this.scene.add(bench);
    this.collisionSystem.registerObstacle(-7, 6, 0.8);

    // 7. Boxwood Hedges for Stealth Cover
    const hedgeCoords = [
      { x: -6, z: 10, rot: 0.1 },
      { x: -2, z: 12, rot: 0.8 },
    ];
    hedgeCoords.forEach((h) => {
      const hedge = createHedge(4.2);
      const hy = getIslandHeight(h.x, h.z);
      hedge.position.set(h.x, hy, h.z);
      hedge.rotation.y = h.rot;
      this.scene.add(hedge);
      this.collisionSystem.registerObstacle(h.x, h.z, 1.2);
    });

    // 8. Perimeter Timber Fences
    const fenceCoords = [
      { x: -14, z: 14, rot: 0.3, len: 5.5 },
      { x: -24, z: 12, rot: -0.2, len: 6.0 },
    ];
    fenceCoords.forEach((fc) => {
      const fence = createPerimeterFence(fc.len);
      const fy = getIslandHeight(fc.x, fc.z);
      fence.position.set(fc.x, fy, fc.z);
      fence.rotation.y = fc.rot;
      this.scene.add(fence);
      this.collisionSystem.registerObstacle(fc.x, fc.z, 1.5);
    });

    // Plant trees across zones
    const treeConfigs: Array<{ type: 'palm' | 'oak' | 'pine' | 'sacred'; x: number; z: number }> = [
      // Sacred Grove (giant ancient tree + pines)
      { type: 'sacred', x: 20, z: 18 },
      { type: 'pine', x: 25, z: 16 },
      { type: 'pine', x: 16, z: 22 },
      { type: 'pine', x: 23, z: 24 },
      { type: 'oak', x: 14, z: 15 },

      // Sun Temple hill surrounds
      { type: 'oak', x: 12, z: -22 },
      { type: 'oak', x: 24, z: -14 },
      { type: 'pine', x: 22, z: -24 },

      // Waterfall forest
      { type: 'pine', x: -16, z: -16 },
      { type: 'pine', x: -8, z: -14 },
      { type: 'oak', x: -14, z: -6 },

      // Beach Palms
      { type: 'palm', x: -28, z: 22 },
      { type: 'palm', x: -25, z: 28 },
      { type: 'palm', x: -18, z: 30 },
      { type: 'palm', x: -30, z: 16 },
      { type: 'palm', x: -32, z: 6 },
      { type: 'palm', x: 2, z: 32 },
      { type: 'palm', x: -6, z: 34 },

      // Central valley & paths
      { type: 'oak', x: -6, z: 12 },
      { type: 'oak', x: 8, z: 10 },
      { type: 'oak', x: -8, z: 2 },
      { type: 'oak', x: 9, z: -4 },
      { type: 'pine', x: -10, z: -24 },
      { type: 'pine', x: 10, z: -24 },
    ];

    treeConfigs.forEach((cfg) => {
      const tree = createTree(cfg.type);
      const y = getIslandHeight(cfg.x, cfg.z);
      tree.position.set(cfg.x, y, cfg.z);
      tree.rotation.y = Math.random() * Math.PI * 2;
      const s = 0.85 + Math.random() * 0.3;
      tree.scale.set(s, s, s);
      this.scene.add(tree);

      // Register physical tree trunk collision boundary
      const trunkRadius = cfg.type === 'sacred' ? 1.6 : cfg.type === 'palm' ? 0.65 : 0.9 * s;
      this.collisionSystem.registerObstacle(cfg.x, cfg.z, trunkRadius);
    });

    // Scatter rocks & boulders
    const rockLocations = [
      { x: -12, z: -12, s: 2.2 }, // Waterfall cliff rocks
      { x: -14, z: -10, s: 1.8 },
      { x: -10, z: -8, s: 1.4 },
      { x: -25, z: 20, s: 1.2 },
      { x: -3, z: -16, s: 1.5 },
      { x: 14, z: -12, s: 1.3 },
      { x: 24, z: 12, s: 1.6 },
      { x: -2, z: -26, s: 1.7 },
      { x: 3, z: -26, s: 1.7 },
    ];
    rockLocations.forEach((r) => {
      const rock = createRock(r.s);
      const y = getIslandHeight(r.x, r.z);
      rock.position.set(r.x, y, r.z);
      rock.rotation.y = Math.random() * Math.PI * 2;
      this.scene.add(rock);

      // Register physical rock boulder collision boundary
      this.collisionSystem.registerObstacle(r.x, r.z, r.s * 0.7);
    });

    // Register Altar, Gate, Temple & Shrine collision boundaries
    this.collisionSystem.registerObstacle(0, 2, 1.3); // Rune Altar
    this.collisionSystem.registerObstacle(0, -30, 1.8); // Escape Gate pillars
    this.collisionSystem.registerObstacle(18, -18, 2.2); // Sun Temple ruins core

    // Helper obstacle check for vegetation (avoids roads, puzzles, campsite, gate, bridge, cottages, watchtower)
    const isObstacle = (x: number, z: number) => {
      if (Math.hypot(x - (-22), z - 24) < 5.5) return true; // Campsite
      if (Math.hypot(x, z - 2) < 5.5) return true; // Altar
      if (Math.hypot(x, z - (-30)) < 5.5) return true; // Gate
      if (Math.hypot(x - 18, z - (-18)) < 7) return true; // Sun Temple
      if (Math.hypot(x - (-18), z - 4) < 4.5) return true; // Bridge
      if (Math.hypot(x - (-10), z - 12) < 4.5) return true; // Village Cottage North
      if (Math.hypot(x - (-4), z - 16) < 4.2) return true; // Village Storehouse South
      if (Math.hypot(x - (-28), z - 8) < 3.2) return true; // Coastal Watchtower
      if (Math.hypot(x - (-12), z - 18) < 3.0) return true; // Merchant Wagon
      const riverT = THREE.MathUtils.clamp((x + 36) / 24, 0, 1);
      const riverX = -36 + riverT * 24;
      const riverZ = 20 - riverT * 30 + Math.sin(riverT * Math.PI) * 5;
      if (Math.hypot(x - riverX, z - riverZ) < 3.2) return true; // River
      return false;
    };

    // Procedural Vegetation: Instanced Grass Tufts (120 count, 1 draw call)
    this.grassSystem = createInstancedGrass(120, isObstacle);
    this.scene.add(this.grassSystem.mesh);

    // Procedural Vegetation: Instanced Wildflowers (80 count, 1 draw call)
    this.flowerSystem = createInstancedFlowers(80, isObstacle);
    this.scene.add(this.flowerSystem);

    // Scatter bushes
    const bushCoords = [
      { x: 18, z: 22 }, { x: 23, z: 14 }, { x: 15, z: 24 },
      { x: -14, z: -18 }, { x: -8, z: -18 }, { x: 10, z: -20 },
      { x: -26, z: 18 }, { x: -22, z: 28 },
    ];
    bushCoords.forEach((b) => {
      const bush = createBush(0.85 + Math.random() * 0.3);
      const y = getIslandHeight(b.x, b.z);
      bush.position.set(b.x, y, b.z);
      this.scene.add(bush);
    });

    // Bioluminescent Flora (magical glowing mushrooms in Sacred Grove & Waterfall Grotto)
    const bioFlora = createBioluminescentFlora();
    this.scene.add(bioFlora);

    // Weather Systems
    this.rainSystem = createRainSystem(420);
    this.scene.add(this.rainSystem.points);

    this.windSystem = createWindLeavesSystem(45);
    this.scene.add(this.windSystem.points);
  }

  public setupKeys(seed?: number) {
    if (seed !== undefined) {
      this.currentSeed = seed;
    }
    this.questProgress.sessionSeed = this.currentSeed;

    // Safely remove existing key objects from scene if any
    this.keys.forEach((k) => {
      if (k.group.parent) {
        this.scene.remove(k.group);
      }
    });
    this.keys.clear();

    // Curated candidate locations for key variation (Validated for reachability, ground height, collision)
    const candidates = [
      { id: 'sun', spots: [
        { x: 18, z: -18, h: 1.8 }, // Temple Ruins dais
        { x: 2, z: -28, h: 1.2 },  // Mountain Peak Terrace
        { x: 22, z: -20, h: 1.3 }, // Temple Terrace
      ]},
      { id: 'ocean', spots: [
        { x: -12, z: -10, h: 1.3 }, // Waterfall Grotto
        { x: -28, z: 27, h: 1.1 },  // Secret Cove
        { x: -18, z: -2, h: 1.2 },  // River Gorge Cliff
      ]},
      { id: 'forest', spots: [
        { x: 20, z: 18, h: 1.4 },  // Sacred Grove
        { x: 24, z: 22, h: 1.2 },  // Grove Secret Vault
        { x: 12, z: 11, h: 1.3 },  // Trail to Grove
      ]},
    ];

    const rng = seededRng(this.currentSeed);
    
    candidates.forEach((c) => {
      const spotIdx = Math.floor(rng() * c.spots.length);
      const spot = c.spots[spotIdx];
      const pos = new THREE.Vector3(spot.x, getIslandHeight(spot.x, spot.z) + spot.h, spot.z);
      const keyItem = createKeyItem(c.id as KeyType);
      keyItem.position.copy(pos);
      this.scene.add(keyItem);
      this.keys.set(c.id as KeyType, { group: keyItem, collected: false, pos });
    });
  }

  /**
   * Tactical Distraction: Throws a stone to a target position to distract guards.
   * Rate-limited with a 3.0-second cooldown. Validates coordinates and creates visual/audio feedback.
   */
  public throwStone(): boolean {
    if (this.mode !== 'playing' || this.questProgress.missionPhase === 'orient') return false;
    if (this.stoneCooldown > 0) return false;
    
    // Calculate throw target 8m ahead in player facing direction
    _vec3A.set(Math.sin(this.playerRotation), 0, Math.cos(this.playerRotation)).normalize();
    _vec3B.copy(this.playerPos).addScaledVector(_vec3A, 8.0);
    
    // Clamp landing coordinates to playable boundary and dry terrain above water
    clampStoneLandingLocation(_vec3B);
    
    // Trigger noise in AI system
    this.guardAIController.triggerNoiseDistraction(_vec3B, 11.0);
    sound.playLand(); // Stone impact sound
    
    // Spawn visual impact ripple at landing location
    this.spawnStoneRipple(_vec3B);
    
    // Set 3.0s cooldown
    this.stoneCooldown = 3.0;
    this.questProgress.stoneCooldown = 3.0;
    if (this.onQuestUpdate) this.onQuestUpdate({ ...this.questProgress });
    
    if (this.onToastNotification) {
      this.onToastNotification({
        type: 'achievement',
        title: 'Stone Thrown',
        message: 'Guards nearby are investigating the noise.',
      });
    }
    return true;
  }

  private spawnStoneRipple(pos: THREE.Vector3) {
    const geo = new THREE.RingGeometry(0.1, 0.45, 16);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, pos.y + 0.08, pos.z);
    this.scene.add(mesh);
    this.stoneRipples.push({ mesh, life: 1.2 });
  }

  public startMission() {
    this.questProgress.missionPhase = 'execute';
    if (this.onQuestUpdate) this.onQuestUpdate({ ...this.questProgress });
  }

  private setupTreasureChests() {
    const chestLocations = [
      { id: 'chest_grotto', name: 'Waterfall Grotto Chest', x: -14, z: -12, coins: 50, xp: 100 },
      { id: 'chest_temple', name: 'Sun Temple Terrace Chest', x: 22, z: -20, coins: 75, xp: 150 },
      { id: 'chest_beach', name: 'Secret Cove Chest', x: -28, z: 27, coins: 50, xp: 100 },
      { id: 'chest_grove', name: 'Ancient Grove Secret Vault', x: 24, z: 22, coins: 80, xp: 160 },
      { id: 'chest_gorge', name: 'River Gorge Cliff Chest', x: -18, z: -2, coins: 60, xp: 120 },
      { id: 'chest_peak', name: 'Mountain Peak Shrine Chest', x: 2, z: -28, coins: 100, xp: 200 },
    ];

    chestLocations.forEach((c) => {
      const instance = createTreasureChest();
      const y = getIslandHeight(c.x, c.z);
      const pos = new THREE.Vector3(c.x, y, c.z);
      instance.group.position.copy(pos);
      this.scene.add(instance.group);
      this.chests.push({
        id: c.id,
        name: c.name,
        instance,
        pos,
        opened: false,
        coinsReward: c.coins,
        xpReward: c.xp,
      });
    });

    this.questProgress.totalChests = chestLocations.length;
  }

  private setupObstaclesAndPuzzles() {
    // 1. Moving Platform 1: River Gorge Crossing
    const plat1Mesh = createMovingPlatform(3.4, 3.4);
    const start1 = new THREE.Vector3(-18, getIslandHeight(-18, -2) + 0.6, -2);
    const end1 = new THREE.Vector3(-10, getIslandHeight(-10, -2) + 0.6, -2);
    plat1Mesh.position.copy(start1);
    this.scene.add(plat1Mesh);
    obstacleSystem.registerPlatform(plat1Mesh, start1, end1, 2.2);

    // Moving Platform 2: Temple Terrace Ascent
    const plat2Mesh = createMovingPlatform(3.2, 3.2);
    const start2 = new THREE.Vector3(10, getIslandHeight(10, -14) + 0.5, -14);
    const end2 = new THREE.Vector3(16, getIslandHeight(16, -14) + 2.2, -14);
    plat2Mesh.position.copy(start2);
    this.scene.add(plat2Mesh);
    obstacleSystem.registerPlatform(plat2Mesh, start2, end2, 1.8);

    // 2. Rotating Hazard Obstacle Beam
    const rotHazard = createRotatingObstacle(6.2);
    const rotPos = new THREE.Vector3(-16, getIslandHeight(-16, 4), 4);
    rotHazard.position.copy(rotPos);
    this.scene.add(rotHazard);
    obstacleSystem.registerRotatingObstacle(rotHazard, rotPos, 6.2, 1.6);

    // 3. Checkpoint Arches
    const checkpoints = [
      { id: 'cp_beach', name: 'Beach Campsite Arch', x: -22, z: 24 },
      { id: 'cp_gorge', name: 'River Gorge Bridge', x: -16, z: -4 },
      { id: 'cp_temple', name: 'Sun Temple Terrace', x: 18, z: -18 },
      { id: 'cp_grove', name: 'Sacred Grove Sanctuary', x: 20, z: 18 },
    ];
    checkpoints.forEach((cp) => {
      const arch = createCheckpointArch(cp.id);
      const y = getIslandHeight(cp.x, cp.z);
      arch.position.set(cp.x, y, cp.z);
      this.scene.add(arch);
    });

    // Grand Finish Line Arch
    const finishArch = createFinishLineArch();
    const finishY = getIslandHeight(0, -26);
    finishArch.position.set(0, finishY, -26);
    this.scene.add(finishArch);

    // 4. 3D Puzzle Elements
    // Puzzle A: Symbol Pillars at Sun Temple Terrace (x: 24, z: -16)
    const pillarA1 = createSymbolPillar('1');
    pillarA1.position.set(22, getIslandHeight(22, -16), -16);
    this.scene.add(pillarA1);

    const pillarA2 = createSymbolPillar('2');
    pillarA2.position.set(24, getIslandHeight(24, -16), -16);
    this.scene.add(pillarA2);

    const pillarA3 = createSymbolPillar('3');
    pillarA3.position.set(26, getIslandHeight(26, -16), -16);
    this.scene.add(pillarA3);

    // Puzzle B: Switch Levers at Waterfall Grotto (x: -16, z: -8)
    const switchPos = [
      [-18, -8], [-17, -8], [-15, -8], [-14, -8]
    ];
    switchPos.forEach(([sx, sz], idx) => {
      const sw = createPuzzleSwitchLever(String(idx + 1));
      const sy = getIslandHeight(sx, sz);
      sw.group.position.set(sx, sy, sz);
      this.scene.add(sw.group);
    });

    // Puzzle C: Rune Dial Altar at Sacred Grove (x: 18, z: 16)
    const dialAltar = createRuneDialAltar();
    dialAltar.position.set(18, getIslandHeight(18, 16), 16);
    this.scene.add(dialAltar);

    // 5. Survival Energy Crystals (5 Locations)
    const crystalCoords = [
      { id: 'crys_grotto', name: 'Waterfall Grotto Crystal', x: -14, z: -10 },
      { id: 'crys_temple', name: 'Sun Temple Peak Crystal', x: 18, z: -20 },
      { id: 'crys_grove', name: 'Sacred Grove Crystal', x: 22, z: 20 },
      { id: 'crys_river', name: 'River Bend Crystal', x: -12, z: 4 },
      { id: 'crys_beach', name: 'Secret Cove Crystal', x: -26, z: 24 },
    ];
    crystalCoords.forEach((cc) => {
      const crystalGrp = createSurvivalCrystal();
      const cy = getIslandHeight(cc.x, cc.z);
      const pos = new THREE.Vector3(cc.x, cy, cc.z);
      crystalGrp.position.copy(pos);
      this.scene.add(crystalGrp);
      survivalSystem.registerCrystal(cc.id, cc.name, crystalGrp, pos);
    });

    // Wire Puzzle Solved Listener
    puzzleSystem.onPuzzleSolved = (p, coins, xp) => {
      this.questProgress.puzzlesSolvedCount++;
      this.questProgress.coinsCollected += coins;
      this.questProgress.xpEarned += xp;
      if (this.onQuestUpdate) this.onQuestUpdate({ ...this.questProgress });

      if (this.onToastNotification) {
        this.onToastNotification({
          type: 'puzzle',
          title: 'Puzzle Solved!',
          message: `${p.name} unlocked! +${coins} Gold, +${xp} XP`,
        });
      }
    };

    // Wire Checkpoint Listener
    obstacleSystem.onCheckpointReached = (cp, idx) => {
      this.questProgress.checkpointsReached = idx + 1;
      this.questProgress.coinsCollected += 15;
      this.questProgress.xpEarned += 25;
      if (this.onQuestUpdate) this.onQuestUpdate({ ...this.questProgress });

      if (this.onToastNotification) {
        this.onToastNotification({
          type: 'checkpoint',
          title: 'Checkpoint Reached',
          message: `${cp.name} cleared! +15 Gold`,
        });
      }
    };

    // Wire Course Finish Listener
    obstacleSystem.onCourseCompleted = (time, coins, xp) => {
      this.questProgress.coinsCollected += coins;
      this.questProgress.xpEarned += xp;
      if (this.onQuestUpdate) this.onQuestUpdate({ ...this.questProgress });

      if (this.onToastNotification) {
        this.onToastNotification({
          type: 'achievement',
          title: 'Obstacle Course Mastered!',
          message: `Finished in ${time.toFixed(1)}s! +${coins} Gold, +${xp} XP`,
        });
      }
    };

    // Wire Survival Listener
    survivalSystem.onCrystalCollected = (count, total) => {
      this.questProgress.crystalsCollected = count;
      this.questProgress.coinsCollected += 20;
      this.questProgress.xpEarned += 35;
      if (this.onQuestUpdate) this.onQuestUpdate({ ...this.questProgress });

      if (this.onToastNotification) {
        this.onToastNotification({
          type: 'survival',
          title: 'Resonant Crystal Rescued',
          message: `${count}/${total} Survival Energy Crystals collected!`,
        });
      }
    };

    survivalSystem.onMissionFailed = () => {
      this.triggerFailure('The dusk storm covered Mystery Island before all energy crystals were rescued!');
    };
  }

  private setupCoins() {
    // 15 collectible gold coins along paths and landmarks
    const coinLocations = [
      [-19, 21], [-16, 17], [-12, 12], [-6, 6], [-2, 3], // Trail from beach to plaza
      [0, -6], [0, -14], [0, -22], // Trail from plaza to gate
      [6, -4], [11, -9], [15, -14], // Trail to temple
      [6, 7], [12, 11], [16, 14], // Trail to sacred grove
      [-15, 2], // Near river bridge
    ];

    coinLocations.forEach(([cx, cz]) => {
      const coin = createCoinItem();
      const y = getIslandHeight(cx, cz) + 0.85;
      const pos = new THREE.Vector3(cx, y, cz);
      coin.position.copy(pos);
      this.scene.add(coin);
      this.coins.push({ group: coin, collected: false, pos });
    });
  }

  private setupBouncePads() {
    // 2 Ancient Bounce Launch Pads for traversal
    const padLocations = [
      { x: -16, z: -4, strength: 13.5 }, // Near river gorge: launches player up toward the bridge / cliff!
      { x: 10, z: -14, strength: 14.0 }, // Near temple base: launches player directly up to the temple ruins terrace!
    ];

    padLocations.forEach((p) => {
      const pad = createBouncePad();
      const y = getIslandHeight(p.x, p.z);
      const pos = new THREE.Vector3(p.x, y, p.z);
      pad.position.copy(pos);
      this.scene.add(pad);
      this.bouncePads.push({ group: pad, pos, strength: p.strength });
    });
  }

  private setupMotes() {
    const count = 75;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = 1 + Math.random() * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.25,
      transparent: true,
      opacity: 0.65,
    });

    this.motes = new THREE.Points(geo, mat);
    this.scene.add(this.motes);
  }

  public setCompanionVisible(visible: boolean) {
    this.companionActive = visible;
    if (this.companion) {
      this.companion.group.visible = visible;
      if (visible) {
        this.companionPos.set(this.playerPos.x + 2, this.playerPos.y, this.playerPos.z + 1);
        this.companion.group.position.copy(this.companionPos);
      }
    }
  }

  public setPlayerCustomization(tunic: string, hat: string) {
    this.player.setOutfitColor(tunic, hat);
  }

  public getPerformanceStats() {
    return {
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures,
    };
  }

  public setGraphicsQuality(quality: 'low' | 'medium' | 'high') {
    if (this.isSoftwareGl) return;
    
    // Shadow resolution and bias presets
    const shadowConfigs = {
      low: { enabled: false, res: 512, bias: -0.001, normalBias: 0.01 },
      medium: { enabled: true, res: 1024, bias: -0.0005, normalBias: 0.02 },
      high: { enabled: true, res: 2048, bias: -0.0002, normalBias: 0.03 }
    };

    const config = shadowConfigs[quality];
    this.renderer.shadowMap.enabled = config.enabled;
    if (config.enabled) {
      this.sunLight.shadow.mapSize.width = config.res;
      this.sunLight.shadow.mapSize.height = config.res;
      this.sunLight.shadow.bias = config.bias;
      this.sunLight.shadow.normalBias = config.normalBias;
    }
    
    // Ambient light intensity
    this.ambientLight.intensity = quality === 'low' ? 0.2 : 0.4;
    
    // LOD Distance Factor
    const lodFactors = { low: 0.5, medium: 1.0, high: 1.8 };
    this.lodSystem.setDistanceFactor(lodFactors[quality]);

    // Pixel Ratio
    const dpr = quality === 'high' ? Math.min(window.devicePixelRatio, 2) : 1;
    this.renderer.setPixelRatio(dpr);
  }

  // --- Dynamic Environment Controls ---
  public setTimeOfDay(timeOfDay: TimeOfDay) {
    this.environmentState.timeOfDay = timeOfDay;
    this.environmentState.autoCycle = false;
    if (this.onEnvironmentChange) {
      this.onEnvironmentChange({ ...this.environmentState });
    }
  }

  public setWeather(weather: WeatherType) {
    this.environmentState.weather = weather;
    sound.setWeather(weather);
    if (this.rainSystem) {
      this.rainSystem.setVisible(weather === 'rain');
    }
    if (this.windSystem) {
      this.windSystem.setVisible(weather === 'wind');
    }
    if (this.onEnvironmentChange) {
      this.onEnvironmentChange({ ...this.environmentState });
    }
  }

  public toggleAutoCycle() {
    this.environmentState.autoCycle = !this.environmentState.autoCycle;
    if (this.onEnvironmentChange) {
      this.onEnvironmentChange({ ...this.environmentState });
    }
  }

  public setEnvironmentState(newState: Partial<EnvironmentState>) {
    if (newState.timeOfDay !== undefined) this.environmentState.timeOfDay = newState.timeOfDay;
    if (newState.weather !== undefined) {
      this.environmentState.weather = newState.weather;
      sound.setWeather(newState.weather);
      if (this.rainSystem) this.rainSystem.setVisible(newState.weather === 'rain');
      if (this.windSystem) this.windSystem.setVisible(newState.weather === 'wind');
    }
    if (newState.autoCycle !== undefined) this.environmentState.autoCycle = newState.autoCycle;
    if (this.onEnvironmentChange) {
      this.onEnvironmentChange({ ...this.environmentState });
    }
  }

  // --- Main Tick Loop ---
  private tick = () => {
    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.05); // Clamp frame delta
    const time = this.clock.getElapsedTime();

    // Auto Day/Night cycle progression
    if (this.environmentState.autoCycle && this.mode === 'playing') {
      this.environmentState.cycleProgress = (this.environmentState.cycleProgress + dt * 0.008) % 1.0;
      const prog = this.environmentState.cycleProgress;
      let newTime: TimeOfDay = 'day';
      if (prog < 0.25) newTime = 'morning';
      else if (prog < 0.5) newTime = 'day';
      else if (prog < 0.75) newTime = 'sunset';
      else newTime = 'night';

      if (newTime !== this.environmentState.timeOfDay) {
        this.environmentState.timeOfDay = newTime;
        if (this.onEnvironmentChange) {
          this.onEnvironmentChange({ ...this.environmentState });
        }
      }
    }

    // Dynamic Environment Interpolation
    const timeCfg = TIME_CONFIGS[this.environmentState.timeOfDay];
    const lerpSpeed = Math.min(1.0, dt * 3.2);

    if (this.sunLight) {
      _targetSunPos.set(...timeCfg.sunPos);
      this.sunLight.position.lerp(_targetSunPos, lerpSpeed);
      _targetSunColor.setHex(timeCfg.sunColor);
      this.sunLight.color.lerp(_targetSunColor, lerpSpeed);
      this.sunLight.intensity = THREE.MathUtils.lerp(this.sunLight.intensity, timeCfg.sunIntensity, lerpSpeed);
    }

    if (this.hemiLight) {
      _targetHemiSky.setHex(timeCfg.hemiSky);
      _targetHemiGround.setHex(timeCfg.hemiGround);
      this.hemiLight.color.lerp(_targetHemiSky, lerpSpeed);
      this.hemiLight.groundColor.lerp(_targetHemiGround, lerpSpeed);
      this.hemiLight.intensity = THREE.MathUtils.lerp(this.hemiLight.intensity, timeCfg.hemiIntensity, lerpSpeed);
    }

    // Sky & Fog adjustments
    let fogDensityTarget = timeCfg.fogDensity;
    if (this.environmentState.weather === 'fog') fogDensityTarget = 0.025;
    else if (this.environmentState.weather === 'rain') fogDensityTarget = 0.016;

    _targetSkyColor.setHex(timeCfg.skyColor);
    _targetFogColor.setHex(timeCfg.fogColor);

    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.lerp(_targetSkyColor, lerpSpeed);
    }
    if (this.scene.fog && this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.lerp(_targetFogColor, lerpSpeed);
      this.scene.fog.density = THREE.MathUtils.lerp(this.scene.fog.density, fogDensityTarget, lerpSpeed);
    }

    if (this.starfield) {
      this.starfield.material.opacity = THREE.MathUtils.lerp(
        this.starfield.material.opacity,
        timeCfg.starOpacity,
        lerpSpeed
      );
      this.starfield.points.rotation.y = time * 0.015;
    }

    if (this.campFireLight) {
      const baseIntensity = timeCfg.campLightIntensity;
      this.campFireLight.intensity = baseIntensity * (0.85 + Math.sin(time * 12) * 0.15 + Math.random() * 0.1);
    }

    // Particle system updates
    if (this.rainSystem) {
      this.rainSystem.update(this.playerPos, dt);
    }
    if (this.windSystem) {
      this.windSystem.update(this.playerPos, dt, time);
    }
    if (this.grassSystem) {
      this.grassSystem.updateWind(time, this.environmentState.weather === 'wind' ? 2.5 : 1.0);
    }

    // Water wave subtle motion
    if (this.waterMesh) {
      this.waterMesh.position.y = Math.sin(time * 1.5) * 0.08 - 0.05;
    }

    // Animate Key Items (floating, spinning)
    this.keys.forEach((k) => {
      if (!k.collected) {
        k.group.rotation.y = time * 2.0;
        k.group.position.y = k.pos.y + Math.sin(time * 3.0) * 0.18;
      }
    });

    // Animate Gold Coins and check pickup
    this.coins.forEach((coin) => {
      if (!coin.collected) {
        coin.group.rotation.y = time * 3.2;
        coin.group.position.y = coin.pos.y + Math.sin(time * 3.5 + coin.pos.x) * 0.12;

        if (this.mode === 'playing') {
          const d = this.playerPos.distanceTo(coin.group.position);
          if (d < 1.4) {
            coin.collected = true;
            this.scene.remove(coin.group);
            this.questProgress.coinsCollected += 10;
            this.questProgress.xpEarned += 15;
            sound.playCoinPickup();
            if (this.onQuestUpdate) {
              this.onQuestUpdate({ ...this.questProgress });
            }
          }
        }
      }
    });

    // Update Treasure Chests
    this.chests.forEach((c) => {
      c.instance.update(dt);
    });

    // Update Stone Throw Cooldown & Ripple VFX
    if (this.stoneCooldown > 0) {
      this.stoneCooldown = Math.max(0, this.stoneCooldown - dt);
      this.questProgress.stoneCooldown = this.stoneCooldown;
    }

    for (let i = this.stoneRipples.length - 1; i >= 0; i--) {
      const rip = this.stoneRipples[i];
      rip.life -= dt;
      rip.mesh.scale.addScalar(dt * 3.5);
      (rip.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, rip.life / 1.2);
      if (rip.life <= 0) {
        this.scene.remove(rip.mesh);
        rip.mesh.geometry.dispose();
        (rip.mesh.material as THREE.Material).dispose();
        this.stoneRipples.splice(i, 1);
      }
    }

    // Floating motes drift
    if (this.motes) {
      const posAttr = this.motes.geometry.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        let y = posAttr.getY(i) + Math.sin(time + i) * 0.005;
        if (y > 10) y = 1;
        posAttr.setY(i, y);
      }
      posAttr.needsUpdate = true;
    }

    // Gate animation if opening/unlocked
    if (this.questProgress.gateOpening) {
      this.questProgress.gateOpenProgress = Math.min(1.0, this.questProgress.gateOpenProgress + dt * 0.6);
      this.gate.setUnlocked(true, this.questProgress.gateOpenProgress);
      if (this.questProgress.gateOpenProgress >= 1.0) {
        this.questProgress.gateOpening = false;
        this.questProgress.gateUnlocked = true;
      }
    }

    if (this.mode === 'menu') {
      this.cameraController.update(this.camera, this.playerPos, dt, this.mode, time);
      this.player.updateAnimation(time, 0, false, false);
    } else if (this.mode === 'playing') {
      this.questProgress.timeElapsed += dt;
      const currentSecond = Math.floor(this.questProgress.timeElapsed);
      if (currentSecond !== this.lastReportedSecond) {
        this.lastReportedSecond = currentSecond;
        if (this.onQuestUpdate) {
          this.onQuestUpdate({ ...this.questProgress });
        }
      }

      this.updatePlayer(dt, time);
      this.cameraController.update(this.camera, this.playerPos, dt, this.mode, time);
      this.checkInteractions();

      // Guard AI Patrol, Detection, Vision FOV & Chase
      this.guardAIController.updateGuards(
        this.playerPos,
        this.inputs.crouch,
        this.inputs.sprint,
        dt,
        time
      );

      // Companion simulated idle/follow
      this.guardAIController.updateCompanion(
        this.companion,
        this.companionPos,
        this.playerPos,
        this.companionActive,
        dt,
        time
      );
    } else if (this.mode === 'victory') {
      this.cameraController.update(this.camera, this.playerPos, dt, this.mode, time);
      this.player.updateAnimation(time, 0, false, false);

      if (this.victoryParticles) {
        this.victoryParticles.rotation.y = time * 0.5;
      }
    }

    this.renderer.render(this.scene, this.camera);
    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  // --- Player Physics & Kinematics ---
  private updatePlayer(dt: number, time: number) {
    this.lodSystem.update(this.camera, time);
    const isCrouching = this.inputs.crouch;
    const isRunning = this.inputs.sprint && !isCrouching;
    const baseSpeed = isCrouching ? 2.2 : isRunning ? 7.8 : 4.5;

    // Calculate move vector from keyboard and joystick
    _vec3Move.set(0, 0, 0);

    let forwardInput = 0;
    let rightInput = 0;

    if (this.inputs.forward) forwardInput += 1;
    if (this.inputs.backward) forwardInput -= 1;
    if (this.inputs.right) rightInput += 1;
    if (this.inputs.left) rightInput -= 1;

    // Add joystick input
    if (Math.abs(this.inputs.joystickY) > 0.1) {
      forwardInput += this.inputs.joystickY;
    }
    if (Math.abs(this.inputs.joystickX) > 0.1) {
      rightInput += this.inputs.joystickX;
    }

    const inputMag = Math.hypot(forwardInput, rightInput);

    // Compute camera direction basis on XZ plane
    const camYaw = this.cameraYaw;
    const camForward = _vec3A.set(Math.sin(camYaw), 0, Math.cos(camYaw)).normalize();
    const camRight = _vec3B.set(-Math.cos(camYaw), 0, Math.sin(camYaw)).normalize();

    _vec3Move.set(0, 0, 0);
    if (inputMag > 0.05) {
      _vec3Move.addScaledVector(camForward, forwardInput);
      _vec3Move.addScaledVector(camRight, rightInput);
      _vec3Move.normalize();
    }

    // Calculate target velocity vector based on input magnitude & max speed
    const targetSpeed = inputMag > 0.05 ? baseSpeed * Math.min(inputMag, 1.0) : 0;
    const targetVelocityX = _vec3Move.x * targetSpeed;
    const targetVelocityZ = _vec3Move.z * targetSpeed;

    // Linear interpolation (lerp) on velocity vector for organic acceleration and deceleration
    const accelerationRate = inputMag > 0.05 ? 14.0 : 18.0; // Snappier stop, smooth start
    const lerpFactor = Math.min(1.0, dt * accelerationRate);

    this.playerVelocity.x = THREE.MathUtils.lerp(this.playerVelocity.x, targetVelocityX, lerpFactor);
    this.playerVelocity.z = THREE.MathUtils.lerp(this.playerVelocity.z, targetVelocityZ, lerpFactor);

    const actualSpeed = Math.hypot(this.playerVelocity.x, this.playerVelocity.z);

    if (actualSpeed > 0.01) {
      // Smoothly rotate character toward movement velocity heading
      const targetAngle = Math.atan2(this.playerVelocity.x, this.playerVelocity.z);
      this.playerRotation = THREE.MathUtils.damp(this.playerRotation, targetAngle, 20, dt);
      this.player.group.rotation.y = this.playerRotation;

      // Footstep sound proportional to speed
      this.footstepTimer += dt * (actualSpeed > 5.0 ? 1.6 : 1.1);
      if (this.footstepTimer > 0.32 && this.isGrounded) {
        this.footstepTimer = 0;
        sound.playFootstep();
      }
    } else {
      this.playerVelocity.set(0, 0, 0);
    }

    // Apply substepping movement integration & collision resolution (handles corners, walls, anti-tunneling & island bounds)
    this.collisionSystem.resolveMovementWithSubstepping(this.playerPos, this.playerVelocity, dt, 0.55);

    // Update Obstacle System (Moving Platforms, Rotating Hazards, Checkpoints)
    const { carriedDelta } = obstacleSystem.update(dt, time, this.playerPos, this.playerVel, this.isGrounded);
    this.playerPos.add(carriedDelta);

    // Update Survival System (Energy Crystals & Mission Timers)
    survivalSystem.update(dt, time, this.playerPos);
    this.questProgress.survivalTimeRemaining = Math.ceil(survivalSystem.state.timeRemaining);

    // Broadcast state for multiplayer synchronization
    networkSync.broadcastState(
      [this.playerPos.x, this.playerPos.y, this.playerPos.z],
      this.playerRotation,
      actualSpeed > 0.01 ? (isRunning ? 'running' : 'walking') : 'idle',
      this.questProgress
    );

    // Vertical Jump & Gravity
    const groundY = getIslandHeight(this.playerPos.x, this.playerPos.z);

    if (this.inputs.jump && this.isGrounded) {
      this.playerVel.y = 7.2;
      this.isGrounded = false;
      sound.playJump();
    }

    // Check Ancient Bounce Launch Pads
    this.bouncePads.forEach((pad) => {
      const d = Math.hypot(this.playerPos.x - pad.pos.x, this.playerPos.z - pad.pos.z);
      if (d < 1.35 && Math.abs(this.playerPos.y - pad.pos.y) < 1.4) {
        if (this.playerVel.y <= 1.0) {
          this.playerVel.y = pad.strength;
          this.isGrounded = false;
          sound.playBouncePad();
        }
      }
    });

    if (this.isGrounded && this.playerPos.y > groundY + 0.35) {
      this.isGrounded = false;
      this.playerVel.y = -0.5;
    }

    if (!this.isGrounded) {
      this.playerVel.y -= 19.6 * dt; // Gravity
      this.playerPos.y += this.playerVel.y * dt;

      if (this.playerPos.y <= groundY) {
        this.playerPos.y = groundY;
        this.playerVel.y = 0;
        this.isGrounded = true;
        sound.playLand();
      }
    } else {
      // Snug ground alignment with higher damping coefficient for silky smooth elevation tracking
      this.playerPos.y = THREE.MathUtils.damp(this.playerPos.y, groundY, 28, dt);
    }

    this.player.group.position.copy(this.playerPos);

    // Update procedural model animations with Phase 7 Combat support
    const combatProgress = this.playerCombatState === 'attack' 
      ? this.playerCombatTimer / 0.75 
      : this.playerCombatTimer / 0.5;

    this.player.updateAnimation(
      time, 
      inputMag, 
      !this.isGrounded, 
      isRunning, 
      isCrouching,
      this.playerCombatState,
      THREE.MathUtils.clamp(combatProgress, 0, 1)
    );

    // Process Hybrid Combat Logic
    this.updateCombat(dt, time);
  }

  private updateCombat(dt: number, time: number) {
    if (this.mode !== 'playing') return;

    // Tick cooldowns and timers
    if (this.questProgress.attackCooldown > 0) this.questProgress.attackCooldown -= dt;
    if (this.questProgress.dodgeCooldown > 0) this.questProgress.dodgeCooldown -= dt;
    if (this.playerInvincibilityTimer > 0) this.playerInvincibilityTimer -= dt;
    
    // Handle combat state transitions
    if (this.playerCombatState !== 'idle' && this.playerCombatState !== 'parry') {
      this.playerCombatTimer += dt;
      
      const duration = this.playerCombatState === 'attack' ? 0.75 : 0.5;
      if (this.playerCombatTimer >= duration) {
        this.playerCombatState = 'idle';
        this.playerCombatTimer = 0;
      }
    }
    
    // Process Combat Inputs
    if (this.playerCombatState === 'idle') {
      if (this.inputs.attack && this.questProgress.attackCooldown <= 0) {
        this.executeSwordAttack();
      } else if (this.inputs.parry) {
        this.playerCombatState = 'parry';
        this.questProgress.isParrying = true;
      } else if (this.inputs.dodge && this.questProgress.dodgeCooldown <= 0) {
        this.executeDodge();
      } else if (this.inputs.shoot && this.questProgress.firearmAuthorized && this.questProgress.ammoCount > 0) {
        this.executeFirearmShot();
      }
    }
    
    // Reset parry if button released
    if (this.playerCombatState === 'parry' && !this.inputs.parry) {
      this.playerCombatState = 'idle';
      this.questProgress.isParrying = false;
    }
  }

  private executeSwordAttack() {
    this.playerCombatState = 'attack';
    this.playerCombatTimer = 0;
    this.questProgress.attackCooldown = 0.8;
    
    sound.playSwordSlash();
    
    // Hit detection: cone-based sweep 2.2m ahead
    const guards = this.guardAIController.getGuards();
    guards.forEach(guard => {
      if (guard.state === 'disabled') return;
      const d = this.playerPos.distanceTo(guard.position);
      if (d < 2.5) {
        // Angle check
        _vec3A.set(Math.sin(this.playerRotation), 0, Math.cos(this.playerRotation));
        _vec3B.subVectors(guard.position, this.playerPos).normalize();
        if (_vec3A.dot(_vec3B) > 0.45) { // ~120 deg cone
           this.guardAIController.damageGuard(guard, 35);
           sound.playSwordClang();
        }
      }
    });

    if (this.onQuestUpdate) this.onQuestUpdate({ ...this.questProgress });
  }

  private executeDodge() {
    this.playerCombatState = 'dodge';
    this.playerCombatTimer = 0;
    this.questProgress.dodgeCooldown = 1.2;
    this.playerInvincibilityTimer = 0.5;
    sound.playDodgeRoll();
    // Velocity burst in facing direction
    _vec3A.set(Math.sin(this.playerRotation), 0, Math.cos(this.playerRotation)).multiplyScalar(10.0);
    this.playerVelocity.add(_vec3A);

    if (this.onQuestUpdate) this.onQuestUpdate({ ...this.questProgress });
  }

  private executeFirearmShot() {
    this.questProgress.ammoCount--;
    this.playerCombatState = 'attack'; // Use attack animation for firing
    this.playerCombatTimer = 0;
    this.questProgress.attackCooldown = 1.5;
    
    sound.playFirearmShot();
    
    // Create loud noise to attract guards (central mission gating)
    const mission = getMissionConfig(this.questProgress.currentMissionId);
    this.guardAIController.triggerNoiseDistraction(this.playerPos, mission.firearmNoiseRadius || 24.0);
    
    // Raycast hit detection (simplified tight cone)
    const guards = this.guardAIController.getGuards();
    guards.forEach(guard => {
      if (guard.state === 'disabled') return;
      const d = this.playerPos.distanceTo(guard.position);
      if (d < 18.0) {
        _vec3A.set(Math.sin(this.playerRotation), 0, Math.cos(this.playerRotation));
        _vec3B.subVectors(guard.position, this.playerPos).normalize();
        if (_vec3A.dot(_vec3B) > 0.96) { // Tight shot
           this.guardAIController.damageGuard(guard, 100); // Fatal shot
           sound.playSwordClang();
        }
      }
    });
    
    if (this.onQuestUpdate) this.onQuestUpdate({ ...this.questProgress });
  }

  public takeDamage(amount: number) {
    if (this.playerInvincibilityTimer > 0 || this.mode !== 'playing') return;
    
    // Defensive actions
    if (this.playerCombatState === 'dodge') return; // Dodging grants I-frames

    // Parrying reduces damage significantly
    const finalDamage = this.playerCombatState === 'parry' ? Math.floor(amount * 0.15) : amount;
    
    this.questProgress.playerHealth = Math.max(0, this.questProgress.playerHealth - finalDamage);
    this.playerInvincibilityTimer = 0.8;
    this.playerCombatState = 'hit';
    this.playerCombatTimer = 0;
    
    sound.playLand(); // Flinch sound
    
    if (this.onQuestUpdate) this.onQuestUpdate({ ...this.questProgress });
    
    if (this.questProgress.playerHealth <= 0) {
      this.triggerFailure('You were defeated in combat!');
    }
  }

  // --- Proximity & Quest Interactions ---
  private checkInteractions() {
    let activePrompt: string | null = null;
    let newTarget: typeof this.currentInteractTarget = null;

    // 1. Check Collectible Keys
    for (const [keyId, keyData] of this.keys.entries()) {
      if (!keyData.collected) {
        const d = this.playerPos.distanceTo(keyData.pos);
        if (d < 2.6) {
          const keyNames = { sun: 'Sun Key', ocean: 'Ocean Key', forest: 'Forest Key' };
          activePrompt = `Press [E] to Collect ${keyNames[keyId]}`;
          newTarget = keyId;
          break;
        }
      }
    }

    // 2. Check Rune Altar
    if (!activePrompt) {
      const dAltar = this.playerPos.distanceTo(this.altarPosition);
      if (dAltar < 3.8) {
        if (!this.questProgress.altarActivated) {
          if (this.questProgress.keysCount >= 3) {
            activePrompt = 'Press [E] to Place 3 Elemental Keys & Activate Altar';
            newTarget = 'altar';
          } else {
            activePrompt = `Rune Altar: Insert 3 Elemental Keys (${this.questProgress.keysCount}/3 found)`;
          }
        } else {
          activePrompt = 'Rune Altar is Activated! Proceed to Grand Escape Gate';
        }
      }
    }

    // 3. Check Grand Escape Gate
    if (!activePrompt) {
      const dGate = this.playerPos.distanceTo(this.gatePosition);
      if (dGate < 5.0) {
        if (this.questProgress.gateUnlocked) {
          activePrompt = 'Walk through the Portal to ESCAPE!';
          if (dGate < 2.5 && !this.isVictoryCelebration) {
            this.triggerVictory();
          }
        } else if (this.questProgress.altarActivated) {
          activePrompt = 'The Ancient Portal is Opening...';
        } else {
          activePrompt = 'Ancient Escape Gate is Sealed with 3 Rune Seals';
        }
      }
    }

    // 4. Check Unopened Treasure Chests
    if (!activePrompt) {
      for (const chest of this.chests) {
        if (!chest.opened) {
          const d = this.playerPos.distanceTo(chest.pos);
          if (d < 2.5) {
            activePrompt = `Press [E] to Open ${chest.name}`;
            newTarget = chest.id;
            break;
          }
        }
      }
    }

    // 5. Check Interactive Puzzles
    if (!activePrompt) {
      const dPillars = this.playerPos.distanceTo(new THREE.Vector3(24, getIslandHeight(24, -16), -16));
      if (dPillars < 3.2) {
        activePrompt = 'Press [E] to Solve Pillars of Sun Temple';
        newTarget = 'puzzle_symbol_matching';
      }

      const dLevers = this.playerPos.distanceTo(new THREE.Vector3(-16, getIslandHeight(-16, -8), -8));
      if (dLevers < 3.2 && !activePrompt) {
        activePrompt = 'Press [E] to Toggle Waterfall Rune Levers';
        newTarget = 'puzzle_switch_sequence';
      }

      const dRuneDial = this.playerPos.distanceTo(new THREE.Vector3(18, getIslandHeight(18, 16), 16));
      if (dRuneDial < 3.2 && !activePrompt) {
        activePrompt = 'Press [E] to Inspect Sacred Grove Rune Altar';
        newTarget = 'puzzle_rune_dial';
      }
    }

    // 6. Campsite Welcome Sign Tutorial Notice
    const signPos = _vec3A.set(-19, getIslandHeight(-19, 23), 23);
    const dSign = this.playerPos.distanceTo(signPos);
    const isNearSign = dSign < 3.5;
    if (isNearSign !== this.wasNearSign) {
      this.wasNearSign = isNearSign;
      if (this.onTutorialNotice) {
        this.onTutorialNotice(
          isNearSign
            ? {
                title: 'Explorer Signpost',
                text: 'Welcome Explorer! Seek the 3 Elemental Keys (Sun, Ocean, Forest) hidden across the island, then activate the central Rune Altar to unlock the Grand Escape Portal!',
              }
            : null
        );
      }
    }

    this.currentInteractTarget = newTarget;

    if (activePrompt !== this.lastActivePrompt) {
      this.lastActivePrompt = activePrompt;
      if (this.onPromptChange) {
        this.onPromptChange(activePrompt);
      }
    }

    // Handle interact trigger (E key or Mobile button)
    if (this.inputs.interact) {
      this.inputs.interact = false;
      this.handleInteract();
    }
  }

  public handleInteract() {
    if (!this.currentInteractTarget) return;

    if (this.currentInteractTarget.startsWith('puzzle_')) {
      if (this.onOpenPuzzleModal) {
        this.onOpenPuzzleModal(this.currentInteractTarget);
      }
      return;
    }

    if (this.currentInteractTarget === 'sun' || this.currentInteractTarget === 'ocean' || this.currentInteractTarget === 'forest') {
      const keyId = this.currentInteractTarget;
      const keyData = this.keys.get(keyId);
      if (keyData && !keyData.collected) {
        keyData.collected = true;
        this.scene.remove(keyData.group);
        sound.playKeyPickup();

        this.questProgress.keysCollected[keyId] = true;
        this.questProgress.keysCount = Object.values(this.questProgress.keysCollected).filter(Boolean).length;
        this.questProgress.coinsCollected += 50;
        this.questProgress.xpEarned += 100;

        const keyNames = { sun: 'Sun Key', ocean: 'Ocean Key', forest: 'Forest Key' };
        if (this.onToastNotification) {
          this.onToastNotification({
            type: 'key',
            title: `${keyNames[keyId]} Discovered!`,
            message: `Key added to inventory! +50 Gold, +100 XP`,
          });
        }

        if (this.onQuestUpdate) {
          this.onQuestUpdate({ ...this.questProgress });
        }
      }
    } else if (this.currentInteractTarget === 'altar') {
      if (this.questProgress.keysCount >= 3 && !this.questProgress.altarActivated) {
        this.questProgress.altarActivated = true;
        this.altar.setSolved(true);
        sound.playAltarActivate();

        // Start Gate opening sequence
        this.questProgress.gateOpening = true;
        this.questProgress.missionPhase = 'escape';
        sound.playGateOpening();

        if (this.onToastNotification) {
          this.onToastNotification({
            type: 'puzzle',
            title: 'Grand Rune Altar Activated!',
            message: 'Ancient Portal Seal Broken! ESCAPE NOW!',
          });
        }

        if (this.onQuestUpdate) {
          this.onQuestUpdate({ ...this.questProgress });
        }
      }
    } else {
      // Check if target is a treasure chest
      const targetChest = this.chests.find((c) => c.id === this.currentInteractTarget);
      if (targetChest && !targetChest.opened) {
        targetChest.opened = true;
        targetChest.instance.open();
        this.questProgress.chestsOpened++;
        this.questProgress.coinsCollected += targetChest.coinsReward;
        this.questProgress.xpEarned += targetChest.xpReward;
        sound.playChestOpen();

        if (this.onToastNotification) {
          this.onToastNotification({
            type: 'chest',
            title: targetChest.name,
            message: `Vault opened! +${targetChest.coinsReward} Gold, +${targetChest.xpReward} XP`,
          });
        }

        if (this.onQuestUpdate) {
          this.onQuestUpdate({ ...this.questProgress });
        }
      }
    }
  }

  private triggerVictory() {
    this.isVictoryCelebration = true;
    this.mode = 'victory';
    this.questProgress.missionPhase = 'resolve';
    if (this.onQuestUpdate) this.onQuestUpdate({ ...this.questProgress });
    sound.playVictoryFanfare();

    // Spawn victory celebration confetti particles
    const count = 300;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const colorChoices = [new THREE.Color(0xf1c40f), new THREE.Color(0x3498db), new THREE.Color(0x2ecc71), new THREE.Color(0xe74c3c), new THREE.Color(0x9b59b6)];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = this.gatePosition.x + (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = this.gatePosition.y + Math.random() * 8;
      positions[i * 3 + 2] = this.gatePosition.z + (Math.random() - 0.5) * 8;

      const c = colorChoices[i % colorChoices.length];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
    });

    this.victoryParticles = new THREE.Points(geo, mat);
    this.scene.add(this.victoryParticles);

    if (this.onVictory) {
      this.onVictory(this.questProgress.timeElapsed);
    }
  }

  public triggerFailure(reason = 'Mission Failed!') {
    this.mode = 'failure';
    sound.playLand();
    if (this.onFailure) {
      this.onFailure(reason);
    }
  }

  public getStealthDetection() {
    return this.guardAIController.getHighestDetection();
  }

  // --- Reset Game ---
  public resetGame(newSeed?: number) {
    this.mode = 'playing';
    this.isVictoryCelebration = false;
    this.playerPos.set(-22, 1.0, 24);
    this.playerVel.set(0, 0, 0);
    this.playerRotation = 0;
    this.cameraController.cameraPitch = 0.35;
    this.cameraController.cameraYaw = 0;
    this.stoneCooldown = 0;

    // Remove any leftover ripples
    this.stoneRipples.forEach((r) => {
      this.scene.remove(r.mesh);
      r.mesh.geometry.dispose();
      (r.mesh.material as THREE.Material).dispose();
    });
    this.stoneRipples = [];

    // Replay with same seed or generate new seed
    if (newSeed !== undefined) {
      this.currentSeed = newSeed;
    }
    this.setupKeys(this.currentSeed);

    // Reset altar & gate
    this.altar.setSolved(false);
    this.gate.setUnlocked(false, 0);

    // Remove victory particles
    if (this.victoryParticles) {
      this.scene.remove(this.victoryParticles);
      this.victoryParticles.geometry.dispose();
      this.victoryParticles = null;
    }

    // Reset chests
    this.chests.forEach((c) => {
      c.opened = false;
      c.instance.isOpen = false;
      c.instance.openProgress = 0;
      c.instance.lid.rotation.x = 0;
      c.instance.goldGlow.intensity = 0;
    });

    // Reset coins
    this.coins.forEach((coin) => {
      coin.collected = false;
      if (!coin.group.parent) {
        this.scene.add(coin.group);
      }
    });

    // Reset puzzles, course, survival, and guards
    puzzleSystem.resetPuzzles();
    obstacleSystem.resetCourse();
    survivalSystem.resetMission();
    this.guardAIController.resetGuards();

    const mission = getMissionConfig(this.questProgress.currentMissionId);

    this.questProgress = {
      keysCollected: { sun: false, ocean: false, forest: false },
      keysCount: 0,
      altarActivated: false,
      gateUnlocked: false,
      gateOpening: false,
      gateOpenProgress: 0,
      timeElapsed: 0,
      coinsCollected: 0,
      chestsOpened: 0,
      totalChests: this.chests.length,
      xpEarned: 0,
      puzzlesSolvedCount: 0,
      totalPuzzles: 3,
      crystalsCollected: 0,
      totalCrystals: 5,
      checkpointsReached: 0,
      totalCheckpoints: 5,
      survivalTimeRemaining: 240,
      survivalActive: true,
      caughtCount: 0,
      missionPhase: 'orient',
      sessionSeed: this.currentSeed,
      stoneCooldown: 0,
      // Phase 7 Hybrid Combat
      currentMissionId: mission.id,
      firearmAuthorized: mission.allowFirearms,
      ammoCount: mission.startingAmmo,
      maxAmmo: mission.maxAmmo,
      playerHealth: 100,
      maxPlayerHealth: 100,
      attackCooldown: 0,
      dodgeCooldown: 0,
      isParrying: false,
    };

    this.playerCombatState = 'idle';
    this.playerCombatTimer = 0;
    this.playerDodgeTimer = 0;
    this.playerInvincibilityTimer = 0;
    this.currentWeapon = mission.allowFirearms ? 'firearm' : 'blade';
    
    if (this.player) {
      this.player.setSwordVisible?.(!mission.allowFirearms);
    }

    this.lastReportedSecond = -1;
    this.lastActivePrompt = null;
    this.wasNearSign = false;

    if (this.onQuestUpdate) {
      this.onQuestUpdate({ ...this.questProgress });
    }
  }

  public setPlayerPosition(x: number, y: number, z: number) {
    this.playerPos.set(x, y, z);
    if (this.player) {
      this.player.group.position.set(x, y, z);
    }
  }

  public restoreSavedProgress(savedQuest: QuestProgress, pos: { x: number; y: number; z: number }) {
    if (savedQuest.sessionSeed) {
      this.currentSeed = savedQuest.sessionSeed;
      this.setupKeys(savedQuest.sessionSeed);
    }
    this.questProgress = { ...savedQuest };
    this.setPlayerPosition(pos.x, pos.y, pos.z);

    if (savedQuest.keysCollected) {
      const sunKey = this.keys.get('sun');
      if (sunKey && savedQuest.keysCollected.sun) {
        sunKey.collected = true;
        if (sunKey.group.parent) this.scene.remove(sunKey.group);
      }
      const oceanKey = this.keys.get('ocean');
      if (oceanKey && savedQuest.keysCollected.ocean) {
        oceanKey.collected = true;
        if (oceanKey.group.parent) this.scene.remove(oceanKey.group);
      }
      const forestKey = this.keys.get('forest');
      if (forestKey && savedQuest.keysCollected.forest) {
        forestKey.collected = true;
        if (forestKey.group.parent) this.scene.remove(forestKey.group);
      }
    }

    if (savedQuest.altarActivated) {
      this.altar.setSolved(true);
    }

    if (savedQuest.gateUnlocked) {
      this.gate.setUnlocked(true, 1.0);
    }

    if (this.onQuestUpdate) {
      this.onQuestUpdate({ ...this.questProgress });
    }
  }

  // Mouse & Touch Orbit Controls (Delegated to cameraController)
  public onPointerDrag(deltaX: number, deltaY: number) {
    this.cameraController.onPointerDrag(deltaX, deltaY);
  }

  public onZoom(delta: number) {
    this.cameraController.onZoom(delta);
  }

  public onResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public dispose() {
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.onResize);
    this.collisionSystem.clearObstacles();
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
