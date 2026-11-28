# 14. Planets: the keys are stars, and their light strikes the planets

Date: 2026-11-27

The Planets style is removed by [ADR 15](0015-planets-removed.md).

## Context

In Solar System a note showed up only as it sounded: its planet flared and the sun sent it a ray.
The stars in the sky were decoration. The wish was for the stars to be the keyboard's notes and for
their light to bounce off the planets.

## Decision

- **88 stars, one per key, in an arch over the system** (`planets/stars.js`), from the lowest key at
  the left to the highest at the right, every C a little brighter so the octaves read. They sit on
  the frame like the sky, not in the world, so the arch holds still while the camera moves.
- **Each note's star fires a mote of light `LEAD` (1.1 s) before the note**, along a gentle curve to
  where its planet is at each moment, speeding up as it falls. It reaches the planet exactly as the
  note sounds, and then glances off, never straight back, slowing and fading over 0.9 s.
- **The star lights with the note:** a sharp four-pointed sparkle for the right hand, a soft swelling
  glow for the left, bigger for harder notes and lit while the note is held.
- **The sun's rays are gone.** The incoming starlight now marks each note's arrival, and having both
  would show it twice. The planet's flare and ripple stay.

## Consequences

- Notes can be seen coming, as in Falling Notes. A busy song fills the sky with streaks; motes are
  small and quick so they read as starlight.
- A frame draws every note starting from 1.9 s before t to 1.1 s after it, still a pure function of t.
