# Rung 10 — The Commons Library and Community City Player

## Release summary

Rung 10 makes the first *approved* community creations discoverable and playable on the public static website. The original five-city campaign and the Citadel-unlocked Commons **Workshop** remain intact.

There are **two new pages**:

- `catalogue.html` — public, searchable catalogue of reviewed, committed community cities.
- `play-community.html` — dedicated browser/Quest tabletop where a community pack can be played from its initial, unsolved state.

Neither page requires completing the campaign. **Creating and exporting** through `commons.html` still requires the original Citadel victory condition. The catalogue initially contains the *one* committed reviewed example, **Lantern Lane**. This rung does not invent a large collection of submitted cities.

## The static publication boundary

Only a human-reviewed JSON file merged under `community/packs/<id>.json` is eligible for public catalogue inclusion. The build step `scripts/build-community-catalogue.mjs`:

1. Enumerates review-committed pack files in a deterministic sorted order.
2. Runs the existing **exact same** `piecebypiece.city.v1` schema and semantic validator.
3. Enforces that filename and pack ID match, the 64 KiB maximum, and uniqueness of IDs.
4. Computes **SHA-256 of the exact committed file bytes** and a corresponding byte count.
5. Generates `public/community/catalogue.json` with title, author credit, description, tags, license, piece/mission counts, difficulty and checksum.
6. Copies the *exact* reviewed bytes into `public/community/packs/`, which Vite publishes in the GitHub Pages site.

`npm run catalogue:verify` runs the read-only validation path. `npm run build:pages` and the portable `npm run build` generate the static files before Vite. The pre-existing `npm run verify:pages` now checks **nine HTML entrypoints** and ensures every listed generated pack exists, has the matching byte count, and has the expected SHA-256 checksum.

**There is no public write API, open submission endpoint, identity service, monetization layer or auto-approval.** A person submits a JSON through a GitHub pull request, maintainers review it and merge it, and the static build then publishes it. The existence of a license/rights field and a local playtest receipt alone are **not** independent legal-rights verification or moderation.

## Reader/runtime trust boundary

The browser Library reads only `community/catalogue.json` from the same-origin project-site base. It validates the manifest's expected format, bounded fields and IDs, and builds result cards using plain DOM `textContent`, never interpolated HTML.

The Player accepts a reviewed catalogue ID from the query string, but **not a path or arbitrary URL**. Its path is derived from the manifest and must be exactly `community/packs/<id>.json`. It then:

- Fetches only that same-origin approved pack.
- Checks its exact byte count and SHA-256 through the browser Web Crypto API.
- Decodes strict UTF-8 JSON, checks the shared city-pack schema and semantic validator, and compares metadata with the catalogue entry.
- Builds the scene from **allowlisted local 3D prefabs** with no user code, shader, HTML, sound, script, or remote model references.

Any checksum, metadata, schema or byte-count mismatch rejects the pack **before** it can be played.

A local JSON file can also be opened directly from the Player. It is verified against the same strict 64 KiB pack rules, but displayed explicitly as **LOCAL FILE · NOT CURATED**. Local files are not remotely uploaded or promoted to the public catalogue.

**SHA-256 provides file-integrity checking against the catalogue, not independent authenticity of a repository operator.** GitHub account access, human review and HTTPS hosting remain part of the publication trust model.

## Gameplay and persistence

Both reviewed and local city files start with the canonical `blankSession()`, `tryPlace()`, `completeMission()`, `buildingComplete()`, `progress()` and `restoreSession()` core used by the campaign. Players choose a piece and rotation and click its correct grid target; an **explicitly labeled assisted-fit** button exists for accessibility. Completing buildings enables their related declarative missions.

Community puzzle progress is stored in localStorage under a revision-scoped key of the form:

`piece-by-piece:commons:play:v1:<city-id>:<sha256>`

A new revision of a city never silently assumes the old one is already assembled. Community saves, downloads, and imports **never modify campaign keys** and cannot unlock any authored city or the gated Commons Workshop.

The Player offers a desktop OrbitControls tabletop, and an initial Quest/WebXR tabletop preview with two controller rays for selecting grid cells. As with the Workshop, all 2D piece/rotation controls remain in the browser page, not in a fully native in-headset palette. Actual Quest 3 comfort and interaction testing is still needed.

## Cache and offline behavior

Both the last validated catalogue and verified reviewed packs may be cached in browser-local storage. When a subsequent fetch fails, a pack can be recovered only against its matching catalogue checksum and then **re-verified before play**.

The app does not introduce a service worker, so **fresh offline page loads are not guaranteed**. Once the page is open and a pack is available, normal puzzle gameplay and local saves do not need gameplay network calls. Browser storage is device-local, size-limited, and may be cleared by the user or browser.

## Manual acceptance checklist

1. Open the [Commons Library](https://michaelwave369.github.io/PieceByPiece/catalogue.html) without a campaign save. It must open and list **Lantern Lane** after a successful deployment.
2. Search by city name, creator and tag. Change theme to Garden; the reviewed Village result must disappear, then reappear under All.
3. Open Lantern Lane. Confirm its title, credits, theme, six pieces, and two missions match the reviewed JSON.
4. Build a piece with a wrong rotation: it must be rejected. Build with exact position/rotation; progress increments once. Use explicit assisted fitting on another piece.
5. Finish all six pieces and their two building missions. The win message appears. Reload and confirm the independent save restores the exact state.
6. Open a local `piecebypiece.city.v1` JSON generated by the Commons Workshop, verify that it plays but is clearly labeled **NOT CURATED**.
7. Try a malformed, oversized or unknown-field local JSON. The Player must reject it without modifying the active city or campaign.
8. Clear or disable network requests while the page is already open. Gameplay must continue; a previously verified pack may reload from cache **only if its catalogue can also be recovered**.
9. On Quest 3, enter the optional immersive table, check both controller rays, board distance, controller trigger, part selection and headset comfort. A full VR menu is deliberately not claimed.
10. Return to the five official campaign chapters and Commons Workshop; their progress must remain unchanged.
11. Build an additional, human-reviewed JSON in a PR, merge it, and confirm the next Pages deploy generates a new catalogue entry with the correct file and checksum. CI must reject invalid/mismatched packs.
12. Confirm direct `?id=..` and off-site URL attempts never fetch an unapproved path.

## Next rungs

Potential upgrades: meaningful human review receipts/revisions, a curated static discovery feed with browsing thumbnails, a Quest-native piece palette and controller comfort pass, and carefully designed service-worker caching for verified offline reload. None of these are silently claimed to exist in Rung 10.

The fundamental promise remains: **People Above Profit. Build for people you may never meet.**
