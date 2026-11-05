export interface MissionConfig {
  id: string;
  title: string;
  description: string;
  allowFirearms: boolean; // Strict locked rule: Default false; only explicitly authorized missions set to true
  startingAmmo: number;
  maxAmmo: number;
  firearmNoiseRadius: number;
}

export const MISSION_CONFIGS: Record<string, MissionConfig> = {
  mission_shadow_escape: {
    id: 'mission_shadow_escape',
    title: 'Shadow Island Infiltration',
    description: 'Infiltrate the island unseen. Recover the 3 Elemental Keys and escape through the Northern Portal. Stealth & blade only.',
    allowFirearms: false,
    startingAmmo: 0,
    maxAmmo: 0,
    firearmNoiseRadius: 0,
  },
  mission_sunken_garrison: {
    id: 'mission_sunken_garrison',
    title: 'Sunken Garrison Siege',
    description: 'High-threat tactical strike operation. Limited flintlock firearm authorized (4 rounds). Gunshots create loud 24m noise alerting sentries.',
    allowFirearms: true,
    startingAmmo: 4,
    maxAmmo: 4,
    firearmNoiseRadius: 24.0,
  },
  mission_night_harvest: {
    id: 'mission_night_harvest',
    title: 'Silent Night Harvest',
    description: 'Recover ancient crystals under sentry watch. Pure stealth, distractions, and blade combat.',
    allowFirearms: false,
    startingAmmo: 0,
    maxAmmo: 0,
    firearmNoiseRadius: 0,
  },
};

export function getMissionConfig(missionId?: string): MissionConfig {
  if (missionId && MISSION_CONFIGS[missionId]) {
    return MISSION_CONFIGS[missionId];
  }
  return MISSION_CONFIGS['mission_shadow_escape'];
}

export interface SolidObjectManifestItem {
  id: string;
  category: 'building' | 'structure' | 'foliage' | 'prop' | 'vehicle' | 'barrier';
  name: string;
  position: { x: number; y: number; z: number };
  scale?: { x: number; y: number; z: number };
  collisionShape: 'cylinder' | 'box';
  collisionBounds: {
    radius?: number;
    width?: number;
    height?: number;
    depth?: number;
  };
  isWalkableInterior?: boolean;
  stealthCoverType?: 'full' | 'crouch' | 'foliage';
}

export interface LevelZoneManifest {
  zoneId: string;
  name: string;
  center: { x: number; z: number };
  radius: number;
  description: string;
  connectedPathsTo: string[];
}

export const LEVEL_ZONES: LevelZoneManifest[] = [
  {
    zoneId: 'zone_beach',
    name: 'South-West Beach Landing',
    center: { x: -22, z: 24 },
    radius: 12,
    description: 'Starting beach campsite, supply crates, pier, and signpost.',
    connectedPathsTo: ['zone_outpost', 'zone_village'],
  },
  {
    zoneId: 'zone_outpost',
    name: 'Coastal Guard Outpost',
    center: { x: -26, z: 10 },
    radius: 10,
    description: 'Guarded watchtower, perimeter fences, supply wagon, and lanterns.',
    connectedPathsTo: ['zone_beach', 'zone_gorge'],
  },
  {
    zoneId: 'zone_village',
    name: 'Valley Village Settlement',
    center: { x: -8, z: 8 },
    radius: 14,
    description: 'Cobblestone cottages, courtyard, hedges, streetlamps, benches, and stealth crates.',
    connectedPathsTo: ['zone_beach', 'zone_plaza', 'zone_gorge'],
  },
  {
    zoneId: 'zone_gorge',
    name: 'River Gorge & Bridge',
    center: { x: -16, z: -4 },
    radius: 10,
    description: 'Wooden arched bridge across river gorge, moving platform, waterfall grotto.',
    connectedPathsTo: ['zone_outpost', 'zone_village', 'zone_temple'],
  },
  {
    zoneId: 'zone_plaza',
    name: 'Central Rune Plaza',
    center: { x: 0, z: 2 },
    radius: 10,
    description: 'Central Rune Altar, crossroads, and ancient stone dais.',
    connectedPathsTo: ['zone_village', 'zone_grove', 'zone_gate'],
  },
  {
    zoneId: 'zone_temple',
    name: 'Sun Temple Ruins',
    center: { x: 18, z: -18 },
    radius: 14,
    description: 'North-East sandstone hill ruins, symbol pillars, and terrace.',
    connectedPathsTo: ['zone_gorge', 'zone_plaza', 'zone_gate'],
  },
  {
    zoneId: 'zone_grove',
    name: 'Sacred Ancient Grove',
    center: { x: 20, z: 18 },
    radius: 12,
    description: 'Ancient giant tree, rune dial altar, bioluminescent flora, and pine grove.',
    connectedPathsTo: ['zone_plaza', 'zone_gate'],
  },
  {
    zoneId: 'zone_gate',
    name: 'Grand Escape Portal Extraction',
    center: { x: 0, z: -30 },
    radius: 10,
    description: 'Northern cliff extraction portal, finish arch, and fortress pillars.',
    connectedPathsTo: ['zone_plaza', 'zone_temple', 'zone_grove'],
  },
];

