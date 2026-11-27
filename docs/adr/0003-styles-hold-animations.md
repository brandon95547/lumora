# 3. Styles hold animations; the piano is a second style

Date: 2026-11-26

## Context

The four animations so far all draw on a musical staff. A second look was asked for: a real grand
piano's keys playing the song, as in a video of someone playing live. It shares nothing with the
staff's stage (no clefs, no lines, no floor) but needs the same things around it: notes, palettes,
the 2D/3D switch, the camera, the preview and the export.

## Decision

- **A style (a "kind" in code) owns its stage and its animations.** `src/shared/scene/kinds.js`
  lists them: Staff (Glow Lane, Ripple Pages, Constellation, Ribbon) and Piano (Live, Falling
  Notes). Each kind has `render`, its own camera angles and their ranges. `renderFrame` asks the
  animation's kind to draw, then adds the title and progress line every video has.
- **One camera for both.** The perspective camera moved to `view.js` as a general `perspective()`.
  The staff's view adds where its notes run; the piano's looks at a keyboard instead. Mirrors work
  on any plane, so the staff's floor and the piano's fallboard reflect with the same code.
- **The piano is real geometry, not pictures.** Keys are blocks in the keyboard's proportions
  (a white key about six widths long; black keys offset as on a real piano), drawn as polygons
  through the camera, with faces turned away culled. Played keys tip down from the back. No image
  files or 3D engine, so it adds no download and stays a pure function of time.
- **Framing follows the format.** 16:9 shows the song's range (at least five octaves). 9:16 stays
  about two octaves wide and glides along the keys with the music: a smoothed average of the notes
  around now, so the same moment always frames the same way.
- **2D for the piano is the overhead lesson shot**: the same camera looking straight down from far
  away, so it needs no second drawing path.

## Consequences

- The Look panel reads Style → Animation → View → Angle; angles change with the style.
- The staff code moved into `scene/staff/`; ADR 0002's `view.js` now holds only what both kinds share.
- There are no hands. A follow-up could add them, but convincing hands need real modelling work.
