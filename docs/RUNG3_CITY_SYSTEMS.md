# Rung 3 — City Systems / Lantern Grid

## What this rung demonstrates

The **same physical pieces** a player assembled in the peaceful workshop become infrastructure prerequisites in full-scale exploration. Helping the neighbors unlocks a source and two switches. Connecting the three enables warm street lanterns and a permanent public passage into a small Commons Overlook.

This is a playable proof of architecture-to-world causality, not a full city traffic or electrical simulator.

### Authored chain

| Node | Must complete | Player action | Visible result |
| --- | --- | --- | --- |
| Café Generator | Café + Celia's errand | Turn generator on | First cable energizes |
| House Relay | House + Jules's errand + café-door | Route power through switch | Second cable energizes |
| Garden Relay | Garden + Moss's errand + home-door | Route power through switch | Garden line energizes |
| Lantern Walk | Garden + garden-lamp piece | Automatically consumes electricity | Lantern brightens |
| Commons Overlook Gate | Garden + garden-bridge piece | Automatically unlocks | Gate bar rises; area becomes walkable |

A player's real placed-piece IDs and canonical mission IDs are checked by `src/core/city-systems.mjs`. The authored graph lives in `game/campaign/living-block-systems.json`. Community city packs remain unmodified and cannot submit JavaScript or arbitrary circuit files.

### Persistence

Infrastructure state has its own versioned, namespaced browser save key, independent of the pre-existing construction/mission save key. This is deliberate: existing Rung 1–2 saves are preserved without migration. Turning a relay off after opening the overlook dims the lamps but does not lock the player into the enclosure. Resetting the neighborhood also resets power-system state.

### Ways to interact

- **Desktop:** In Explore Mode, use the new Lantern Grid controls in the panel or click the 3D crystal markers near the café, home, and garden. The gate status and power count update after each action.
- **Quest 3:** Point a controller ray at the outdoor relay station and use the trigger. The existing comfort controls remain: trigger-based teleport, grip snap-turn, readable conversations, and accessible physical workshop.
- **Offline:** No server, telemetrics, account, script plugin, or external content dependency. The optional sound system remains opt-in.

### Manual acceptance checklist

1. Load a previously completed neighborhood save. Existing pieces, neighbors, and conversations remain saved; the Lantern Grid begins fresh and off.
2. Attempt to enable a relay before talking to its neighbor. It must refuse without changing local power state.
3. Help Celia, Jules, and Moss in order. Turn on the generator and two relays. Inspect the visible cable illumination, lanterns and rising gate.
4. Before gate activation, attempt to walk or teleport into the northeastern overlook. Both should be rejected. After power, the same destination should be accessible.
5. Turn the café generator off. Lanterns dim, but the already-open public overlook stays accessible, preventing player trapping.
6. Reload the page. Switch positions and the unlocked gate persist. Reset neighborhood and confirm both construction and circuit saves clear.
7. On Quest 3, verify both controller rays can hit the crystals, signs are legible, and no station obstructs an NPC or doorway. Test sitting and standing.

### Known scope boundaries

- This is one small neighborhood circuit, not a generic public-authored wiring editor.
- The current platform uses lightweight geometry, static citizens, and approximate 2D collision rules.
- Real Quest 3 comfort/performance and desktop visual polish still require manual user playtesting. CI success checks compilation and logic, not headset ergonomics.
- No always-on service or community upload backend is introduced.
- Next rungs can generalize infrastructure as versioned declarative authored primitives once this curated campaign system passes hands-on validation.
