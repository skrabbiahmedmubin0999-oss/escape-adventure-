# PHASE 7 — Hybrid Combat System Implementation
## ESCAPE: SHADOW ASSASSIN

You are the principal gameplay engineer, combat designer, AI engineer, and QA lead for **ESCAPE: SHADOW ASSASSIN**. Implement a polished, mobile-first hybrid combat system that combines:

- **Stealth** as the primary tactical approach.
- **Sword fighting** as the core close-combat option.
- **Firearms** as a limited, mission-specific option available only in explicitly authorized missions.

This is an implementation task, not a greenfield redesign. Inspect the current repository and runtime first, then integrate the smallest coherent system into the existing game.

---

## 1. Locked Design Decisions

These decisions are approved and must not be changed:

- Combat model: **Hybrid — Stealth + Sword Fighting + Shooting**.
- Firearms availability: **Limited; selected missions only**.
- The game remains a premium-feeling, mobile-first 3D stealth-action game with an advanced isometric camera.
- Typical mission duration remains approximately **4–6 minutes** as a pacing target, not a forced countdown.
- Stealth must remain viable and rewarding. Combat must not become the only effective solution.
- Firearms must never silently become available in every mission.
- Preserve the established short-session mission flow: Orient → Execute → Escape → Resolve.

## 2. Non-Negotiable Preservation Rules

1. Create a version-history checkpoint before risky edits.
2. Inspect the actual codebase and runtime before implementation. Verify the current player controller, animation/state system, input mapping, weapon or inventory code (if any), guard AI, perception/LOS, damage/health, collision/physics, mission configuration, HUD, audio, camera, save/load, LOD, and graphics presets.
3. Treat earlier phase reports as unverified claims. The repository is the source of truth.
4. Preserve the existing engine, rendering stack, scene architecture, advanced isometric camera, movement, touch joystick, stealth, guard AI, collision, mission flow, save/load, audio, HUD, instancing, LOD, and Low/Medium/High graphics presets.
5. Reuse existing systems. Do not create duplicate input managers, combat managers, health systems, AI perception systems, mission managers, animation controllers, update loops, or weapon inventories.
6. Do not replace the game with a new template or rewrite unrelated systems.
7. Do not change `package.json`, lockfiles, `server.ts`, deployment configuration, or secret management unless a verified blocker makes it essential. Explain the blocker before making such a change.
8. Do not install dependencies unless a demonstrated requirement cannot be met with the current stack.
9. Keep combat stylized and non-graphic. Prioritize readable timing, tactical choice, responsive controls, and clear feedback.
10. Never claim a feature, test, device check, FPS result, or performance improvement unless it was actually verified.

Before editing, provide a short audit summary and identify the exact files and systems that will be touched. Then implement; do not stop at a plan.

---

## 3. Combat Experience Goals

The player should be able to choose among three understandable approaches where level design permits:

1. **Ghost approach:** avoid detection, use cover and patrol timing, perform stealth takedowns, and escape quietly.
2. **Blade approach:** engage nearby guards with readable sword attacks, defensive timing, and evasive movement.
3. **Limited firearm approach:** use a mission-authorized firearm for a small number of tactical encounters, accepting the noise and increased enemy response.

These are tactical options, not three mandatory stages. A player should not be forced into a gunfight in a mission that does not authorize firearms.

Combat should feel responsive and fair:
- Every attack has clear startup, active, and recovery behavior.
- Enemy attacks have readable telegraphs and reasonable response windows.
- Damage has clear feedback and a consistent source.
- The player can recover from mistakes without being trapped in unavoidable hit loops.
- Combat transitions must not break movement, camera, mission state, stealth, or extraction.

---

## 4. Workstream A — Combat Architecture Audit and Integration

Trace the existing implementation and determine what can be reused.

Inspect at minimum:
- Player movement and action state transitions.
- Existing attack, interact, distract, and mobile control bindings.
- Player/enemy health and damage handling, if present.
- Guard patrol, alert, investigation, chase, attack, search, and recovery states.
- Existing animation clips, procedural animation, or fallback animation approach.
- Collision layers, hit detection, line of sight, and physics update conventions.
- Mission definitions and per-mission feature configuration.
- HUD layout, sound/VFX conventions, pause/restart, and result/reward flow.

