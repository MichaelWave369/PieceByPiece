# Piece by Piece

**Build the city. Enter the city. Free the cities. Share your worlds.**

Piece by Piece is a planned cozy XR/VR architectural puzzle-adventure. Assemble 3D buildings at a peaceful tabletop, place them into living cities, then step into those cities to explore quests, discover secrets, and face optional challenges. The story culminates at the Megacorporation Citadel.

After finishing the campaign, players unlock **The Commons**, an asynchronous, player-made city puzzle exchange. Worlds are portable data packs, not live multiplayer servers.

## Principles

- **Peaceful first:** no timers, forced combat, or surprise enemies in the tabletop puzzle workshop.
- **Build then enter:** the geometry and connections you create affect traversal and quests.
- **One puzzle format:** the same validated city data powers campaign cities and community packs.
- **Offline ownership:** export, import, and play city packs locally; discovery is an optional service.
- **Safe sharing:** declarative, versioned puzzle data with bounded sizes and no user scripts or executable assets.
- **Accessible XR:** design for Quest WebXR and desktop from the same deterministic simulation.

## Play the first neighborhood (Rung 1)

The **Living Block** vertical slice uses the same strict `piecebypiece.city.v1` city-pack structure as The Commons.

```bash
npm install
npm run dev
```

Open the local address printed by Vite. The game bundles locally through `npm run build`, and a build artifact is attached to successful CI runs. WebXR requires a supported headset/browser and a secure context such as HTTPS or localhost.

**Desktop:** Select an unplaced part in the right panel. Move your pointer across the board; the amber tile marks its target. Press **R** or Rotate to match orientation, then click the target tile. When all 12 pieces are built, click **Enter your city**. Use **WASD** to explore, **right mouse drag** to look, and **left click** glowing mission markers to help neighbors. Escape returns to the workshop.

**Quest/WebXR:** Use either trigger to select a part from the in-world shelf and place it on the small tabletop board. Use a grip to rotate parts, and select **NEXT PIECES** to browse the shelf. Once assembled, choose **ENTER CITY**. In Explore Mode, point at the floor and pull the trigger to teleport; the grip makes a 45° turn. Click glowing markers to complete quests. A sign in the city returns you to the workshop.

Progress is saved locally in the browser (no account, network service, or subscription). No timer or surprise combat interrupts the workshop. The VR controls are implemented but still need a real Quest 3 comfort/performance playtest.

This is a prototype, not the complete five-city campaign. There are three modular building puzzles and three simple missions, but no full NPC dialogue, combat, interiors, published public catalogue, or community authoring UI yet.

## Checks

```bash
npm run check    # pure puzzle-rule tests and both schema packs
npm run build    # static web bundle
```

## Design and future Commons

See `docs/GAME_DESIGN.md` and `docs/THE_COMMONS.md`. Community packs remain declarative and locally owned. Curated public submissions will require moderation and solvability playtests, not just JSON validation.

License and contributor policies are pending an explicit project decision.
