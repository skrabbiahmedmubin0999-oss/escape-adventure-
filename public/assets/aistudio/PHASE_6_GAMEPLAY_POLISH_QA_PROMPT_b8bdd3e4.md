# PHASE 6 — Gameplay Polish, Fairness, Balance & Reliability
## ESCAPE: SHADOW ASSASSIN

You are the principal gameplay engineer, QA lead, and player-experience designer for **ESCAPE: SHADOW ASSASSIN**. Continue from the existing Phase 5 implementation. This is a focused polish and verification phase—not a redesign and not a feature-expansion sprint.

## Mission
Make the current short-session stealth loop feel fair, readable, responsive, and consistently enjoyable. Preserve the established 4–6 minute target as a playtest goal, not a forced timer. Improve only issues demonstrated by code inspection or reproducible testing.

## Phase 5 Baseline to Verify
The previous implementation report states that the game now includes:
- Mission phases: Orient, Execute, Escape, Resolve.
- Mission Briefing overlay and an Escape phase triggered when the portal opens.
- HUD Visibility Meter.
- Stone Throw distraction via Q/G and a mobile Distract button.
- Seeded randomization of elemental-key objective locations from curated candidate spots.
- Victory summary with Caught Count, Ghost rating, and bonus XP for undetected runs.
- Reported checks: `npm run build`, `npm run lint`, guard noise investigation, phase/UI transitions, and browser mobile emulation.

Treat these as **claims to verify**, not guaranteed facts. Inspect the actual current code and runtime before relying on them.

## Non-Negotiable Operating Rules
1. Create a project checkpoint/version-history snapshot before risky edits.
2. Audit the actual implementation first. Locate the mission state machine, briefing/phase UI, visibility calculation, stone-throw input/projectile/noise path, guard perception/investigation AI, seeded RNG and objective placement, victory rating/XP logic, save/progress, touch controls, camera, collision, LOD, and graphics presets.
3. Produce a concise audit summary, then implement the smallest safe fixes directly. Do not stop at a plan.
4. Preserve the existing engine, rendering architecture, advanced isometric camera, controls, player/enemy AI, collision, mission content, save/load, audio, HUD, graphics presets, instancing, and LOD.
5. Reuse existing systems. Do not create duplicate managers, input layers, mission state machines, RNG services, perception systems, or update loops.
6. Do not change `package.json`, lockfiles, `server.ts`, deployment settings, or secret management unless a verified blocker makes it unavoidable. Explain the blocker before such a change.
7. Do not install packages unless a demonstrated requirement cannot be met with existing dependencies.
8. Do not add placeholder UI, fake metrics, simulated rewards, artificial timers, forced retention mechanics, or features disconnected from real game state.
9. Never claim tests, device checks, FPS, frame times, or draw-call improvements that were not actually measured.

## Workstream A — Mission Flow and Session Pacing
- Verify every legal transition: Orient → Execute → Escape → Resolve, including failure, restart, pause/resume, and any existing alternate completion paths.
- Ensure phase transitions happen exactly once; prevent duplicate rewards, duplicate result screens, stale timers, and input leaking between phases.
- Make briefing concise, skippable/dismissible where appropriate, and avoid replaying unnecessary exposition on quick retry.
- Ensure the Escape phase is a meaningful, readable final gameplay beat. The portal/exit state, destination, and danger must be clear.
- Review whether ordinary missions can reasonably fit the 4–6 minute target. Use controlled playthrough timing or repeatable test scenarios where available. Do not shorten a mission by removing meaningful play or add a forced countdown.
- Identify and remove only verified dead time, confusing waits, or redundant interactions.

## Workstream B — Stealth Readability and Fairness
- Trace the Visibility Meter to the actual guard perception model. Its values and visual states must correspond to real exposure/detection risk.
- Check that lighting, cover, distance, line of sight, guard alert state, and any existing modifiers are represented consistently. Do not imply that a single visibility gauge fully predicts detection if the AI uses other factors.
- Ensure the meter is legible on small screens, has clear safe/warning/danger feedback, and does not obscure important gameplay.
- Verify detection escalation and recovery are understandable, with no unexplained instant detection or meter/UI desynchronization.
- Keep guard perception and line-of-sight behavior consistent at Low, Medium, and High graphics presets and across LOD changes.

## Workstream C — Stone Throw and Guard Investigation
- Verify desktop Q/G and mobile Distract inputs use the same gameplay action and cannot trigger duplicate throws from one input.
- Confirm throw range, collision, impact/noise event, cooldown or available-use rules (if already implemented), and feedback are consistent with the actual system.
- Confirm guards investigate valid noise sources, select sensible investigation targets, transition back to patrol/search correctly, and do not become stuck or oscillate indefinitely.
- Ensure distraction is useful but not an automatic guard-disable exploit. Adjust only when testing shows a real balance problem.
- Ensure throws cannot target invalid coordinates, bypass collision rules, or create unbounded objects/timers.

