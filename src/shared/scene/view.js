// How a scene's world reaches the screen. A view has one job: project(x, y, z) → a screen point,
// its scale and how clear it is (fog). Flat views pass the picture through; perspective views look
// at the world through a camera, so the same drawing code makes 2D and 3D frames.
// World axes: x to the right, y downward, z away from the viewer.

const DEG = Math.PI / 180;

/** A camera's turn and tilt at time t, in radians, with its gentle drift if it has one. */
export function aim(camera, t) {
  const sway = camera.drift ? 1 : 0;
  return {
    yaw: (camera.turn + sway * 3.5 * Math.sin(t * 0.21)) * DEG,
    pitch: (camera.tilt + sway * 1.8 * Math.sin(t * 0.29 + 1)) * DEG,
  };
}

/**
 * A camera circling `pivot` at `distance`, turned by `yaw` and tilted by `pitch`, drawing the pivot at
 * screen point `anchor` with `zoom` pixels per world unit there.
 */
export function perspective({ pivot, anchor, distance, zoom, yaw, pitch, fogFrom = 1.5, fogTo = 3.4 }) {
  const [px, py, pz] = pivot;
  const [cosY, sinY, cosP, sinP] = [Math.cos(yaw), Math.sin(yaw), Math.cos(pitch), Math.sin(pitch)];
  const near = distance * 0.12;
  const fogStart = distance * fogFrom;
  const fogEnd = distance * fogTo;
  const focal = distance * zoom;

  const depthOf = (x, y, z = 0) => {
    const z1 = (x - px) * sinY + (z - pz) * cosY;
    return distance + z1 * cosP + (y - py) * sinP;
  };

  const project = (x, y, z = 0) => {
    const dx = x - px;
    const dy = y - py;
    const dz = z - pz;
    const x1 = dx * cosY - dz * sinY;
    const z1 = dx * sinY + dz * cosY;
    const y2 = dy * cosP - z1 * sinP;
    const depth = distance + z1 * cosP + dy * sinP;
    if (depth < near) return null;
    const s = focal / depth;
    const fog = Math.max(0, Math.min(1, (fogEnd - depth) / (fogEnd - fogStart)));
    // Very close to the lens, things fade rather than fill the frame.
    const close = Math.min(1, (depth - near) / (distance * 0.3));
    return { x: anchor[0] + x1 * s, y: anchor[1] + y2 * s, s, fog: fog * close, depth };
  };

  return {
    depth: true,
    opacity: 1,
    glow: 1.35, // lights read smaller in depth, so they bloom a little more
    project,
    depthOf,
    near,
    // Where the camera is, in the world.
    eye: [px - distance * cosP * sinY, py - distance * sinP, pz - distance * cosP * cosY],
  };
}

/**
 * The same view seen in a mirror: the plane `axis` = `at` ('y' for a floor, 'z' for an upright
 * panel facing the viewer). Used for reflections.
 */
export function mirrored(view, axis, at, opacity) {
  const flip = axis === 'y' ? (x, y, z = 0) => [x, 2 * at - y, z] : (x, y, z = 0) => [x, y, 2 * at - z];
  return {
    ...view,
    opacity: view.opacity * opacity,
    project: (x, y, z) => view.project(...flip(x, y, z)),
    depthOf: (x, y, z) => view.depthOf(...flip(x, y, z)),
    eye: view.eye && flip(...view.eye),
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
 * Sets ctx's transform so that drawing at (0, 0) in local units lands on the upright plane z = 0 at
 * (x, y), foreshortened as the camera sees it there. Returns false if that spot is behind the camera.
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

/**
 * Fills a flat polygon given by world corners; skipped if any corner is behind the camera.
 * `seal` also strokes its edge in the same color, so neighboring faces meet without a hairline.
 */
export function fillPolygon(ctx, view, corners, fill, alpha = 1, seal = false) {
  const points = corners.map((c) => view.project(...c));
  if (points.some((p) => !p)) return null;
  const fog = Math.min(...points.map((p) => p.fog));
  const a = alpha * fog * view.opacity;
  if (a <= 0.01) return points;
  ctx.globalAlpha = a;
  ctx.fillStyle = typeof fill === 'function' ? fill(points) : fill;
  ctx.beginPath();
  points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.fill();
  if (seal) {
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = 1.2;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
  return points;
}

/** Whether a flat face with outward `normal` (through `point`) turns toward the camera. */
export function facesCamera(view, normal, point) {
  if (!view.eye) return true;
  return normal.reduce((sum, n, i) => sum + n * (view.eye[i] - point[i]), 0) > 0;
}

const PIECES = 10; // a long line in 3D is drawn in pieces, each as clear as its distance allows

/** Strokes a straight world line, fading with distance in 3D. */
export function strokeWorld(ctx, view, from, to, width, color, alpha) {
  const pieces = view.depth ? PIECES : 1;
  ctx.strokeStyle = color;
  ctx.lineCap = 'butt';
  for (let i = 0; i < pieces; i++) {
    const a = from.map((v, k) => v + ((to[k] - v) * i) / pieces);
    const b = from.map((v, k) => v + ((to[k] - v) * (i + 1)) / pieces);
    const seg = segment(view, a, b);
    if (!seg || !seg[0] || !seg[1]) continue;
    const fog = Math.min(seg[0].fog, seg[1].fog);
    const opacity = alpha * view.opacity * fog;
    if (opacity <= 0.01) continue;
    ctx.globalAlpha = opacity;
    ctx.lineWidth = width * ((seg[0].s + seg[1].s) / 2);
    ctx.beginPath();
    ctx.moveTo(seg[0].x, seg[0].y);
    ctx.lineTo(seg[1].x, seg[1].y);
    ctx.stroke();
  }
}
