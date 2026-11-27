# 13. Planets: pitch as distance from the sun

Date: 2026-11-27

## Context

A third style was wanted beside Staff and Piano: the solar system, with the two hands animating in
ways that fit the theme.

## Decision

- **Pitch is distance from the sun, and the hands split at the asteroid belt.** The right hand plays
  the rocky planets, the left hand the giants, as the treble sits above the bass. Each hand's notes
  are shared over its four planets by the quartiles of that hand's own pitches, so every planet plays
  whatever the song's range (`planets/system.js`).
- **The music moves the planets.** Each note steps its planet forward along its orbit, eased over
  0.35 s, on top of a slow drift (faster nearer the sun). A planet's place at t is its drift plus a
  count of its notes so far, found by binary search, so any frame is drawn on its own.
- **Effects come from the song, worked out once:** alignments from chords of three notes or more over
  two planets or more; comets from fast right-hand runs, spaced at least 10 s apart; the sun's corona
  from the shared song energy (`energy.js`).
- **Planets are painted once** into small pictures (bands, spots, land, craters) and lit each frame:
  a gradient turns their night side away from the sun.
- **Zoom in 2D.** A style can give a `flatZoomRange`; the Look panel then shows Zoom in 2D, and
  `render` receives it. Piano frames fewer keys and follows the music; Planets comes in toward the sun.

## Consequences

- Planets adds about 4 KB to the first screen's script, as the other styles do; styles are not split
  out yet.
- Stars and planets are drawn on every palette, including Ivory, where they read as a star chart.
