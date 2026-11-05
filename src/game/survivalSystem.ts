import * as THREE from 'three';
import { SurvivalMissionState } from './types';
import { sound } from '../audio/soundSystem';

export interface SurvivalCrystalData {
  id: string;
  name: string;
  group: THREE.Group;
  pos: THREE.Vector3;
  collected: boolean;
}

export class SurvivalSystem {
  public crystals: SurvivalCrystalData[] = [];
  public state: SurvivalMissionState = {
    active: false,
    title: 'Crystal Explorer Mission',
    description: 'Gather 5 Ancient Energy Crystals across Mystery Island before dusk!',
    targetCrystals: 5,
    crystalsCollected: 0,
    timeLimit: 240, // 4 minutes
    timeRemaining: 240,
    completed: false,
    failed: false,
  };

  public onCrystalCollected?: (collectedCount: number, total: number) => void;
  public onMissionCompleted?: (rewardCoins: number, rewardXp: number) => void;
  public onMissionFailed?: () => void;

  public startMission() {
    this.state = {
      active: true,
      title: 'Crystal Explorer Mission',
      description: 'Gather 5 Ancient Energy Crystals across Mystery Island before dusk!',
      targetCrystals: 5,
      crystalsCollected: 0,
      timeLimit: 240,
      timeRemaining: 240,
      completed: false,
      failed: false,
    };
    this.crystals.forEach((c) => {
      c.collected = false;
      c.group.visible = true;
    });
  }

  public registerCrystal(id: string, name: string, group: THREE.Group, pos: THREE.Vector3) {
    this.crystals.push({
      id,
      name,
      group,
      pos,
      collected: false,
    });
  }

  public update(dt: number, time: number, playerPos: THREE.Vector3) {
    // Spin floating crystals
    this.crystals.forEach((c) => {
      if (!c.collected) {
        c.group.rotation.y = time * 2.5;
        const crystalMesh = c.group.getObjectByName('CrystalMesh');
        if (crystalMesh) {
          crystalMesh.position.y = 0.8 + Math.sin(time * 3.0 + c.pos.x) * 0.15;
        }

        // Proximity Pickup check
        if (this.state.active && !this.state.completed && !this.state.failed) {
          const d = playerPos.distanceTo(c.group.position);
          if (d < 1.6) {
            c.collected = true;
            c.group.visible = false;
            this.state.crystalsCollected++;
            sound.playCoinPickup();

            if (this.onCrystalCollected) {
              this.onCrystalCollected(this.state.crystalsCollected, this.state.targetCrystals);
            }

            if (this.state.crystalsCollected >= this.state.targetCrystals) {
              this.state.completed = true;
              sound.playVictoryFanfare();
              if (this.onMissionCompleted) {
                this.onMissionCompleted(120, 250);
              }
            }
          }
        }
      }
    });

    // Update Survival Timer
    if (this.state.active && !this.state.completed && !this.state.failed) {
      this.state.timeRemaining = Math.max(0, this.state.timeRemaining - dt);
      if (this.state.timeRemaining <= 0) {
        this.state.failed = true;
        sound.playLand();
        if (this.onMissionFailed) {
          this.onMissionFailed();
        }
      }
    }
  }

  public resetMission() {
    this.startMission();
  }
}

export const survivalSystem = new SurvivalSystem();