export const SOLID_OBJECTS_MANIFEST: SolidObjectManifestItem[] = [
  // Village Cottages
  {
    id: 'cottage_north',
    category: 'building',
    name: 'Village Stone Cottage (North)',
    position: { x: -10, y: 1.2, z: 12 },
    collisionShape: 'box',
    collisionBounds: { width: 6.2, height: 3.8, depth: 5.2 },
    isWalkableInterior: true,
    stealthCoverType: 'full',
  },
  {
    id: 'cottage_south',
    category: 'building',
    name: 'Village Timber Storehouse (South)',
    position: { x: -4, y: 1.4, z: 16 },
    collisionShape: 'box',
    collisionBounds: { width: 5.4, height: 3.5, depth: 4.8 },
    isWalkableInterior: true,
    stealthCoverType: 'full',
  },

  // Outpost & Guard Tower
  {
    id: 'watchtower_coastal',
    category: 'structure',
    name: 'Coastal Guard Watchtower',
    position: { x: -28, y: 0.8, z: 8 },
    collisionShape: 'cylinder',
    collisionBounds: { radius: 1.8, height: 6.5 },
    stealthCoverType: 'full',
  },

  // Vehicles & Wagons
  {
    id: 'supply_wagon_01',
    category: 'vehicle',
    name: 'Merchant Wooden Supply Wagon',
    position: { x: -12, y: 1.1, z: 18 },
    collisionShape: 'box',
    collisionBounds: { width: 2.2, height: 2.0, depth: 3.8 },
    stealthCoverType: 'crouch',
  },

  // Fences & Barriers
  {
    id: 'fence_village_west',
    category: 'barrier',
    name: 'Village Perimeter Timber Fence',
    position: { x: -14, y: 1.0, z: 14 },
    collisionShape: 'box',
    collisionBounds: { width: 0.4, height: 1.4, depth: 6.0 },
    stealthCoverType: 'crouch',
  },

  // Hedges
  {
    id: 'hedge_courtyard',
    category: 'foliage',
    name: 'Courtyard Dense Boxwood Hedge',
    position: { x: -6, y: 1.3, z: 10 },
    collisionShape: 'box',
    collisionBounds: { width: 0.8, height: 1.5, depth: 4.5 },
    stealthCoverType: 'foliage',
  },

  // Streetlamps
  {
    id: 'streetlamp_village',
    category: 'prop',
    name: 'Iron Streetlamp (Village Plaza)',
    position: { x: -8, y: 1.2, z: 8 },
    collisionShape: 'cylinder',
    collisionBounds: { radius: 0.3, height: 3.2 },
  },
  {
    id: 'streetlamp_temple_path',
    category: 'prop',
    name: 'Iron Streetlamp (Temple Approach)',
    position: { x: 8, y: 2.2, z: -8 },
    collisionShape: 'cylinder',
    collisionBounds: { radius: 0.3, height: 3.2 },
  },

  // Benches
  {
    id: 'park_bench_village',
    category: 'prop',
    name: 'Courtyard Wooden Bench',
    position: { x: -7, y: 1.2, z: 6 },
    collisionShape: 'box',
    collisionBounds: { width: 1.6, height: 0.9, depth: 0.7 },
    stealthCoverType: 'crouch',
  },
];
