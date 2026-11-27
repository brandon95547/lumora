# 5. Fire, worked out from the song in advance

Date: 2026-11-27

## Context

A third style: fire. A fireball bounces on every note, like the "MIDI ball" videos, and the fire
grows more powerful as the song goes on. Fire is usually a running particle simulation, and ball
videos usually run physics. Both would break the rule every frame keeps: it depends only on its time,
so the preview, scrubbing and export agree.

## Decision

- **The path is planned, not simulated** (`fire/path.js`). Notes are grouped into landings (a chord
  or notes under 0.11 s apart land together). Each landing gets a ledge: forward by its gap, higher
  for a higher top note, swinging side to side in 3D. Between landings the ball flies a parabola
  whose height grows with the gap, so it is on each ledge exactly when that note sounds.
- **"More powerful" comes from the music** (`fire/energy.js`): a heat level built from how many
  notes sound and how hard, heating fast and cooling slowly, scaled by the song's busiest
  passages and weighted to climb across the song. It is worked out once per song at 20 samples a
  second.
- **Flames are seeded, not simulated** (`fire/flames.js`). Each puff, spark and ember is placed from
  its birth time and a fixed random seed, then aged to t: it rises, swells, cools along the
  palette's fire ramp (white core, its two colors, smoke) and fades. Heat sets how many and how big.
- **Same camera.** 2D is a far, flat side-on camera that follows the ball; 3D uses the shared
  perspective camera with angles Chase, Side, High and Low. The camera's aim is the ball's path
  smoothed over a second, so it glides.

## Consequences

- No dependency; a frame is 2–4 ms; a 17 s 1080p video exports in about 6 s.
- The fire's color comes from the palette: Ember is classic fire; others give blue, green or pink.
