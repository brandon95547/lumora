# 18. Fireplace: the keyboard faces the camera before a raised fire, on dark marble glass

Date: 2026-11-27

## Context

With the keyboard turned 50° beside the fire (ADR 17), the fireballs flew across the keys
sideways. The keyboard should stand in front of the fireplace, turned just enough to show some of
it, and the brown hearth should be dark marble glass. The aim is to come in close and see the keys,
the fire and the fireballs well.

## Decision

- **The keyboard faces the camera,** turned 14° and standing a little left of the fire's middle, so
  the fireballs fly toward the player and land on the keys head-on.
- **The fireplace is raised on a dais** 12 units (about 28 cm) high, so its fire shows over the keys.
  Its opening, mantel and fire are placed from the dais top (`HEARTH_Y`).
- **Everything stands on dark marble glass** (`fireplace/marble.js`): a near-black polished top with
  pale and gold veins and a bright near edge. The stage floor mirrors the fire's glow, the fireballs
  and the keyboard; the dais top mirrors the fire and the fireballs. The stone hearth is gone.
- **The camera comes in closer.** Player frames the keys and the fireplace; Keys comes in on the keys
  with the fire behind; Hearth and Wide show the whole stage. 2D frames the keyboard and fireplace.
- The fireballs' arc is lower (12–20 units above the line between fire and key), as they no longer
  cross the scene.

## Consequences

- The keyboard drawn twice (itself and its reflection) costs a little more per frame.
- The keyboard hides the lower part of the firebox from the Player angle; the flames show above it.
