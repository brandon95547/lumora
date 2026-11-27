// The staff's views: flat, or a camera circling the playhead (scrolling styles) or the page's
// middle (paged ones), with where notes live along a staff that may run on into the distance.
import { aim, perspective } from '../view.js';

/** Ready-made camera angles. Turn swings the camera around the staff; tilt raises it. */
export const STAFF_ANGLES = [
  { id: 'front', label: 'Front', turn: 0, tilt: 10, zoom: 0.82 },
  { id: 'angled', label: 'Angled', turn: 34, tilt: 12, zoom: 0.88 },
  { id: 'low', label: 'Low', turn: 26, tilt: -5, zoom: 0.88 },
  { id: 'lane', label: 'Lane', turn: 62, tilt: 10, zoom: 0.95 },
];

function boundsFor(layout, motion, depth) {
  if (!depth || motion === 'page') {
    return { staffLeft: layout.marginX, noteLeft: layout.noteLeft, noteRight: layout.noteRight };
  }
  // In 3D a scrolling staff runs on into the distance; it starts a little behind the playhead.
  const noteLeft = layout.playheadX - layout.pixelsPerSecond * (layout.portrait ? 0.55 : 0.9);
  return {
    staffLeft: noteLeft - layout.space * 5,
    noteLeft,
    noteRight: layout.playheadX + layout.pixelsPerSecond * 8,
  };
}

function edgeFade(bounds, space, x) {
  const span = space * 2.5;
  return Math.max(0, Math.min(1, (x - bounds.noteLeft) / span, (bounds.noteRight - x) / span));
}

export function flatView(layout, motion = 'scroll') {
  const bounds = boundsFor(layout, motion, false);
  return {
    depth: false,
    opacity: 1,
    glow: 1,
    ...bounds,
    project: (x, y) => ({ x, y, s: 1, fog: 1 }),
    fade: (x) => edgeFade(bounds, layout.space, x),
  };
}

export function cameraView(layout, camera, t, motion = 'scroll') {
  const bounds = boundsFor(layout, motion, true);
  const { yaw, pitch } = aim(camera, t);
  const pivotX = motion === 'scroll' ? layout.playheadX : (layout.noteLeft + layout.noteRight) / 2;
  const pivotY = (layout.grandTop + layout.grandBottom) / 2;
  // The sharper the turn, the further the staff runs into the distance, so the pivot moves over
  // to keep where the staff vanishes inside the frame.
  const swing = Math.min(1, Math.abs(camera.turn) / 30);
  const lean = Math.sign(camera.turn) * Math.abs(Math.sin((camera.turn * Math.PI) / 180));
  const scrollTarget = layout.portrait ? 0.52 - 0.12 * lean : 0.44 - 0.22 * lean;
  const target = layout.width * (motion === 'scroll' ? scrollTarget : 0.5 - 0.12 * lean);
  const view = perspective({
    pivot: [pivotX, pivotY, 0],
    // Keep the staff's middle near the middle of the frame (below the title in 9:16).
    anchor: [pivotX + (target - pivotX) * swing, layout.height * (layout.portrait ? 0.5 : 0.52)],
    distance: 1.05 * Math.max(layout.width, layout.height * 0.7),
    zoom: camera.zoom,
    yaw,
    pitch,
  });
  return { ...view, ...bounds, fade: (x) => edgeFade(bounds, layout.space, x) };
}
