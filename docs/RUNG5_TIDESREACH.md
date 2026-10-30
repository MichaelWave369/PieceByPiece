# Rung 5 — Tidesreach: The First Dock

## New playable chapter

**Tidesreach** is the second coastal neighborhood in the PieceByPiece campaign. The original Living Block remains untouched at `index.html`. Its saved construction, neighbor errands, and Lantern Grid state do not migrate or reset.

A new `districts.html` **District Atlas** describes the five-region campaign roadmap without misleading visitors about which chapters are actually playable:

- 01 — The Living Block: playable
- 02 — Tidesreach: playable after restoring the first district
- 03 — Verdantia: future
- 04 — Ironhaven: future
- 05 — Corporate Citadel: future finale

**Unlock:** finish all twelve pieces and three missions in the Living Block, then restore the Lantern Grid so the Commons Overlook gate opens. The Atlas reads that existing v1 browser save and presents Tidesreach as unlocked. The Tidesreach page verifies the same local state before allowing play. There is no user account, token, or server-side entitlement. This is local campaign progression, not security or DRM.

**Harbor content:** twelve new puzzle pieces, three buildings (Starfall Lighthouse, Harbor Tea Room, Community Boatyard), and a chain of three original errands. Ida restores the beacon, Rowan sends tea, and Finch opens the public ferry.

The puzzle workshop is peaceful, untimed, and reuses the **canonical** `tryPlace()`, `buildingComplete()`, `completeMission()`, `restoreSession()`, and `progress()` from `src/core/puzzle.mjs`. We did not clone that engine.

Tidesreach has its own `piecebypiece.city.v1` campaign pack and a separate browser-local save key `piece-by-piece:campaign:tidesreach-first-dock:v1`. The new coast models are procedural and shipped with the website; the game remains runnable without a gameplay network service.

## Playing

1. In the Living Block, finish the story and the Lantern Grid. Follow **District Atlas** from the 2D control panel or select the **District Atlas** world-space sign.
2. In the Atlas, choose **Enter Tidesreach**.
3. Choose 3D pieces from the sidebar, rotate using R, and fit them to glowing board targets. Optional one-piece assistance calls the same canonical placement rules.
4. Once all twelve parts are assembled, choose **Enter your harbor**.
5. Walk with WASD, look by right-drag, or in Quest Browser teleport using a controller trigger.
6. Talk with Ida, then Rowan, then Finch. The ferry appears after the last errand, and the northern waterfront becomes walkable.
7. Return to the architect's table or District Atlas at any time. Tidesreach restores its independent browser-local save after refresh.

## Quest 3 manual acceptance

The app is designed with two controller selection rays, grip rotation, 45-degree snap-turn around the viewer, a paginated XR piece shelf, grid placement, and collision-checked teleport. **These controls require a real Quest 3 test**. A compiled WebXR code path does not prove comfort or that sign hitboxes are ergonomically placed.

Specifically check that:

- Both controller rays reach the tabletop grid and XR shelf without awkward wrist angles.
- The harbor board is in front of the user at a comfortable seated/standing position.
- The lighthouse roof and animated/seascape details do not make frame times inconsistent.
- Full-size town navigation is bounded. Teleport cannot land inside assembled structures or on the locked shoreline before ferry departure.
- Keeper dialogue panels are legible, and the workshop/Atlas signs can be targeted and selected.
- Reloading after one or more harbor pieces and after a completed errand restores progress.
- Resetting the harbor does not change the original Living Block save or gate state.

## Validation

- `npm run check` tests the shared puzzle engine and the two campaign packs, ordered harbor interactions, collision and progression unlocks.
- `npm run build:pages && npm run verify:pages` verifies that `index.html`, `districts.html`, and `harbor.html` all build with valid JavaScript/CSS links under the `/PieceByPiece/` GitHub Pages path.
- The production Pages workflow publishes all three static routes after merging to main.
- No claims are made about visual browser/headset QA without direct playtesting.

## Architecture decisions

The original Living Block scene currently has hand-authored character and city-system logic. This chapter uses the same **pure puzzle engine, scene primitives, and declarative city-pack contract** in a second dedicated scene entrypoint instead of a risky rewrite of the first game. Future rungs should move toward an adapter-driven shared runtime once both chapters are manually verified. One codebase, distinct content, no new combat loop, no extra servers.

This rung is not the full game, The Commons publishing editor, or a mobile XR performance guarantee.