Create or extend only the minimum necessary combat components. Keep interfaces typed and consistent with existing project conventions. Avoid tightly coupling combat logic to individual UI elements.

If the project lacks a required foundation, implement the smallest safe version that fits its architecture and explain the trade-off. Do not pretend an animation, hitbox, inventory, or AI capability exists if it does not.

---

## 5. Workstream B — Sword Combat

Implement a compact, learnable sword system using existing animation and movement conventions.

### Required behavior
- A responsive primary sword attack.
- A short, controlled combo chain only if it fits the existing animation/state architecture.
- A defensive action such as parry or guard, with a clear timing window and readable feedback.
- An evasive action such as dodge/roll only if it can be integrated without breaking movement or camera control.
- Attack range and hit detection must be consistent with the visible sword motion.
- Prevent attacks from repeatedly hitting the same target during one attack window unless the intended design explicitly supports it.
- Add sensible recovery/cooldown behavior to prevent input spam and animation-state conflicts.
- Make interruption rules clear: damage, dodge, death, pause, mission transition, and restart must not leave the player stuck in an attack state.

### Balance principles
- Sword combat should be useful at close range but carry risk when surrounded.
- Stealth takedowns should remain distinct from open combat.
- Do not make every guard a damage sponge. Prefer readable enemy roles and tactical positioning over inflated health.
- Avoid unavoidable stun-locks, infinite combos, or attacks that ignore collision and line of sight.

### Feedback
Use existing project conventions for attack animation, impact response, restrained VFX, sound, and HUD feedback. Do not add excessive screen shake or effects that obscure the isometric battlefield.

---

## 6. Workstream C — Limited Firearms and Mission Authorization

Firearms are **mission-specific**, not globally available.

### Mission configuration
- Inspect the current mission data/configuration pattern.
- Add the smallest explicit per-mission capability flag or equivalent configuration, following existing conventions.
- Default every mission to firearms disabled unless it is explicitly configured as firearm-authorized.
- Keep the list of authorized missions centralized and auditable through existing mission data; do not scatter mission-name checks throughout gameplay code.
- If no mission is currently suitable, keep firearms disabled by default and add no arbitrary authorization. Report that mission configuration remains to be assigned.

### Firearm behavior
If a mission is explicitly authorized:
- Provide one simple, readable firearm behavior compatible with the current game architecture.
- Use a limited ammunition supply. Do not add unlimited ammunition.
- Make ammunition count and firearm availability clear to the player.
- Firearms must create a meaningful noise/alert consequence using the existing sound/noise and guard investigation systems.
- Guard reactions must be grounded in actual AI perception and sound propagation already supported by the game.
- Prevent firing when ammunition is empty, the player is incapacitated, paused, in a menu, or in an incompatible action state.
- Ensure projectile/raycast/hit detection follows the existing collision and damage architecture. Do not create a parallel physics system.
- Avoid firing through walls, closed geometry, or invalid targets.
- Keep aim understandable with the advanced isometric camera and usable on touchscreens. Use conservative aim assistance only if necessary and consistent with existing targeting logic.

### Restrictions
- No firearm UI, pickups, ammo drops, or firing controls should appear in missions where firearms are disabled.
- Do not let a player carry a firearm into a non-authorized mission through restart, save/load, mission transition, or stale inventory state.
- Do not turn every guard encounter into a shooting encounter.
- Do not add multiple gun classes, attachments, crafting, shops, or a complex loot system in this phase.

---

## 7. Workstream D — Guard Combat AI and Fairness

Extend the existing guard AI; do not replace it.

Verify and integrate sensible transitions among the states the current project actually supports, such as:
- Patrol.
- Suspicious / investigate.
- Alert / pursue.
- Engage at appropriate range.
- Search / recover.
- Return to patrol when conditions permit.

Requirements:
- Guards should react to visible attacks and firearm noise through existing perception/noise pathways.
- Guards must not know the player's location without a valid perception or investigation reason.
- Use existing LOS and collision checks; do not bypass walls or LOD rules.
- Give attacks readable telegraphs and consistent range/timing.
- Avoid multiple guards stacking into an unavoidable hit loop.
- Ensure guards can lose the player, search plausible last-known locations, and recover according to existing AI design.
- Keep AI behavior deterministic enough for repeatable tests where the project already uses seeded scenarios.
- Preserve existing stone-throw distraction behavior. A firearm noise event must not break or replace the stone-throw noise path.

