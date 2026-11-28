# 17. Fireplace in space, the keyboard beside the fire

Date: 2026-11-27

Where the keyboard stands, and the hearth, are replaced by [ADR 18](0018-fireplace-marble-stage.md).

## Context

In ADR 16's Fireplace, the keyboard's wooden console stood between the camera and the fire and
hid it, and the scene was a room. The wish: just the keyboard on a stand, turned so the fireplace
shows, in a space galaxy instead of a room.

## Decision

- **No room.** The wall, floor and rug are gone. Behind everything is space (`fireplace/space.js`):
  a dark sky, nebula clouds in the palette's colors with deep blues, a tilted spiral galaxy and stars,
  painted once per format and palette, with a few brighter stars twinkling that shift as the camera
  turns.
- **The fireplace stands on its own** (`fireplace/hearth.js`): a stone hearth, the stone surround
  with its firebox, a short chimney and the mantel.
- **The keyboard is on a slim X stand**, its own body low under and behind the keys and nothing above
  them. It stands to the left of the fire, turned 50° toward it, so the fire shows past it.
- **The angles are Player, Hearth, Keys and Wide** (Room became Wide). Hearth looks from the fire's
  open side, so the keyboard never hides it.

## Consequences

- The fireballs' paths, the fire and the keys are as in ADR 16; only where things stand changed.
- In 2D, from above, the fireplace is seen from its top and the fire itself is hidden.
