# 19. Fireplace: all dark marble glass, the keyboard turned to the camera

Date: 2026-11-27

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
