# The Commons: asynchronous city-puzzle exchange

## What unlocks

After the player **completes the Corporate Citadel campaign ending**, the local save records `commonsUnlocked: true` with the ending identifier and schema version. This reveals **Architect Mode**, **Community Atlas**, and **Challenge Creator** on the main menu. It is an offline, permanent unlock in that save and requires no identity service. Keep save migration and recovery in scope; do not interpret externally imported community content as proof of campaign completion.

Users may continue the campaign, replay finished cities, and use all core settings. Sharing must not require a paid account.

## What a creator makes

A creator arranges approved modular pieces, names buildings, chooses a setting, edits puzzle start/solution states, defines bounded quests and optional encounters, tests the puzzle, and exports a `piecebypiece.city.v1` JSON pack. The editor should preview exactly how it will play on Quest/desktop.

**The secret reward:** creators are not just setting decor. Their building arrangement can influence street access, sightlines, rooftop routes, path shortcuts, doorways, and where missions happen.

## Sharing without real-time multiplayer

1. **Local always works:** export one JSON file, hand it to a friend, or import it from a download. Play offline after import.
2. **Optional public catalogue:** a human-reviewed pull request adds a pack under `community/packs/`, after CI validation and a playtest receipt. The catalogue is generated from committed packs and hosted statically; download it when connected and cache packs locally.
3. **In-game discovery (future):** list verified catalogue metadata, filter by theme/difficulty, inspect credits and compatibility, and download or import. No user-to-user live networking.
4. **No arbitrary remote submissions:** a public issue can express interest, but new content is not executed or auto-published. Editorial approval remains deliberate.

A static catalogue and content-addressed hashes avoid needing a game server. Ratings, comments, and leaderboards are intentionally omitted initially; adding them would create moderation and identity needs that are not justified by the core experience.

## Trust boundary and governance

- Imported files are **untrusted**. Validate format, size, arrays, strings, integer ranges, known prefab identifiers, positions, unique IDs, and cross-references before loading.
- **No JavaScript, shader source, external URLs, HTML, uploaded binaries, external model references, or dynamic script fields** in city packs. Use allowlisted prefab catalogs and declarative quest kinds.
- Validate JSON before render, reject unknown fields, and cap total city complexity to protect low-powered standalone VR headsets.
- Do not load remote assets by reference; a pack is fully playable offline using built-in materials/models.
- Escape or render all creator text as plain text. Never trust creator titles/descriptions as markup.
- A successful structural validation does **not** prove a puzzle is fun or solvable. Editor publish requires an actual start-to-finish solve under the same deterministic simulation, storing a versioned test receipt; catalogue publication requires independent review.
- No real names, locations, contact details, or user identifiers are required. Creator handles are plain display names.
- Support credit, withdrawal, reporting, revision IDs, license/rights affirmation, and removal of abusive submissions.
- Keep community packs separate from official campaign assets and from the campaign unlock ledger.

## Technical seams

- `schemas/community-city.schema.json`: versioned data contract.
- `community/packs/`: curated packs only.
- `community/catalogue.json` (future generated output): validated manifest with checksum, size, revision, credited creator, theme, and compatibility.
- `scripts/validate-community.mjs`: strict local/CI validator.
- `src/core/` (future): deterministic placement, rules, completion checks; cannot depend on rendering or live network.
- `src/platform/` (future): local file import/export, IndexedDB save/cache, network catalogue opt-in.
- `src/modes/` (future): Workshop, Explore, Campaign, Architect, Atlas.

## Persistence and versioning

Store city packs separately from `campaignSave`. The campaign save includes a stable ending receipt and `commonsUnlocked`; creating new saves must not silently unlock Commons. No DRM or remote account lookup. Keep schema `v1` readable; future changes should migrate explicitly or show compatibility errors, never silently misplace architecture.

## Publication gates

- Correct schema and semantic validation.
- Fixed puzzle seed, deterministic completion, no off-grid or duplicate-snap target.
- Export-import round trip preserving the result.
- At least one recorded playthrough from the initial state to a valid completion.
- VR performance and readability budget.
- Human moderation of content and copyright/rights affirmation.

The name **The Commons** expresses the premise: shared worlds owned by their creators, not a corporate-only marketplace.
