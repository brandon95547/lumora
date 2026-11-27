// How the staff's world (the layout's pixels, z = 0 on the staff) reaches the screen.
// The flat view is the 2D picture as laid out. The camera view looks at the same world in
// perspective, from an angle, so every style can be drawn in 2D or 3D without a second version.

const DEG = Math.PI / 180;

/** Ready-made camera angles. Turn swings the camera around the staff; tilt raises it. */
export const ANGLES = [
  { id: 'front', label: 'Front', turn: 0, tilt: 10, zoom: 0.82 },
  { id: 'angled', label: 'Angled', turn: 34, tilt: 12, zoom: 0.88 },
  { id: 'low', label: 'Low', turn: 26, tilt: -5, zoom: 0.88 },
  { id: 'lane', label: 'Lane', turn: 62, tilt: 10, zoom: 0.95 },
];

export const TURN_RANGE = [-70, 70];
export const TILT_RANGE = [-10, 35];

export const DEFAULT_CAMERA = { turn: 34, tilt: 12, zoom: 0.88, drift: true };

/** The angle a camera matches, or null once it has been turned by hand. */
export function angleOf(camera) {
  return ANGLES.find((a) => a.turn === camera.turn && a.tilt === camera.tilt)?.id ?? null;
}

/** Where notes live along the staff, and where the staff begins. */
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
  const sway = camera.drift ? 1 : 0;
  const yaw = (camera.turn + sway * 3.5 * Math.sin(t * 0.21)) * DEG;
  const pitch = (camera.tilt + sway * 1.8 * Math.sin(t * 0.29 + 1)) * DEG;
  const [cosY, sinY, cosP, sinP] = [Math.cos(yaw), Math.sin(yaw), Math.cos(pitch), Math.sin(pitch)];

  // The camera circles a pivot: the playhead for scrolling styles, the page's middle for paged ones.
  const pivotX = motion === 'scroll' ? layout.playheadX : (layout.noteLeft + layout.noteRight) / 2;
  const pivotY = (layout.grandTop + layout.grandBottom) / 2;
  const distance = 1.05 * Math.max(layout.width, layout.height * 0.7);
  const near = distance * 0.12;
  const fogStart = distance * 1.5;
  const fogEnd = distance * 3.4;
  // As the camera turns, the pivot moves toward the side the music comes from.
  // The sharper the turn, the further the staff runs into the distance, so the pivot moves over
  // to keep where the staff vanishes inside the frame.
  const swing = Math.min(1, Math.abs(camera.turn) / 30);
  const lean = Math.sign(camera.turn) * Math.abs(Math.sin(camera.turn * DEG));
  const scrollTarget = layout.portrait ? 0.52 - 0.12 * lean : 0.44 - 0.22 * lean;
  const target = layout.width * (motion === 'scroll' ? scrollTarget : 0.5 - 0.12 * lean);
  const anchorX = pivotX + (target - pivotX) * swing;
  // Keep the staff's middle near the middle of the frame (below the title in 9:16).
  const anchorY = layout.height * (layout.portrait ? 0.5 : 0.52);
  const focal = distance * camera.zoom;

  const depthOf = (x, y, z) => {
    const dx = x - pivotX;
    const dy = y - pivotY;
    const z1 = dx * sinY + z * cosY;
    return distance + z1 * cosP + dy * sinP;
  };

  const project = (x, y, z = 0) => {
    const dx = x - pivotX;
    const dy = y - pivotY;
    const x1 = dx * cosY - z * sinY;
    const z1 = dx * sinY + z * cosY;
    const y2 = dy * cosP - z1 * sinP;
    const depth = distance + z1 * cosP + dy * sinP;
    if (depth < near) return null;
    const s = focal / depth;
    const fog = Math.max(0, Math.min(1, (fogEnd - depth) / (fogEnd - fogStart)));
    // Very close to the lens, things fade rather than fill the frame.
    const close = Math.min(1, (depth - near) / (distance * 0.3));
    return { x: anchorX + x1 * s, y: anchorY + y2 * s, s, fog: fog * close, depth };
  };

  return {
    depth: true,
    opacity: 1,
    ...bounds,
    project,
    depthOf,
    near,
    // The camera's height in the world (y grows downward): the floor shows only from above.
    cameraY: pivotY - distance * sinP,
    glow: 1.35, // lights read smaller in depth, so they bloom a little more
    fade: (x) => edgeFade(bounds, layout.space, x),
  };
}

/** The same view seen in a mirror lying at height `floorY`: for reflections on the floor. */
export function mirrored(view, floorY, opacity) {
  return {
    ...view,
    opacity: view.opacity * opacity,
    project: (x, y, z = 0) => view.project(x, 2 * floorY - y, z),
    depthOf: (x, y, z = 0) => view.depthOf(x, 2 * floorY - y, z),
  };
}

/**
 * Projects a straight world segment, cut where it passes behind the camera.
 * Returns [a, b] screen points, or null when none of it is in front.
 */
export function segment(view, [x0, y0, z0], [x1, y1, z1]) {
  if (!view.depth) return [view.project(x0, y0), view.project(x1, y1)];
  const d0 = view.depthOf(x0, y0, z0);
  const d1 = view.depthOf(x1, y1, z1);
  const near = view.near * 1.01;
  if (d0 < near && d1 < near) return null;
  let a = [x0, y0, z0];
  let b = [x1, y1, z1];
  if (d0 < near) a = lerp3(a, b, (near - d0) / (d1 - d0));
  else if (d1 < near) b = lerp3(b, a, (near - d1) / (d0 - d1));
  return [view.project(...a), view.project(...b)];
}

const lerp3 = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);

/**
 * Sets ctx's transform so that drawing at (0, 0) in local units lands on the staff plane at (x, y),
 * foreshortened as the camera sees it there. Returns false if that spot is behind the camera.
 */
export function onPlane(ctx, view, x, y) {
  const o = view.project(x, y);
  if (!o) return false;
  const h = 4;
  const ex = view.project(x + h, y);
  const ey = view.project(x, y + h);
  if (!ex || !ey) return false;
  ctx.transform((ex.x - o.x) / h, (ex.y - o.y) / h, (ey.x - o.x) / h, (ey.y - o.y) / h, o.x, o.y);
  return true;
}
