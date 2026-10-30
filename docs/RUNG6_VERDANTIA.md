# Rung 6 — Verdantia: The Skygarden

**Chapter 3 of the PieceByPiece campaign** introduces restorative garden architecture and the first raised route. It builds on the already merged and published Living Block and Tidesreach districts.

## Campaign and unlocks

The District Atlas now shows:

- 01 · The Living Block — playable
- 02 · Tidesreach — playable after fully restoring the Living Block and Lantern Grid
- 03 · Verdantia — playable after completing Tidesreach's three coastal errands and restoring the public ferry
- 04 · Ironhaven — not yet playable
- 05 · The Corporate Citadel — not yet playable

The unlock is derived **only from the saved Tidesreach v1 construction and mission records**, not a new anonymous account or unlock flag. The existing Harbor and Living Block save keys remain untouched. Verdantia saves to `piece-by-piece:campaign:verdantia-skygarden:v1`.

## A new 3D district

The Verdantia `piecebypiece.city.v1` pack adds a 14×14 garden board and 12 architectural puzzle pieces in three groupings:

1. **The Seed Conservatory:** A glass-domed seed archive and planters.
2. **The Wind Spire:** A small wind-powered community tower with garden surroundings.
3. **The Commons Canopy Bridge:** An observation space and overhead public walk.

When finished, the city becomes explorable with the usual first-person desktop locomotion, basic collision checks, and Quest/WebXR controller ray interactions.

### Gardener story

- **Pera** wakes the seed archive.
- **Sol** restarts the wind spire after Pera's task.
- **Vale** releases the canopy locks after Sol's task.

Every mission goes through the canonical `completeMission()` engine. Talking to characters out of order grants no story progress. The skywalk does not appear and cannot be entered before the final mission.

## Distinct gameplay mechanic: layered public traversal

This district introduces `src/core/garden-nav.mjs`, a pure, testable height-aware navigation helper. The public skywalk occupies a bounded raised route, with a sloping ramp toward a deck at **1.65m** above ground.

Desktop movement raises the camera as the player walks up the ramp. Quest users can target an actual elevated hit surface with controller rays. Teleporting adjusts the **world's vertical offset**, not the headset's tracked camera pose. Out-of-bounds, blocked building footprints, and locked passage coordinates are refused.

The observation deck and ramp are stylized, approximate geometry, **not** a full rigid-body physics or accessibility-standard ramp simulator. Manual desktop and headset comfort testing remains required.

## Preservation and hosting

- The original Living Block and Tidesreach source modules remain distinct.
- Verdantia uses the same core puzzle, save and 3D prefab engine, but a dedicated chapter entrypoint and garden environment, to avoid a risky shared-UI rewrite in the middle of adding a live chapter.
- Four static Vite routes are now compiled for GitHub Pages: `index.html`, `districts.html`, `harbor.html`, `verdantia.html`.
- `npm run check` validates all three strict city packs and tests the new chapter unlock, out-of-order story attempts, save independence, walkability, and raised-path height.
- `npm run build:pages && npm run verify:pages` checks all four Pages routes and their bundled JS/CSS dependencies.

## Manual acceptance before sharing widely

1. Play the existing Living Block and Tidesreach chapters. Existing saves must appear unchanged.
2. Open the Atlas before the ferry's final quest. Verdantia must show locked status; direct URL should show the unlock panel, not a playable chapter.
3. Complete Tidesreach's ferry errand. The new desktop link and 3D chapter sign appear. The Atlas shows Verdantia unlocked.
4. Build Verdantia normally, including two pieces rotated to 90° or 180°. Refresh midway and ensure exactly the same pieces are saved.
5. Enable one-piece assist and fit a piece. The standard validated assembly count should increment once.
6. Enter the district. Talk to Vale early; it must not unlock the skywalk. Then talk to Pera, Sol, Vale in order.
7. Before the final mission, attempt to enter the north-center garden path. It must refuse movement and teleporting.
8. After the final mission, walk up the ramp and onto the 1.65m observation deck. Return down the ramp. Check there are no height snaps or camera clipping.
9. On physical Quest 3, test both controller rays, XR shelf, trigger placements, snap turns, and teleport onto/off the elevated deck, seated and standing. Check frame times and comfort.
10. Reset Verdantia and confirm the original two chapter saves remain intact. Reopen Verdantia through the unlocked Atlas.

**Known limitations:** No full Quest performance verification, real simulation of wind turbine power, pathfinding NPC schedules, generic community-authored skywalk networks, Ironhaven, or Corporate Citadel. Those are future rungs.
