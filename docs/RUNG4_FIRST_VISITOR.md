# Rung 4 — First Visitor Experience

Now that PieceByPiece is publicly hosted, the primary goal is making the **first five minutes understandable** without a creator walking someone through every button.

## Features

### A gentle first-run welcome

A friendly introduction appears on a fresh browser campaign save. It explains the game's three layers: Assemble → Explore → Connect. Returning players who have already placed a part go straight to their saved workshop.

### Contextual guidance

The right-hand panel updates its tips as the player builds, completes the city, explores interiors, helps neighbors, and connects the power grid. The tips are ordinary accessible HTML text and are derived from the existing deterministic progress state.

### Placement assist (opt-in)

In Workshop, players can explicitly enable **one-piece placement assistance** and press **Fit selected piece (assisted)**. The button sets the correct orientation, then calls the *existing* `placeAt()` → `tryPlace()` path. It never grants rewards directly or bypasses saving. This is particularly useful for an accessibility fallback or testers who need to reach the city experience promptly. Assistance is OFF by default and never timed.

### Quick neighborhood preview (read-only)

From Workshop, select **Preview finished neighborhood** to see the café, house, garden, and residents as if all structures were assembled. You can walk into the café and house but cannot complete quests, switch power relays, open the campaign gate through a preview, or create a completed-game save.

Preview state is created as an independent temporary object from canonical v1 city pack data. **It is never written to localStorage.** Returning to Workshop restores exactly the previously assembled real pieces. The existing Rung 1–3 campaign and city-system save keys remain untouched.

## Desktop release verification

1. Open the deployed Pages site in a fresh browser or private tab. Confirm the welcome introduction appears. Select **Start building**.
2. Choose a part, match its rotation with **R**, place it normally, reload, and confirm the part is still assembled without the welcome resurfacing.
3. Check **Show gentle placement hints**. Enable **one-piece placement assistance** and fit a piece, then confirm the real saved piece count increments exactly once.
4. Enter **Preview finished neighborhood** before completing the puzzle. Walk past the completed café, house, and garden, enter both interiors, and talk to citizens. No missions or circuit progress should be awarded.
5. Click **Exit preview** or **Return to workshop**. Confirm original piece count, progress, and relay state are unchanged.
6. Complete the remaining buildings normally and confirm the full campaign path is still available, including the ordered errands and Lantern Grid.
7. Reload an existing Rung 3 campaign save. The original progress must remain visible. A guest preview cannot overwrite it.
8. Confirm mobile layout has no permanently obstructed controls. Use desktop keyboard Tab to reach the welcome buttons, checkboxes, and assist button.
9. Verify the public GitHub Pages build passes the `/PieceByPiece/` asset-path test and the deployment job completes on `main`.

## Quest 3 acceptance

- Desktop first: use **Preview finished neighborhood**, then enter headset mode, and verify normal VR movement/interaction.
- Ensure the introduction does not block Enter VR when already inside a headset. VR controller rays, world-space labels and menus must remain reachable.
- Confirm returning to Workshop from a VR preview restores the real, incomplete tabletop construction.
- Recheck snap turn, teleport safety, and interior exit sign placement on physical Quest hardware.

**Limitations:** this rung does not add new cities or NPC stories. The Quest headset experience still needs hands-on verification. A successful CI compilation is not a VR usability test. Guided placement intentionally simplifies puzzles only when the player opts in.