## Workstream D — Seeded Replayability and Objective Placement
- Verify seed lifecycle: a run is reproducible from its seed; a genuinely new expedition gets a new seed according to the existing design.
- Verify the same seed produces the same selected objective spots and that different seeds can produce valid variation.
- Ensure every candidate spot is curated and validated for reachability, collision, navigation, visibility, mission progression, and extraction compatibility.
- Ensure randomization never places keys inside geometry, beyond reachable boundaries, inside inaccessible LOD-only props, or in unfair guard sightlines.
- Preserve deterministic behavior for debugging and automated tests. Expose/log a seed only if an existing debug convention supports it; do not add public UI solely for this.
- Do not introduce unrestricted runtime randomness or randomize critical mission state without a deterministic seed.

## Workstream E — Results, Ghost Rating, and Rewards
- Trace Caught Count to actual detection/caught events and define what counts as “caught” from the existing game rules.
- Verify Ghost rating is awarded only when its stated conditions are truly met. Confirm distractions alone do not incorrectly count as detection or vice versa.
- Verify bonus XP is granted exactly once and is calculated from actual performance.
- Test completion, retry, app refresh/reload where supported, and save/load to ensure XP/progress cannot be duplicated or lost.
- Keep the results summary short, understandable, and satisfying. Do not add grind, loot boxes, streak pressure, artificial energy limits, or pay-to-win mechanics.

## Workstream F — Mobile UX and Performance Safety
- Test touch joystick, Distract, interact, pause, restart, and any existing action buttons at narrow mobile viewport sizes.
- Check touch target size, spacing, accidental overlap, HUD safe areas, text clipping, and landscape/portrait behavior supported by the current app.
- Confirm desktop keyboard controls remain functional.
- Preserve the existing camera behavior and avoid control/UI changes that make movement or aiming less predictable.
- Inspect new or modified loops for per-frame allocations, repeated scene traversal, event-listener leaks, unbounded timers, duplicate listeners, and undisposed Three.js resources.
- Verify Low/Medium/High presets and existing LOD behavior remain functional. Do not reduce all presets to the same low-quality configuration.

## Required Test Matrix
Run the checks that actually exist in the repository. At minimum, where the current project permits:

1. `npm run build`
2. `npm run lint`
3. Existing type-check and automated test commands, if present.
4. Start → Orient → Execute → Escape → Resolve.
5. Complete a mission without being detected; verify Ghost rating and bonus XP.
6. Complete a mission after being detected/caught; verify rating and Caught Count are accurate.
7. Throw a stone from keyboard and touch controls; verify one noise event and a valid guard investigation.
8. Restart immediately after failure and after success; verify clean state and no duplicate rewards.
9. Pause/resume during Execute and Escape; verify timers and state remain correct.
10. Run two expeditions with the same seed and compare objective placements; then run a new-seed expedition and verify valid variation.
11. Check objective placement and gameplay-critical visibility/collision at Low, Medium, and High presets.
12. Test mobile browser emulation at a narrow viewport. Clearly distinguish this from a physical-device test.

If a test cannot be automated, perform a reproducible manual test and record the exact steps and outcome. If unavailable, mark it **NOT TESTED** rather than assuming success.

## Change Scope
- Prefer bug fixes, calibration, accessibility/readability improvements, and test coverage.
- Avoid adding new mechanics in this phase.
- Do not rewrite the mission system or refactor unrelated files.
- If no defect is found in a workstream, leave it unchanged and report that it passed the audit.
- If a proposed change risks existing gameplay, do not force it; document the trade-off.

## Definition of Done
Phase 6 is complete only when:
- The four mission phases and recovery paths are stable and resolve exactly once.
- Detection feedback matches real AI perception closely enough to be fair and understandable.
- Stone Throw is consistent across keyboard and mobile input, and guard investigation reliably recovers.
- Seeded objective placement is reproducible, varied across new expeditions, and always valid.
- Ghost rating, Caught Count, and XP reflect actual events and cannot be awarded twice.
- Mobile controls and HUD remain usable without damaging the existing camera or gameplay.
- Build/lint/tests actually run are reported truthfully.
- Existing features and graphics presets remain intact.

## Required Final Report
Return a concise but evidence-based report with these headings:

1. **Audit Findings** — concrete defects or risks discovered; identify verified working areas too.
2. **Changes Implemented** — exact behavior and player benefit.
3. **Files Changed** — exact paths and reason for each.
4. **Verification** — exact commands, test scenarios, and pass/fail results.
5. **Seed Reproducibility** — seed values used and objective-placement comparison, if tested.
6. **Performance** — actual device/browser, viewport, graphics preset, scene, method, and measurements; otherwise state “NOT MEASURED.”
7. **Physical Device Testing** — explicitly state TESTED or NOT TESTED.
8. **Known Limitations** — unresolved issues and next risks.

Separate **implemented**, **automated-tested**, **manually-tested**, **emulated**, and **not-tested** results. Do not report estimated or invented metrics as measurements.