Do not make guards unrealistically accurate or omniscient just to increase difficulty.

---

## 8. Workstream E — Stealth and Combat Interoperability

Stealth remains the defining pillar of the game.

- Preserve existing visibility meter semantics and ensure it still reflects actual perception logic.
- Sword attacks, takedowns, firearm use, and noise events must update detection/alert state through the existing systems.
- A stealth takedown must not accidentally trigger open-combat behavior unless the actual design requires it.
- Combat must not disable cover, line of sight, sound investigation, or escape mechanics.
- The player must be able to disengage and return to stealth when the current AI and mission state allow it.
- Ensure the Ghost rating and Caught Count logic remain truthful. Do not award a Ghost result if the actual run violated its conditions.
- Do not equate every combat action with being caught; use the project's actual detection/caught definitions.

---

## 9. Workstream F — Mobile-First Controls and HUD

Preserve existing touch controls and add only the controls needed for the approved combat design.

### Mobile
- Use compact, clearly separated action buttons for sword attack and the defensive/evasive action that is actually implemented.
- Show a firearm action and ammunition only in firearm-authorized missions.
- Prevent overlap with joystick, Distract, Interact, Pause, and existing HUD.
- Respect safe areas and narrow viewport layouts.
- Provide clear pressed/disabled/cooldown feedback.
- Ensure one touch produces one action; prevent duplicate events from pointer/touch handling.
- Keep touch targets comfortably tappable without covering important gameplay.

### Desktop
- Use the project's existing input mapping conventions.
- Avoid conflicts with movement, interaction, Distract (including existing Q/G mapping), pause, and other actions.
- Display concise control hints where appropriate.

### HUD
- Keep the screen uncluttered.
- Display only relevant combat state: health/status if already supported, sword action feedback, and firearm ammunition only when authorized.
- Do not add fake health/ammo values or decorative controls that do not invoke real gameplay actions.

---

## 10. Workstream G — Mission Pacing, Rewards, and Replayability

- Preserve Orient → Execute → Escape → Resolve and all existing recovery paths.
- Keep the 4–6 minute session target as a playtest goal, not a forced timer.
- Make combat encounters short, purposeful, and avoid unnecessary waves or repeated enemy spawns.
- Provide at least one viable stealth route in firearm-authorized missions where level geometry permits.
- Firearms should create a tactical trade-off: immediate capability in exchange for noise, limited ammunition, and increased alert risk.
- Do not make firearm use mandatory to complete a mission.
- Keep Ghost rating, Caught Count, XP, and mission completion based on actual gameplay events.
- Prevent duplicate rewards or combat state persistence across retries and mission transitions.
- Do not add grind, loot boxes, pay-to-win mechanics, artificial energy limits, or manipulative retention systems.

---

## 11. Workstream H — Performance, LOD, and Resource Safety

- Preserve existing instancing, LOD, and Low/Medium/High graphics presets.
- Gameplay-critical guards, player, projectiles, hit detection, objectives, and collision must remain correct at every preset.
- LOD must not hide gameplay-critical targets or change collision/line-of-sight behavior.
- Avoid per-frame allocations, repeated full-scene traversals, unbounded timers, duplicate listeners, and undisposed Three.js resources.
- Dispose of temporary projectile, trail, VFX, and audio resources according to existing lifecycle patterns.
- Use pooled/reused objects only if the project already has a compatible pattern or profiling demonstrates a need.
- Profile before making performance claims. Record device/browser, viewport, scene, preset, method, and actual values where instrumentation exists.

---

## 12. Required Test Matrix

Run the checks available in the repository and report exact results.

### Build and static checks
1. `npm run build`
2. `npm run lint`
3. Existing type-check and test commands, if present.

### Sword combat
4. Sword attack hits a valid nearby target once per attack window.
5. Attack does not hit through walls or outside its valid range.
6. Defensive/evasive action works and has correct timing/state recovery.
7. Repeated input cannot create infinite combos, duplicate hits, or stuck states.
8. Pause, restart, death/failure, and mission transition reset combat states correctly.

