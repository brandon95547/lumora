# 12. One animation per style: Marble Walk and Falling Notes

Date: 2026-11-27

## Context

Lumora had three styles and ten animations: Staff (Marble Walk, Glow Lane, Ripple Pages,
Constellation, Ribbon), Piano (Live, Falling Notes) and Fire (Fireball Run, Two Hands, Gothic).
Marble Walk, with its burning balls, ghosts and heat, became the look Lumora is built around, and
the others were not being used.

## Decision

- **Staff keeps Marble Walk alone; Piano keeps Falling Notes alone; Fire is removed.** Their code
  is deleted, not hidden: the Fire style (`fire/`), the four upright-staff animations, Live and the
  grand piano's case (`piano/grand.js`), and the helpers only they used (the upright staff's camera
  and grid floor, paged placement, the Fire style's flame ramps and embers).
- **The style and animation structure stays** (`kinds.js`, each style's `index.js`), so a new
  animation is still one file in its style's folder.
- The piano camera always frames the keys for falling notes; zoom 1 now frames a grand piano's width
  of keys instead of the whole instrument. The Concert angle, which framed the whole instrument, is
  gone; Player is the default.

## Consequences

- A look saved with a removed animation's id falls back to Marble Walk (`animationById`).
- The parts of ADR 4 (the whole grand piano), ADR 5 (the Fire style) and ADR 6 (the Gothic nave)
  about those animations no longer describe the app. ADR 6's hands from the music still holds, and
  ADR 5's song energy (`energy.js`) and flames (`flames.js`) live on in Marble Walk.
