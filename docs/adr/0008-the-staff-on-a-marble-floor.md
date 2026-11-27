# 8. The staff on a marble floor

Date: 2026-11-27

## Context

The Staff style was wanted as a floor: the staff lying on dark marble, balls bouncing across it like
someone walking, and the floor, staff and balls moving along together. The existing 3D staff stands
upright, and its camera angles are made for that.

## Decision

- **A floor view, not a second staff.** `staff/floor.js` makes a view that turns the staff's own
  coordinates onto the ground: x along the floor, y across it, z up off it. Every staff helper
  (lines, clefs, ledgers, rings, glows) already draws through a view, so they draw on the floor
  unchanged. Glows' light beams ask the view which way is up (`view.rise`).
- **Marble Walk** (`staff/walk.js`) is the first Staff animation, and the app opens on it in 3D. A
  ball for each hand follows `staff/bounce.js`: it lands on each of its hand's notes (one landing a
  chord) exactly as it sounds and arcs between them, waiting on its note through long rests. The
  ball stays at the playhead while the music scrolls under it, so the floor carries the motion.
- **The marble moves with the music.** Its tiles are fixed to moments of the song, each with its
  own shade and veins, so the ground slides toward the camera at the notes' speed. What rises off the
  floor (the balls) is drawn again, mirrored and faint, as its reflection.
- **An animation can bring its own camera rig** (angles and slider ranges, `rigOf` in `kinds.js`).
  Marble Walk has Walk, Behind, Beside and Overhead; the upright animations keep Front, Angled, Low
  and Lane. Changing to an animation with another rig starts it on that rig's angle.
- The upright staff stays for the other four animations.

## Consequences

- A Marble Walk frame costs about 6–18 ms on the Intel Mac it was built on, mostly the tiles and veins.
- On light palettes (Ivory) the marble is pale.
