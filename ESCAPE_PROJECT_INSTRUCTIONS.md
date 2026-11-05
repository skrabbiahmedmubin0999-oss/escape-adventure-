# ESCAPE — Google AI Studio Project Instructions

## Project Overview
ESCAPE is a mobile-first 3D stealth/action game built with React 19, TypeScript, Three.js (WebGL PBR Engine), and Tailwind CSS.

## 1. Source-of-Truth & Workflow
- Treat existing source code as the source of truth.
- Work in small, reversible, phase-based changes.
- Preserve all working features, menus, settings, and save data.
- Run type checks (`npm run lint`) and compilation checks (`npm run build`) before declaring a phase complete.

## 2. Game Vision
- **Visual Target**: Grounded 3D environment, realistic proportions, PBR materials, dynamic lighting, contact shadows, and environmental storytelling.
- **Gameplay Target**: Smooth movement, fair stealth detection, readable enemy behavior, zero-clipping collision, stable camera, and responsive touch/keyboard controls.
- **Camera**: Advanced isometric 3D view with frame-rate independent exponential damping.

## 3. Engineering Rules
- Modular architecture: separate rendering (`IslandWorld.ts`), camera (`cameraController.ts`), physics (`collisionSystem.ts`), AI (`guardAI.ts`), assets (`proceduralAssets.ts`), audio (`soundSystem.ts`), and UI (`GameHUD.tsx`).
- 0-GC loop discipline: pre-allocate math vectors/quaternions at module scope.
- Bitmask collision layers: static world, player, guards, doors, triggers.
- Multi-substep anti-tunneling motion resolution.

## 4. How to Use the Prompt Pack
1. Paste these Project Instructions into Google AI Studio's Project Instructions.
2. Open the existing ESCAPE project.
3. Use Prompt 0 first to inspect the codebase without editing.
4. Execute Prompts 1 through 8 sequentially, verifying each phase before moving to the next.
5. If a build error occurs, provide the complete error message and request a targeted fix.
6. Keep secrets, passwords, and private tokens out of client code.
