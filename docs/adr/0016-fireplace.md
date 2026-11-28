# 16. Fireplace: a keyboard by the fire, its notes ember fireballs

Date: 2026-11-27

## Context

A third style was wanted: a 3D keyboard standing at an angle to a fireplace in a warm room, the
song's notes ember fireballs coming out of the fire in each hand's color.

## Decision

- **The keyboard is the piano's own.** Fireplace draws the keys with `piano/instrument.js` and reads
  which are down from `piano/model.js`, so the keys look and press the same in both styles.
- **It stands in the room through a placed view** (`placed` in `view.js`): drawing at the keyboard's
  own coordinates lands where it stands in the room, turned 22° toward the fire. The room and the fire
  are drawn in room coordinates (`fireplace/layout.js`).
- **Fireballs fly on a fixed arc** from a point in the fire to their key, leaving 1.4 s before the
  note and landing exactly on it, then burst into sparks; a held note's key smolders. They burn with
  the shared flame drawing (`flames.js`), in a fire ramp made from the hand's color.
- **The fire follows the song's energy** (`energy.js`) with a flicker on top, and lights the wall,
  floor and stone.
- **Polygons are cut at the camera instead of dropped** (`fillPolygon`), so the floor runs under the
  camera. This changes every style, for the better: faces that reach behind the camera used to vanish
  whole.

## Consequences

- Room colors are fixed and warm whatever the palette; the palette colors the fireballs and the lit
  keys. The Ember colors look most like fire.
- In 2D, seen from above, the chimney breast hides the fire itself; the fireballs still fly from it.
