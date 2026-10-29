# Piece by Piece: Game design foundation

## The promise

**Build a city, walk through your creation, then help free the world.** Piece by Piece is a tranquil tabletop architectural puzzle game wrapped around a city-adventure campaign. Desktop and WebXR players share one deterministic content model.

## Core loop

1. **Workshop (calm):** choose an unfinished building, inspect its 3D parts, turn/snap/fit pieces without a timer. A preview and hints are always available; wrong placement is gentle and reversible.
2. **Neighborhood (living):** completed structures activate inhabitants, roads, routes, interiors, and jobs. Arrange buildings on a district board.
3. **Explore (opt-in adventure):** enter at human scale, talk to NPCs, perform errands, discover secrets, solve environmental puzzles, and handle optional enemy encounters. This mode never surprises a player who is actively working in the peaceful workshop.
4. **Restore:** help a city become self-sufficient; unlock the next region, new puzzle primitives, and new story clues.
5. **Citadel:** reach a powerful corporation that withheld blueprints and disassembled communities. Use reconstruction knowledge and city infrastructure to change the final confrontation.
6. **The Commons (post-campaign):** unlock the creator and asynchronous city-puzzle exchange, exporting and importing locally.

## Campaign environments (initial creative direction)

- Willowbrook: cottages, shops, plaza, bridges, welcoming introductory quests.
- Tidesreach: harbor, lighthouse, canals, vertical docks.
- Verdantia: living rooftops, gardens, elevators, skybridges.
- Ironhaven: rail lines, power distribution, mechanical components.
- Corporate Citadel: enormous modular towers, permissions, surveillance, hidden public routes, high-stakes city reconfiguration.

These are design targets, not shipped campaign content.

## Two scales, one world

An authoritative **city definition** is assembled at tabletop scale. The same transforms generate the walkable large-scale scene. A door, bridge, alley, or roof route should not change position between modes. Quest state is stored separately from authored city data.

## Accessibility and comfort

- Seated and standing VR, height/reach adjustment, one-hand-friendly alternatives, and desktop mouse/keyboard.
- Snap assist, optional ghost outlines, undo/redo, unlimited time, adjustable puzzle complexity, readable text, subtitles, and color-independent piece identifiers.
- Teleport + snap-turn by default; optional smooth locomotion and turning, with comfort vignette and movement speeds.
- No forced combat, timers, jump scares, or completion pressure in Workshop. Adventure combat remains avoidable/adjustable when practical.
- Never gate basic saving, export, or accessibility features behind campaign completion.

## XR ownership and integration

- Runtime: browser-first 3D scene with WebXR support and a desktop fallback. Keep scene rendering separate from pure deterministic puzzle state.
- Domistika XR: future authored-model pipeline through **trusted conversion** into a bounded catalog of assets; do not execute user-supplied models, scripts, or shaders at runtime.
- Gen.E.Wrist: future registered WORLD adapter exposing context-aware Workshop/City/Explore screens, without changing its canonical universal 3-6-9 rings.
- Save format and city-pack format are versioned; the network is optional for all local authoring, solving, and visiting.
- Prefer MIT for authored code only after explicit licensing decision; third-party assets maintain their individual licenses.

## Delivery ladder

**Rung 0**: Design, versioned declarative community pack contract, seed city, validation, and CI.

**Rung 1**: First playable block. Three buildings, snapping/rotation, ghost previews, completion feedback, local saves, miniature-to-full-scale transition, desktop and Quest 3 smoke tests.

**Rung 2**: NPCs and small quests, city placement consequences, interiors, audio/lighting, comfort and accessibility controls.

**Rung 3**: Five district progression and Citadel narrative; completion ledger and offline Commons entitlement.

**Rung 4**: Full in-game Commons authoring tools, solvability test runs, local pack import/export, optional moderated GitHub submission/catalogue.

**Rung 5**: Trusted Domistika XR asset pipeline, interoperable WorldAdapter, community curation, regression/performance checks.