### Firearm authorization and behavior
9. Start a non-authorized mission: no firearm control, ammo UI, weapon, or firing action is available.
10. Start an explicitly authorized mission: firearm appears and works with limited ammunition.
11. Empty ammunition prevents firing and gives clear feedback.
12. Firing creates one valid noise event and guards investigate/respond through existing AI.
13. Firearm cannot persist into a non-authorized mission after restart, reload, or mission transition.
14. Shots cannot pass through walls or damage invalid/out-of-range targets.

### Stealth and AI
15. Complete a mission using stealth only.
16. Trigger open sword combat and verify guard alert, pursuit, attack, search, and recovery behavior.
17. Fire a weapon and verify the correct noise/alert response.
18. Verify stone-throw distraction still works independently.
19. Verify visibility meter, Ghost rating, Caught Count, and XP remain consistent with actual events.

### Mobile and graphics
20. Test joystick, sword, defensive/evasive action, firearm (authorized mission only), Distract, Interact, Pause, and Restart at a narrow mobile viewport.
21. Test desktop keyboard controls and ensure no binding conflicts.
22. Check Low, Medium, and High presets for combat, collision, visibility, and LOD correctness.
23. Test mission completion, retry, pause/resume, and save/load where supported.

If a scenario cannot be automated, perform a reproducible manual test and record the exact steps and result. If it cannot be performed, mark **NOT TESTED**. Distinguish automated tests, manual browser tests, mobile emulation, and physical-device tests.

---

## 13. Implementation Order

Implement in small, verifiable slices:

1. **Audit and checkpoint:** map the existing architecture and report the intended file scope.
2. **Core sword loop:** implement and test one reliable sword attack plus the minimum viable defense/evasion supported by existing systems.
3. **AI integration:** connect sword combat to existing guard states, damage, perception, and recovery.
4. **Mission-gated firearm:** implement the authorization gate first; then add the minimal firearm behavior only for explicitly authorized missions.
5. **Mobile UX:** add context-sensitive touch controls and HUD without breaking existing controls.
6. **Integration QA:** test mission flow, stealth, distractions, rewards, save/retry, LOD, and graphics presets.

After each slice, run relevant checks and fix regressions before continuing. If a slice exposes a foundational issue, stop and report it rather than building more systems on top of a broken foundation.

---

## 14. Definition of Done

The phase is complete only when:
- Sword combat is responsive, readable, and integrated with existing damage/animation/collision systems.
- Guard combat behavior is fair and uses existing AI perception and state management.
- Firearms are strictly disabled by default and available only in explicitly authorized missions.
- Limited ammunition, firearm noise, and guard response work as real gameplay systems.
- Stealth remains viable and rewarding; firearms are not mandatory.
- Mobile and desktop controls work without breaking existing inputs or the isometric camera.
- Mission phases, restart, pause/resume, save/load, rewards, and results remain reliable.
- Low/Medium/High presets, LOD, collision, and gameplay-critical visibility remain correct.
- Build/lint/tests actually run are reported truthfully.
- No unrelated systems or project configuration are changed without a verified reason.

---

## 15. Required Final Report

Use these headings:

1. **Architecture Audit** — actual systems found and what was reused.
2. **Combat Design Implemented** — sword behavior, defense/evasion, and combat feedback.
3. **Firearm Mission Gating** — exact authorized mission IDs/names; explicitly list missions where firearms remain disabled.
4. **Guard AI Integration** — perception, noise, combat, search, and recovery behavior.
5. **Mobile and Desktop Controls** — exact controls and HUD changes.
6. **Files Changed** — exact paths and reason for each.
7. **Verification** — commands and scenario-by-scenario pass/fail/NOT TESTED results.
8. **Performance** — actual device/browser, viewport, scene, preset, method, and measurements; otherwise state **NOT MEASURED**.
9. **Physical Device Testing** — explicitly state **TESTED** or **NOT TESTED**.
10. **Known Limitations and Risks** — honest unresolved issues and next steps.

Separate **implemented**, **automated-tested**, **manually-tested**, **emulated**, and **not-tested** results. Do not invent test results, performance metrics, authorized missions, or existing code capabilities.
