# Rung 8 — The Corporate Citadel: Common Ground

The **fifth playable PieceByPiece city** closes the initial authored campaign, following the original Living Block, Tidesreach, Verdantia and Ironhaven.

## Unlock and continuity

The final city unlocks only after Ironhaven has finished its twelve pieces, completed its three worker errands and delivered the public freight train through three aligned COMMONS rail junctions. Access is calculated from the existing local Ironhaven save and railway state. No existing chapter keys or schemas are migrated or overwritten.

- Citadel architecture and story save: `piece-by-piece:campaign:citadel-common-ground:v1`
- Citadel charter save: `piece-by-piece:charter:citadel-common-ground:v1`

This is browser-local campaign progression, not identity, DRM, cloud storage or any claim about legal ownership of real infrastructure.

## The finale's gameplay

The 16×16 validated `piecebypiece.city.v1` board provides 12 pieces and three landmarks:

1. **The Open Archive**: rebuild the public blueprints with archivist Ren.
2. **Central Signal Tower**: release the communications network with engineer Noor.
3. **The Citizens' Forum**: bring the city together with assembly steward Imi.

The three conversations are ordered and use the existing canonical `completeMission()` rules. They cannot be advanced out of order or by talking before a building is complete.

### Final puzzle: The Common Ground Charter

Once these helpers have restored the landmarks, three physical consoles and accessible browser buttons can be set from **CLOSED** to **PUBLIC**:

- Open Knowledge
- Shared Connection
- Community Consent

Every switch is gated by its precise canonical building, mission and required piece ID. When all three are PUBLIC, the Citizens' Forum gate opens, light sculptures illuminate, and the campaign ending appears. The victory is saved locally and the public forum stays unlocked even after changing a switch, preventing the player from being trapped in the plaza. The code for these rules is pure and unit-tested in `src/core/citadel-charter.mjs`.

The finale is explicitly **nonviolent**. No boss combat, timers, paywalls or online authentication are introduced.

## Public campaign routes

The GitHub Pages build now produces and verifies all six HTML entrypoints:

1. `index.html` — The Living Block
2. `districts.html` — District Atlas
3. `harbor.html` — Tidesreach
4. `verdantia.html` — Verdantia
5. `ironhaven.html` — Ironhaven
6. `citadel.html` — The Corporate Citadel

The District Atlas displays the Citadel's locked, incomplete and victorious states. After completing the Ironhaven railway, an in-world and desktop link appear to enter the Citadel. The new page is published **only after merging this PR and successful GitHub Pages deployment**.

## Manual acceptance

1. With incomplete Ironhaven progress, visit the Citadel URL directly. The chapter must remain blocked with clear requirements. The Atlas must not report a fake victory.
2. Finish Ironhaven and align all three rail junctions. Revisit the Atlas; the finale becomes accessible. The optional Ironhaven travel sign should lead to the final city in both desktop and Quest VR.
3. Build the Citadel normally, including rotating some pieces. Refresh halfway and confirm the real puzzle save restores exactly.
4. Try to speak to Noor and Imi early. No story progress should be awarded until Ren has been helped, followed by Noor and Imi.
5. Attempt to activate the safeguards early. They must remain unavailable until their matching buildings, pieces and missions are complete.
6. Release Knowledge, Connection and Consent to PUBLIC. Confirm the forum gate opens, the victory text becomes visible and the local completion state persists across refresh.
7. Enter the public forum before and after ratification. Desktop collision and VR teleport should block the route before and allow it afterward.
8. Set one control back to CLOSED. The public forum must stay unlocked, without trapping the player.
9. Reset only Citadel progress. Verify the earlier four cities and Ironhaven's rail settings are still present.
10. On a physical Quest 3, verify two-controller rays, world-space control labels, selection precision, snap-turn comfort, page transitions, performance and all safe teleport destinations.

## What the ending means for The Commons

The Common Ground ending completes the authored **five-city campaign** and narratively establishes The Commons. It is **not yet a functioning player-authored city editor, upload, moderation or asynchronous exchange service**.

The next rung should turn this epilogue into a real offline-first Commons workshop that safely creates and imports community city packs with validation and explicit sharing through files or PRs. This is an independently scoped feature, not silently bundled into the victory screen.

## Validation and limitations

`npm run check` tests all five strict city packs, canonically ordered Citadel missions, charter state/sanitization, unlock logic, victory persistence, and desktop/VR walk boundaries.

`npm run build:pages && npm run verify:pages` verifies all six HTML entrypoints and their CSS/JS assets. Production build success proves bundling and deterministic logic, not headset performance or first-person interaction correctness. Physical Quest 3 playtesting is still required.
