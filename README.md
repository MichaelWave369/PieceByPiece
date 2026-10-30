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

## Play online through GitHub Pages

**Public game URL (after enabling Pages and a successful deploy):** https://michaelwave369.github.io/PieceByPiece/

The game publishes from a tested GitHub Actions workflow after changes merge to `main`. For first-time setup, in repository **Settings → Pages**, choose **GitHub Actions** as the publishing source. Follow [the Pages deployment guide](docs/GITHUB_PAGES.md) for the exact steps and Quest 3 checks. The site serves the game directly over HTTPS; it does not require a separate account or game download. Game progress remains in your browser, not on GitHub servers.

## Chapter Five: The Corporate Citadel, Common Ground

**The authored five-city campaign now has a finale.** After restoring Ironhaven's public freight railway, the [District Atlas](https://michaelwave369.github.io/PieceByPiece/districts.html) opens the fifth city, the **Corporate Citadel**.

Rebuild **The Open Archive**, **Central Signal Tower**, and **Citizens' Forum** from twelve architectural pieces. Help Ren, Noor and Imi recover the city's shared designs and communications. Then release three public-charter safeguards, **Knowledge, Connection and Consent**, through clickable in-world monuments or accessible desktop controls.

Activating all three opens a public forum, records a locally saved campaign victory, and concludes the story **without mandatory combat**. The finale is designed for desktop and Quest Browser with the same WebXR controller interaction patterns as earlier chapters.

The first four campaign saves stay unchanged; the Citadel construction and charter each have their own versioned local save. GitHub Pages will add the sixth route after merging and deploying this PR:

https://michaelwave369.github.io/PieceByPiece/citadel.html

See [Rung 8 playtest and finale guide](docs/RUNG8_CITADEL.md). **The Commons community-city editor and submission workflow are still future work**, not something the campaign ending falsely claims to implement. Quest 3 comfort and visual interaction still require manual testing.

## Chapter Four: Ironhaven, the Commons Rail

After fully restoring Verdantia's public skywalk, the [District Atlas](https://michaelwave369.github.io/PieceByPiece/districts.html) unlocks **Ironhaven**. This fourth playable city adds twelve industrial building pieces, a Salvage Workshop, a Community Foundry and a Commons Rail Terminal. Help **Rook, Ada and Jun** recover tools and return public dispatch to the workers.

**New gameplay:** route three rail junctions from CORPORATE toward the COMMONS. Each needs its own rebuilt piece and neighbor errand. Connecting the public supply line starts a small freight train and opens a Commons Freight Yard with safe, collision-aware exploration. Routing is completely untimed and controlled through either in-world desktop/WebXR stations or accessible desktop buttons.

Ironhaven saves its construction, missions and rail switches in independent versioned browser-local keys. The previous three chapter saves are unchanged.

**Planned URL after merge and successful Pages deployment:** https://michaelwave369.github.io/PieceByPiece/ironhaven.html

See [Rung 7 playtest and known limits](docs/RUNG7_IRONHAVEN.md). The code is unit- and build-tested; physical Quest 3 control and comfort testing remains manual. The Corporate Citadel is implemented as the fifth chapter in Rung 8, pending merge and hands-on validation.

## Chapter Three: Verdantia, the Skygarden

