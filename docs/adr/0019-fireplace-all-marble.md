# 19. Fireplace: all dark marble glass, the keyboard turned to the camera

Date: 2026-11-27

The Fireplace style is replaced by Galaxy: [ADR 20](0020-galaxy-shooting-stars.md).

## Context

After ADR 18 the fireplace's stone surround still read as brown, and the keyboard's right end sat
too far back.

## Decision

- **The keyboard turns about its left end:** the lowest key stays where it was and the keyboard turns
  from 14° to 4°, bringing the treble end forward so the keyboard faces the camera.
- **The fireplace is dark marble glass too** (`drawMarble` in `fireplace/marble.js` fills any face):
  the surround and the chimney have veined black fronts, the mantel is black marble, and a thin gold
  trim runs round the firebox and along the mantel's edge. The stone is gone.
- **The fire's glow in the marble is sized to the fireplace,** not the frame, so it stays a warm sheen
  around the fire whether the camera is close or far; the fire's light over the scene is sized to the
  stage the same way.

## Consequences

- Close or far, nothing in the scene reads brown; the warm color comes only from the fire.

## Update

- The keyboard is now centered on the fireplace: its middle sits in front of the fire's middle, still
  turned 4°, and the camera centers on both.
- The keyboard stands well out from the fire (about 64 units, 1.5 m, in front of the fireplace), so the fireballs' flight shows; they arc higher (24–36 units). The
  stage runs further forward to hold it. Player now looks from the side (turned −30°), where the arc
  reads best; Front is the straight-on view; Hearth is gone.
- **Follow the keys being played** (a switch beside the camera drift, `camera.follow`, for a rig with
  `follows`): the camera moves along the keyboard to where the music is, gliding with the piano's own
  `followX`, and stops at the keyboard's ends. Distance now reaches 4×, so it can stay close. Off by
  default.
