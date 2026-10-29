# Rung 2 — Living Neighborhood playtest and acceptance

This is a scoped playable expansion of the Rung 1 prototype, **not** the finished RPG or full five-city campaign. It is primarily a desktop/WebXR vertical slice. Automated CI verifies the deterministic rules and build, but physical Quest 3 behavior must be evaluated separately.

## New gameplay

- The rebuilt café, house, and garden activate **Celia, Jules, and Moss**, visible as low-poly citizens with selectable nameplates.
- Each citizen speaks and has context-sensitive dialogue.
- The gentle errand sequence is **Celia's parcel -> Jules's lantern seeds -> Moss's garden**. No timers or combat. Talking too early does not accidentally advance the story.
- The **Sunbeam Café** and **Bluebell House** have small, handcrafted 3D interior scenes. Entrance plaques are interactable in the full-size city. Exit signs and a DOM Exit button return to the neighborhood.
- Workshop still uses the original schema-valid 12-piece city pack, deterministic snapping, and original local save key. No data migration required.
- The core navigation helper applies bounded player movement, building collision, sliding, and a clear-ground teleport gate.
- Ambient sound is synthesized locally, muted until explicitly enabled. No online sound sources and no autoplay.
- Desktop conversation text is real, selectable DOM text. XR has a readable, multi-line speech panel; select it to close.

## Desktop acceptance

1. Open the Vite preview or Actions build in a modern desktop browser. Check no console exceptions.
2. Assemble each building from the part tray; a wrong rotation does not count, a correct snap does.
3. Reload halfway through construction and after completing an errand. Parts and mission progression must remain saved.
4. Enter city only after all pieces are assembled. Walk with WASD, right-drag to look, and confirm you cannot move through the café or house.
5. Talk to Moss or Jules **before** Celia; the quest must not complete. Talk to Celia, then Jules, then Moss, and check the carried-item label and quest status.
6. Open the café and home entrance signs, inspect each interior, use the Exit button, and check the workshop return.
7. Enable then disable audio. Sound must start only after an intentional click and must mute on demand.
8. Reset city and confirm its local build/quest data is cleared. No network account required.

## Quest 3 WebXR manual acceptance

1. Open the deployed build over HTTPS in Quest Browser; `localhost` on the development PC is **not** a secure origin for a separate headset.
2. Enter VR from the page. Check both controller rays and selection, grip rotation, and shelf paging in a seated and a standing setup.
3. Assemble a part by aiming at the tabletop board. Confirm ghost and placement offset are reasonable in both hands.
4. Enter full-sized city and teleport only onto walkable ground. Try teleporting onto roofs/into occupied building footprints; it must refuse.
5. Use a grip in Explore Mode to snap-turn 45° and confirm there are no flashes, abrupt vertical camera moves, or unintended strafes.
6. Select each neighbor and confirm the speech panel is legible at a comfortable distance. Select the panel to dismiss, then talk again.
7. Enter and leave each interior in VR, without the exit sign ending up behind the headset.
8. Test comfort/performance with normal headset settings. Monitor dropped frames and any controller tracking loss.

## Known constraints / future Rung 3 work

- Physical headset interactions remain **unverified** until tested with Quest 3.
- Interiors are cutaway rooms entered through transitions, not seamless door/portal geometry.
- Citizens are stationary low-poly avatars. No pathfinding, voiced dialogue, full NPC schedules, advanced quest authoring or enemies yet.
- The living neighborhood is still one city; new campaign regions and Megacorporation Citadel remain roadmap items.
- The Commons remains a designed community-pack format without an in-game public publishing UI.
- VR hand models are stylized controllers rather than full hand tracking, and collision is a simple 2D footprint approximation.
- No GitHub Pages deployment is introduced here. The CI build artifact is available from Actions; publication requires separate hosting setup.
