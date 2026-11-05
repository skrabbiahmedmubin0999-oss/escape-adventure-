# PHASE 5 — Short-Session Gameplay, Mission Flow & Replayability

You are the senior gameplay engineer and player-experience designer for **ESCAPE: SHADOW ASSASSIN**. Implement this phase directly in the existing project. The goal is to make the game genuinely enjoyable in short sessions without making it repetitive, bloated, manipulative, or technically fragile.

## Product Objective
Create a satisfying mission loop in which a typical mission takes approximately **4–6 minutes**. This is a pacing target, not a mandatory countdown. Players should be able to complete one meaningful mission, feel rewarded, and stop comfortably—or replay because they want to improve their approach.

## Mandatory First Step: Audit Before Editing
Inspect the actual repository and current runtime. Locate and understand the existing:
- mission/objective flow and mission data;
- player movement, touch controls, camera, and interaction systems;
- guard AI, perception, patrols, stealth/detection feedback, and combat/takedown flow;
- level/scene composition, collision, line of sight, and extraction/end-state logic;
- HUD, pause, restart, results, save/progress, audio, graphics presets, instancing, and LOD systems.

Use the current source as the authority. Previous AI-generated summaries or performance claims are not proof. Identify the most important real causes of friction, repetition, unclear feedback, or unnecessary downtime. Do not invent missing files or assume a system exists before checking.

## Implementation Scope
After the audit, implement the smallest coherent vertical slice that improves the existing mission experience. Do not redesign or rewrite the whole game.

### A. Mission Rhythm
Where compatible with the current architecture, shape the mission into these beats:
1. **Orient — 15–30 sec:** show one clear primary objective and only essential controls/hints.
2. **Observe — 30–60 sec:** let the player quickly understand patrols, cover, sightlines, and route opportunities.
3. **Execute — 2–4 min:** provide the core stealth/action challenge with meaningful tactical decisions.
4. **Escape — 30–60 sec:** create a distinct extraction beat with clear feedback.
5. **Resolve — 15–30 sec:** show concise results, reward/progress, and clear Replay / Continue choices.

Do not add artificial waiting, excessive walking, unnecessary menus, or long unskippable exposition. Do not impose a main-mission countdown unless the current game design already depends on it.

### B. Tactical Choice and Mission Variety
- Preserve the current level layout and gameplay identity.
- Give the player at least two viable tactical choices when the existing environment supports them (for example, a quiet route, distraction, environmental interaction, or a riskier direct route).
- Add variety through carefully authored patrol variants, optional intel/skill objectives, environmental opportunities, or extraction variations—choose only what fits the current systems.
- If variations are randomized, use bounded, reproducible selection (seeded or curated variants). Never spawn enemies or objectives in unfair, unreachable, collision-breaking, or line-of-sight-breaking positions.
- Do not increase enemy health/count as the default answer to boredom.
- Reward stealth, observation, smart routing, clean execution, and optional objectives. Do not make killing every enemy mandatory unless the established mission explicitly requires it.

### C. Player Feedback and Game Feel
- Make objective state, guard awareness, detection, danger, interaction availability, and extraction status readable at a glance.
- Ensure important feedback is timely and consistent with actual game state; avoid misleading UI.
- Make restart, pause/resume, and mission completion intuitive and fast.
- Give failure a clear cause and a quick recovery path. Avoid replaying long introductions after failure.
- Use concise onboarding hints that can be dismissed or skipped after the player understands the controls.
- Keep the HUD focused. Do not cover important gameplay space with large panels or excessive text.

### D. Reward and Replay Loop
- On completion, provide a short and satisfying summary: completion status, optional objective result, a simple skill/stealth rating if supported, and earned progression.
- Rewards must be fair, understandable, and tied to player performance or exploration.
- Offer replay for mastery and a clear next step. Do not add loot boxes, pay-to-win boosts, forced daily streaks, artificial energy limits, manipulative FOMO, or grind designed only to extend playtime.
- Save completed progress using the existing save architecture. Do not introduce a new backend or account system for this phase.

### E. Mobile and Performance Constraints
- Keep the existing advanced isometric 3D camera and mobile-first touch experience.
- Preserve the current rendering engine, control scheme, collision/physics, enemy AI, objectives, save/load, audio, graphics presets, instancing, and LOD behavior.
- Reuse existing systems. Do not create duplicate managers or parallel update loops.
- Avoid per-frame allocations and expensive scene scans. Any new mission/variation logic should be event-driven or updated at an appropriate controlled frequency.
- Gameplay-critical objects must remain correct at Low, Medium, and High settings. LOD must not alter collision, visibility logic, objective state, or guard perception unfairly.
- Keep the game responsive on mobile. Measure actual performance if instrumentation is available; do not invent FPS or draw-call improvements.

## Strict Change Controls
- Make a checkpoint using the project's available version-history mechanism before risky edits.
- Change only files needed for this vertical slice. Follow existing conventions and TypeScript types.
- Do not replace the game, restructure unrelated folders, remove existing features, or install packages without a demonstrated need.
- Do not edit `package.json`, lockfiles, `server.ts`, deployment settings, or secrets for this phase unless a verified blocker makes it unavoidable. If unavoidable, explain the exact blocker and proposed minimal change before proceeding.
- Do not add placeholder buttons, fake mission states, simulated rewards, or UI that is not connected to real game state.
- Do not claim that a test passed unless you actually ran it.

## Required Verification
Run all relevant checks available in the project and test the affected gameplay flow:
1. Start a mission and understand the objective without lengthy instructions.
2. Move and interact using mobile/touch controls.
3. Observe guards and confirm detection/stealth feedback matches actual perception logic.
4. Complete the objective through each supported approach.
5. Reach extraction and confirm the mission resolves exactly once.
6. Confirm result/reward/progress, then Replay and Continue.
7. Pause/resume and restart without stale timers, duplicated enemies, or broken state.
8. Verify collision, line of sight, objectives, and gameplay-critical entities at Low, Medium, and High presets.
9. Run build, type-check, lint, and automated tests that exist in the repository.
10. If physical-device testing is unavailable, say so explicitly. Separate emulator/browser testing from real-device testing.

## Acceptance Criteria
This phase is accepted only if:
- The mission loop is clear and has a satisfying beginning, middle, escape, and ending.
- A normal playthrough is designed around roughly 4–6 minutes without forcing a timer or padding the mission.
- The player has meaningful choices and at least one reason to replay beyond simply defeating more enemies.
- Repetition is reduced through grounded, fair variation—not random unfairness or inflated difficulty.
- Pause, restart, extraction, results, and progress work with real game state.
- Existing camera, movement, AI, collision, objectives, audio, HUD, graphics presets, instancing, and LOD remain intact.
- Available checks pass, and untested areas are clearly disclosed.

## Final Report Format
When finished, provide:
- **Audit findings:** the concrete friction/repetition issues found in the actual code.
- **Implementation:** what changed and how the player experience improved.
- **Files changed:** exact paths and a one-line reason for each.
- **Verification:** commands/tests actually run and their real results.
- **Performance evidence:** measured data with device/browser, preset, scene, and method—or state “not measured.”
- **Known limitations:** anything incomplete or not physically tested.

Do not stop after writing a plan. Inspect, make the smallest safe implementation, verify it, and report honestly. If the current architecture cannot safely support a proposed feature, omit that feature and explain why rather than forcing a rewrite.