**After completing the public ferry in Tidesreach**, head to [the District Atlas](https://michaelwave369.github.io/PieceByPiece/districts.html) and enter **Verdantia**. This third chapter adds twelve architectural pieces to restore the Seed Conservatory, community Wind Spire, and Commons Canopy Bridge.

Meet **Pera, Sol, and Vale** to restore the garden's public infrastructure. Their ordered missions open a genuine **elevated skywalk** with a sloping ascent and height-aware walking / controller teleport. The game keeps Verdantia's construction and quest save **separate** from your first two city saves.

Verdantia's planned public page after PR merge and successful GitHub Pages deployment: https://michaelwave369.github.io/PieceByPiece/verdantia.html

The Vite Pages build and asset verification include the Living Block, District Atlas, Tidesreach, Verdantia, Ironhaven and Citadel. See [Rung 6 manual playtest](docs/RUNG6_VERDANTIA.md). The elevated path needs actual Quest 3 comfort testing; CI build success alone cannot guarantee that.

## District Atlas and Chapter Two: Tidesreach

**Play the published campaign:** https://michaelwave369.github.io/PieceByPiece/  
**District Atlas:** https://michaelwave369.github.io/PieceByPiece/districts.html  
**Tidesreach:** https://michaelwave369.github.io/PieceByPiece/harbor.html (chapter two, unlocked through campaign progress)

The **District Atlas** tracks campaign access and local saved progress through all five authored chapters. Finish The Living Block's twelve pieces, three errands and Lantern Grid to open Tidesreach. Chapter Two uses the exact same v1 puzzle-pack schema and canonical puzzle engine, with a completely separate browser-local save.

In **Tidesreach: The First Dock**, you assemble Starfall Lighthouse, Harbor Tea Room, and Community Boatyard from twelve new architectural pieces, walk around the restored coastline, meet Ida/Rowan/Finch, and reconnect a public ferry. The harbor supports desktop controls, a paginated controller-based Quest XR piece shelf, optional placement assistance and local progress persistence.

The Vite production build includes all six chapter and Atlas HTML entrypoints as separate static pages. See [Rung 5 playtest checklist](docs/RUNG5_TIDESREACH.md) for exact acceptance gates and the Quest 3 manual testing plan. The chapter URLs go live only after the corresponding PRs merge and their Pages deployment succeeds. The full authored campaign now has five chapters, though manual gameplay verification remains ongoing.

## Play the Living Neighborhood (Rungs 1–5)

The **Living Block** vertical slice uses the same strict `piecebypiece.city.v1` city-pack structure as The Commons.

```bash
npm install
npm run dev
```

Open the local address printed by Vite. The game bundles locally through `npm run build`, and a build artifact is attached to successful CI runs. WebXR requires a supported headset/browser and a secure context such as HTTPS or localhost.

**Desktop:** Select an unplaced part in the right panel. Move your pointer across the board; the amber tile marks its target. Press **R** or Rotate to match orientation, then click the target tile. When all 12 pieces are built, click **Enter your city**. Use **WASD** to explore and **right mouse drag** to look. Meet **Celia**, **Jules**, and **Moss**. Talk to them in person or using the accessible right-hand panel, and complete the small parcel-and-seeds errand. Click the café and house entrance signs to go inside. Escape returns from rooms to the street and from the street to the workshop.

**Quest/WebXR:** Use either trigger to select a part from the in-world shelf and place it on the small tabletop board. Use a grip to rotate parts and **NEXT PIECES** to browse the shelf. Once assembled, choose **ENTER CITY**. In Explore Mode, point at **clear ground** and trigger to teleport; grip snap-turns 45° around the viewer. Select citizens to talk and select the full dialogue panel to dismiss it. Select entrance and exit signs to enter and leave small building interiors. A city sign returns you to the workshop.

**Rung 4: First Visitor Experience:** New players see a warm introduction and contextual instructions. An optional one-piece **placement assist** (disabled until explicitly enabled) makes the workshop accessible without bypassing canonical puzzle rules. **Preview finished neighborhood** is an unsaved tour: the player can explore completed 3D buildings and interior scenes before solving everything, but quest/power progression and local saves remain untouched. See [Rung 4 playtest](docs/RUNG4_FIRST_VISITOR.md).

**Rung 3: City Systems:** After helping the three neighbors, reconnect the **Café Generator**, **House Relay**, and **Garden Relay** to light the lantern walk and open the **Commons Overlook**. Click or VR-trigger outdoor relay crystals, or use the right-hand Lantern Grid panel. Required infrastructure links depend on actual placed building parts. The overlook cannot be entered until opened and stays open permanently once restored. See [Rung 3 playtest](docs/RUNG3_CITY_SYSTEMS.md).

Progress is saved locally in the browser (no account, network service, or subscription). No timer or surprise combat interrupts the workshop. Optional, locally synthesized ambient sound starts **only after opt-in**. The VR controls are implemented but still need a real Quest 3 comfort/performance playtest.

The Living Block alone has three modular building puzzles, three neighbor conversations/errands, two cutaway interiors and one city-power environmental puzzle. The broader campaign now spans five authored chapters; advanced NPC AI and a community authoring/exchange UI remain unimplemented. See [Rung 2 playtest checklist](docs/RUNG2_PLAYTEST.md).

## Checks

```bash
npm run check    # puzzles, city circuits, story, navigation, and v1 pack validation
npm run build    # static web bundle
```

## Design and future Commons

See `docs/GAME_DESIGN.md` and `docs/THE_COMMONS.md`. Community packs remain declarative and locally owned. Curated public submissions will require moderation and solvability playtests, not just JSON validation.

License and contributor policies are pending an explicit project decision.
