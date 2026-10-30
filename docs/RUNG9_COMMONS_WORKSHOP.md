# Rung 9 — The Commons Workshop

## Purpose

PieceByPiece's fifth-city ending now unlocks the first practical **The Commons** creation mode. Players can design their own cities, test every snap target and mission under the canonical puzzle engine, and exchange an approved, readable `piecebypiece.city.v1` JSON file without accounts, cloud storage, SaaS dependence, executable user scripts or real-time multiplayer.

The Commons is **not a sixth city**. It is a separate static page (`commons.html`) linked from the District Atlas and the Citadel victory screen.

## Gate and save isolation

The editor opens only when the current browser's legitimate Citadel progress confirms 12 pieces, 3 missions and ratification of the three public charter safeguards, via the existing `readCitadelStatus()` function. Unfinished players see the requirements and can continue their campaign.

Drafts are saved in browser-local storage under `piece-by-piece:commons:architect-draft:v1`. They are **never** written to campaign keys, and importing a pack never counts as completing a campaign district. The existing five-city campaign saves remain unchanged.

The user must explicitly confirm sharing rights. A draft loaded from browser storage or imported from someone else always resets that affirmation, so an import cannot silently impersonate the current editor's authorship.

## Architect workflow

1. Complete the five-city campaign. Open `districts.html` and select **The Commons Workshop**, or follow the Citadel epilogue link.
2. Design a **title**, **creator display name**, **description**, **theme**, and **difficulty**. The default draft contains a small gathering place with three pieces and an optional starter mission.
3. Add buildings, select a building and an approved prefab, choose its **height level** and **rotation**, then **click the 3D tabletop grid** to put it at a specific solution target. Drag to orbit and scroll to zoom.
4. Add short, bounded `visit-building` missions. Existing building and piece entries can be removed; invalid edits are rejected before committing them. The editor remains within strict counts, grid boundaries, and unique snap targets.
5. Switch to **Playtest**. This starts from an entirely empty city. Select pieces, rotate and click their correct tile, or use the explicitly labeled one-piece fit button for accessible testing. Finish all building-based missions through the **same** `tryPlace()`, `completeMission()`, and `progress()` functions as the official campaign.
6. Successful construction **and** all missions produce a local per-layout playtest receipt. Any world/mission edit invalidates the receipt. Changing only rights/license preserves it because those fields cannot change gameplay.
7. Choose a sharing license (`CC0-1.0` or `CC-BY-4.0`) and affirm you own/have rights to the content. Only then can you **Export validated city JSON**.
8. Exchange the downloaded JSON with friends; they can import it into their own unlocked Commons Workshop and test/edit it. Or open a human-reviewed PR proposing that JSON under `community/packs/` in the source repo.

The curated **Lantern Lane** example can be loaded from a bundled JSON file and edited as a local draft.

## Trust, size, and validation

- A single shared pure validator lives in `src/core/community-validator.mjs`. The original Node CLI `scripts/validate-community.mjs` delegates to it, so browser imports and repo CI use the **same exact JSON Schema** and semantic checks.
- Max file size is **64 KiB**. Total caps, metadata limits, unique identifiers, unique piece targets, legal references, finite grid coordinates, and legal rotations remain enforced.
- Only 12 predefined, built-in prefabs; no injected shader, script, dynamic HTML, remote 3D asset URL, image, sound, or arbitrary quest implementation.
- All creator-supplied display strings are inserted with `textContent` or native input values, **never** via `innerHTML`.
- Imported content is structurally validated **before** any scene object or UI is built from it, and unknown pack keys are rejected.
- Export enforces `rights.confirmed === true`, strict validation, a matching completed playtest receipt, and the 64 KiB limit of the **pretty-printed exported bytes**.
- The playtest receipt is a local client UX safeguard, **not** cryptographic proof, authorship verification or an official review. Community catalogue inclusion still requires independent human moderation and a meaningful playtest.
- Draft recovery fails closed on invalid cached content and starts a new local draft. There is no cloud recovery or account-based sync.

## Public hosted routes

Rung 9 adds a seventh GitHub Pages entrypoint: `commons.html`. The existing `npm run build:pages` compiles all six earlier game/Atlas pages plus the workshop. `npm run verify:pages` checks all seven bundles' JavaScript/CSS paths.

**Expected URL after merge and deployment:**

https://michaelwave369.github.io/PieceByPiece/commons.html

GitHub Pages serves the app as a static file bundle. It does not accept user uploads, store player content on its own server, or auto-publish imported JSON. After the first load, editing/testing/export can work without any gameplay network call; **offline reload is not guaranteed** until a future explicitly tested service-worker cache implementation.

## Manual desktop / mobile / Quest acceptance

1. With an incomplete Citadel save, open the Commons URL directly. The lock panel appears and editing is unavailable.
2. With a completed Citadel save, open the workshop. It displays a 12×12 starter tabletop, three pieces, one mission and an unchecked license affirmation.
3. Rename the city, add a building, place different approved shapes on a ground tile and an upper level. Attempt an overlapping tile and an invalid off-grid placement. Neither invalid edit should alter the saved draft.
4. Reload the browser. The draft should come back with positions and text intact. Sharing-rights affirmation must return unchecked.
5. Click **Playtest**. The 3D board starts empty; test normal snapping with a wrong rotation, then a correct one. Use assisted fit on another piece and confirm progress counts exactly once.
6. Complete the last piece and the mission buttons. Confirm the playtest receipt appears. Return to Design and make any placement edit. Receipt/export must be invalidated.
7. Finish a new playtest, affirm rights and download JSON. Check its contents are `piecebypiece.city.v1`, have real structural data and **no** scripts/URLs. Import the same file and confirm snap coordinates and missions survive.
8. Try importing malformed JSON, an unknown key, overlapping pieces and an oversized file. Verify errors are visible and the current draft remains intact.
9. Load the bundled Lantern Lane example. It should render its two buildings and six pieces without changing any campaign save.
10. On Quest 3, open the workshop in Quest Browser, use the flat panel controls, then enter the optional **immersive tabletop preview**. Both controller rays can target the board with the previously selected tool/piece. VR mode does **not** yet provide a full in-headset building palette or spatial text input; these remain a later rung.
11. On mobile and desktop verify scrolling, Tab focus, 3D canvas resizing, readable controls, and safe offline data retention.
12. Confirm returning to all five official campaign chapters shows the same saves and no imported city can unlock a chapter.

## What this rung does not do

- **No automated upload service, online catalogue browser, automatic moderation, public profiles, or server-side publishing.**
- No player-submitted external asset URLs or custom code.
- No full controller-native 3D editing palette inside VR; Quest headset ergonomics remain a manual playtest.
- No automatic assertion of real legal rights simply because a rights checkbox was selected.
- No offline service-worker guarantee, cloud sync, or universal browser-to-browser save migration.

Next rung candidates: reviewable static catalogue generation with content hashes, a dedicated community pack player that can open local JSON without needing the full editor, richer architectural connections, and a hardware-tested Quest-native palette.
