# 10. A haunted floor: ghosts, heat and mist in Marble Walk

Date: 2026-11-27

## Context

Marble Walk was wanted livelier as the song goes on: translucent ghosts flying across the stage, and
the stage heating up now and then under a faint mist.

## Decision

- **Song energy is shared.** `fire/energy.js` (how busy and loud the music is, climbing across the
  song) moved to `scene/energy.js`, so Fire and Staff read one measure.
- **Heat swells** (`staff/haunt.js`) are the song's most energetic moments above its 60th percentile,
  never two within 8 seconds. Each rises over 1.4 s, holds 1.6 s and cools over 3 s. The floor glows
  ember-orange around and ahead of the balls, and the mist thickens, warms and rises with it. A
  faint cool mist always drifts across the floor.
- **Ghosts** start about 8% into the song and come more often as it goes on and builds (every 9 s
  or so early, under 3 s near the end). Each crosses the stage over 5–8 s, ahead of the balls and
  above the floor, bobbing, fading in and out, its tail streaming back from its flight. They are
  drawn see-through with a soft glow, and show faintly in the floor's polish.
- Everything is seeded from the song and read as a function of t, so the preview and the export
  draw the same frames.

## Consequences

- Marble Walk frames cost about 4–11 ms on the Intel Mac it was built on.

## Later: burning balls and chord beams

- The balls catch fire from 22% of the song and are fully alight by 75%, flaring with the music's
  energy (`staff/blaze.js`). They burn with the Fire style's flame drawing, which moved from `fire/`
  to `scene/flames.js` so both styles draw fire one way. Its flames work in their own units with up
  as -y; a small view adapter scales them to the ball and turns their up into the floor's.
- A big chord (3 notes or more in one landing, at most one every 3 s per ball) sends a beam of light
  up through the ball, flashing and fading over 1.3 s.
