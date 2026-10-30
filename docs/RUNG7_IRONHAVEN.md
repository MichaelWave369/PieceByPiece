# Rung 7 — Ironhaven: The Commons Rail

Ironhaven is the **fourth playable campaign city**. It introduces a voluntary public-freight routing puzzle with a three-junction railway, a supply train and a navigable Commons Freight Yard. The workshop remains peaceful and untimed.

## Campaign travel and saved progress

Chapter 4 unlocks only after the Verdantia construction and all three garden missions are complete. The District Atlas reads the existing `piece-by-piece:campaign:verdantia-skygarden:v1` key and shows Ironhaven's real unlock state. After Vale opens the skywalk, the Verdantia scene also offers an **Ironhaven travel sign** and a desktop link.

Ironhaven uses two new, independent versioned browser-local keys:

- `piece-by-piece:campaign:ironhaven-commons-rail:v1`: the original v1 piece-and-mission puzzle session
- `piece-by-piece:rail:ironhaven-commons-rail:v1`: the three rail-junction switch routes and whether a complete public delivery has occurred

No existing Living Block, Tidesreach or Verdantia save keys or pack formats were changed.

## Playable chapter

The validated `piecebypiece.city.v1` pack contains 12 pieces across:

1. **Salvage Workshop**, recovering useful parts with mechanic **Rook**
2. **Community Foundry**, rebuilding industrial tools under worker direction with engineer **Ada**
3. **Commons Rail Terminal**, returning public dispatch to dispatcher **Jun**

The three errands are ordered and resolved only through canonical `completeMission()`. Talking to Jun early doesn't complete the mission.

### New mechanic: Commons Rail Junctions

After helping the crew, players route three junctions from CORPORATE to COMMONS:

- Salvage Yard Junction
- Foundry Transfer
- Commons Dispatch

Each switch only becomes usable when its corresponding building, mission and required puzzle piece exist. The pure `src/core/rail-routing.mjs` module computes route continuity and rejects invalid or premature controls. The same controls appear on the right-hand accessible text panel and as selectable in-world rail stations for desktop and Quest controllers.

Once all three routes point to the Commons, a little low-poly supply train begins moving along the rail on desktop, the freight gate lifts, and the central public freight yard is walkable. The visual train is **not** a timed puzzle or a collision hazard. It stays static in XR and when reduced motion is requested.

**Anti-trap guarantee:** If a player chooses to change a junction after the first public delivery, the yard remains unlocked while the active route visibly changes. This prevents a visitor from being trapped behind a gate.

## Public site and build

GitHub Pages compiles five routes:

- `index.html`: The Living Block
- `districts.html`: District Atlas
- `harbor.html`: Tidesreach
- `verdantia.html`: Verdantia
- `ironhaven.html`: Ironhaven

Run `npm run check`, `npm run build:pages`, `npm run verify:pages` to test all five. The existing production deployment workflow publishes automatically after merging to `main`.

## Manual desktop and Quest 3 acceptance

1. Load the Atlas with an incomplete Verdantia save. Ironhaven is marked locked. Direct navigation to `ironhaven.html` shows the unlock requirements.
2. Finish Verdantia's twelve pieces and speak to Pera, Sol and Vale. The newly visible travel link and VR sign should lead to Ironhaven.
3. Assemble Ironhaven's 12 pieces. Test incorrect rotations and one-piece assistance. Refresh halfway through and check exact progress.
4. Enter the full city. Use WASD/right-drag on desktop or the two-controller XR ray and teleport system in Quest Browser. Navigate around the salvage and foundry building collision footprints.
5. Try talking to Ada or Jun before Rook. They should offer contextual dialogue but **not** grant early mission progress. Help Rook, then Ada, then Jun.
6. Check the three junction control buttons: unavailable before their prerequisite and clickable afterward. Click each once to select COMMONS, observing the stations change color.
7. Confirm the central freight-yard region refuses desktop movement and XR teleport before the final connection. After all three are routed to COMMONS, the gate disappears, and the yard can be entered.
8. Switch one junction back to CORPORATE. The train's route should no longer be fully connected, but the yard should remain open to prevent trapping.
9. Reload the page. Confirm placed pieces, completed crew errands, each junction's selected route, and the public-yard unlock survive.
10. Reset **Ironhaven only** and verify the previous three cities' local saves have not changed. In Quest, verify sign size, controller reach, frame pacing, snap-turn comfort and both controller rays.

### Known limitations

- A passing Vite build and Node tests **do not** establish actual browser/Quest 3 runtime ergonomics. All headset playtests above remain manual.
- This is a simple three-junction rail-routing puzzle, not a railway simulation with NPC pathfinding, physics-based train collisions or a full train timetable.
- No mandatory combat, paid currency, online account, DRM, multiplayer server or scripts supplied by community puzzle packs.
- The Corporate Citadel campaign finale and the public Commons city-authoring interface remain future work.
