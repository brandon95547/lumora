# 2. 3D through our own camera, not a 3D engine

Date: 2026-11-26

## Context

People want the staff in 3D, seen from an angle they choose, as well as flat. The obvious tool is
a WebGL engine such as Three.js: real lighting and post-processing, but about 130 KB gzipped more
on the page, a second renderer to keep in step with the 2D one, and a GPU canvas the exporter would
have to read back.

## Decision

3D is a view, not a set of styles. `src/shared/scene/view.js` has two views with the same shape:

- `flatView`: the 2D picture, as laid out;
- `cameraView`: a perspective camera that turns (around the staff), tilts (up and down) and moves
  in or out, with fog in the distance and an optional slow drift.

Every drawing helper in `styles/common.js` and `staff.js` projects through the view, so each style
is written once and draws in 2D and in 3D. Points (the lit notes) face the camera as glass balls
with glows and beams of light; things on the staff (lines, ledgers, clefs, accidentals, ripples)
are foreshortened on its plane. The 3D frame adds a floor with a grid that keeps time with the
music, and reflections, drawn with a mirrored view of the same staff and style.

The ready-made angles are Front, Angled, Low and Lane; Turn, Tilt and Distance fine-tune them.

## Why

- No dependency, and no bytes added on load: the camera is about 150 lines.
- Frames stay a pure function of time, so preview, scrubber and export still agree, and the
  exporter is unchanged.
- A new style gets 3D for free; there is never a 2D and a 3D copy of a style to keep in step.
- Fast enough: a full-size 3D frame draws in 1–2 ms on a laptop; a 17 s video exports in about 5 s.

## Consequences

- No true lighting or shadows: the look comes from glows, glass-ball sprites, fog and reflections.
  If that ever falls short, a WebGL view can be added behind the same `project` interface.
- In a 9:16 video a strongly turned staff runs off the side of the frame into the distance; that is
  part of the look.
