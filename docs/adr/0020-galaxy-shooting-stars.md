# 20. Galaxy: a keyboard in space, its notes shooting stars

Date: 2026-11-27

## Context

The Fireplace style (ADRs 16–19) was to lose the fireplace and everything it stood on: just the
keyboard in a galaxy, with the stars in the distance becoming the notes, each hand in its own color,
shooting down and landing on the keys.

## Decision

- **The style is now Galaxy, its animation Shooting Stars** (`src/shared/scene/galaxy/`). With no
  fireplace the old name no longer fit. Its id changed too (`galaxy`), so camera angles saved for
  Fireplace are not offered here: they framed a scene that no longer exists.
- **Gone:** the fireplace, the fire, the dark marble stage and dais, the stand, and the fireballs.
- **The keyboard floats at the origin facing the camera,** with a slim body under and behind its keys
  (`base` in `piano/instrument.js`, so the piano's own drawing keeps one home).
- **Each note is a star far out in the sky** (`galaxy/layout.js` `starOf`): across a wide band, low
  notes to the left and high notes to the right, at its own height and distance. It fades in 3.5 s
  before it shoots, twinkling, and brightens in the last half second.
- **It shoots in a curve** that bows up and over, 1.5 s before its note, faster as it falls, and lands
  exactly as the note sounds, scattering sparkles; the key glows while the note is held. Its trail is
  spaced along the path, not in time, so it stays one streak as the star speeds up.
- **The camera** stands behind the keyboard with the sky above it: Player, Side, Keys and Wide. The
  follow switch (ADR 19) carries over. In 2D it looks straight down, the stars coming in from the top.

## Consequences

- The marble, fire and fireball code is deleted; the shared flame drawing stays for Marble Walk.

## Update: the stars come from the galaxy

- The spiral galaxy is now in the scene (`galaxy/spiral.js`), slowly turning, not painted on the
  sky. Each note's star is born in it: the left hand's along one arm, the right hand's along the
  other, each arm faintly in its hand's color. It shines there before its note, brightens, then
  flies 2 s from the galaxy to its key.
- **The galaxy hangs at a fixed place in the frame** (high, right of center in 16:9), far out beyond
  the keyboard: `galaxyAt` finds that point in the world from the camera at each moment
  (`unproject`, the inverse of `project`, added to `view.js`). Fixed in the world, it fell out of
  frame at some angles. A star leaves from where the galaxy was when it set off, so every frame is
  still a pure function of t.
- The wide band of note stars across the sky is gone.
