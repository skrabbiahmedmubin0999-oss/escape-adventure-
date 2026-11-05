import * as THREE from 'three';

export class LODSystem {
  private objects: { lod: THREE.LOD | THREE.Object3D; maxDistance: number; isThreeLOD: boolean }[] = [];
  private lastUpdateTime: number = 0;
  private updateInterval: number = 0.2; // Update every 200ms
  private distanceFactor: number = 1.0;

  public setDistanceFactor(factor: number) {
    this.distanceFactor = factor;
  }

  public register(object: THREE.LOD | THREE.Object3D, maxDistance: number) {
    this.objects.push({ 
      lod: object, 
      maxDistance, 
      isThreeLOD: object instanceof THREE.LOD 
    });
  }

  public update(camera: THREE.Camera, time: number) {
    if (time - this.lastUpdateTime < this.updateInterval) return;
    this.lastUpdateTime = time;

    const cameraPosition = camera.position;

    for (const entry of this.objects) {
      const distSq = entry.lod.position.distanceToSquared(cameraPosition);
      const scaledMaxDist = entry.maxDistance * this.distanceFactor;
      const inRange = distSq < scaledMaxDist * scaledMaxDist;

      if (entry.isThreeLOD) {
        // THREE.LOD handles levels, we just handle the final cull
        (entry.lod as THREE.LOD).update(camera);
        entry.lod.visible = inRange;
      } else {
        // Manual binary cull for simple objects
        entry.lod.visible = inRange;
      }
    }
  }
}
