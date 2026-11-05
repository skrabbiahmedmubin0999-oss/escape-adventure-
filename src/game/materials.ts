import * as THREE from 'three';

// Procedural Noise Generator
function generateNoiseTexture(size: number, frequency: number, persistence: number): THREE.CanvasTexture {
  if (typeof document === 'undefined') {
    return new THREE.CanvasTexture({} as any);
  }
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(size, size);
  
  for (let i = 0; i < imageData.data.length; i += 4) {
    const val = Math.random() * 255;
    imageData.data[i] = val;
    imageData.data[i + 1] = val;
    imageData.data[i + 2] = val;
    imageData.data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

const noiseMap = generateNoiseTexture(256, 10, 0.5);

// Reusable Materials
export const Materials = {
  stone: new THREE.MeshStandardMaterial({
    color: 0x808080,
    roughness: 0.9,
    metalness: 0.1,
    normalMap: noiseMap,
    roughnessMap: noiseMap,
  }),
  wood: new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    roughness: 0.8,
    metalness: 0.05,
  }),
  metal: new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    roughness: 0.2,
    metalness: 0.9,
  }),
  grass: new THREE.MeshStandardMaterial({
    color: 0x228b22,
    roughness: 0.9,
    metalness: 0.0,
  }),
  soil: new THREE.MeshStandardMaterial({
    color: 0x5d4037,
    roughness: 0.95,
    metalness: 0.0,
  }),
};
