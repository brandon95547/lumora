# 4. The whole grand piano, framed by the camera

Date: 2026-11-26

Replaces the framing part of ADR 0003.

## Context

The piano style showed a keyboard only, and ADR 0003 sized it to the song: a 16:9 video built the
five or more octaves the song used, a 9:16 one about two octaves. People wanted it to look like a
grand piano: the lid, the case, everything. A grand always has 88 keys, so building only some of
them no longer works.

## Decision

- **Always 88 keys.** The camera, not the model, decides how much is seen.
- **The instrument is geometry** (`piano/grand.js`): the case outline (straight bass side,
  bentside, tail) as rim panels; the lid propped about its bass-side hinge; soundboard, gold plate
  with its holes, strings (copper in the bass), dampers; music desk; keybed, three legs and the
  pedal lyre; a pool of light and a shadow on the floor. All in white-key units, built once.
- **Painter's order.** Each frame the visible faces are sorted far to near and painted. The
  keyboard (with its own careful order) goes in as one item at its depth.
- **Lacquer lighting.** Each face is shaded from its normal: a little diffuse light, a highlight
  toward the camera, a lift for faces turned up and a rim light toward the silhouette. The lid
  carries a band of reflected light. Panels are sealed with a stroke so no hairlines show.
- **Distance means framing.** In 3D, Distance 1 fits the whole instrument across the frame; as it
  rises, the camera's aim moves from the body to the keys and starts following the music. A 9:16
  frame comes 30% closer for the same setting. The 2D overhead shot still frames the song's span.
- Falling Notes keeps the keyboard alone: its bars run where the case would be.

## Consequences

- Frames cost about 2–4 ms; a 17 s 1080p video exports in about 10 s.
- The ordering is by face, not by pixel, so extreme hand-set angles can show small overlaps.
