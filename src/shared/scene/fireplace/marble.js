// Dark marble glass: polished, near-black faces with pale veins (a few gold). Tops have a bright
// bevel along their near edge and mirror whatever stands above them.
import { noise } from '../envelope.js';
import { facesCamera, fillPolygon, mirrored, strokeWorld } from '../view.js';

const VEINS = 16;
const SIDE = '#07070a';
const EDGE = '#9a98b0';

/**
 * Fills a flat face of dark marble glass given by four world corners (going round it), with veins
 * running across it, then `extra()` drawn clipped to it. Returns the face's corners on screen.
 */
export function drawMarble(ctx, view, corners, seed, extra) {
  const [c0, c1, , c3] = corners;
  const at = (u, v) => [0, 1, 2].map((i) => c0[i] + (c1[i] - c0[i]) * u + (c3[i] - c0[i]) * v);
  const near = view.project(...at(0.5, 0));
  const far = view.project(...at(0.5, 1));
  const points = fillPolygon(ctx, view, corners, () => {
    if (!near || !far) return '#0b0a10';
    const g = ctx.createLinearGradient(near.x, near.y, far.x, far.y);
    g.addColorStop(0, '#060609');
    g.addColorStop(1, '#17151f');
    return g;
  });
  if (!points) return null;
  ctx.save();
  ctx.beginPath();
  points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.clip();
  ctx.lineCap = 'round';
  const across = Math.hypot(...[0, 1, 2].map((i) => c1[i] - c0[i]));
  const down = Math.hypot(...[0, 1, 2].map((i) => c3[i] - c0[i]));
  for (let i = 0; i < VEINS; i++) {
    let u = noise(seed + i, 1);
    let v = noise(seed + i, 2);
    let a = noise(seed + i, 3) * Math.PI;
    const color = i % 5 === 0 ? '#b8976a' : '#cfcadb';
    const width = 0.12 + 0.28 * noise(seed + i, 4);
    const alpha = 0.1 + 0.16 * noise(seed + i, 5);
    for (let k = 0; k < 8; k++) {
      a += (noise(seed + i, 10 + k) - 0.5) * 0.9;
      const [nu, nv] = [u + Math.cos(a) * 0.05, v + (Math.sin(a) * 0.05 * across) / down];
      strokeWorld(ctx, view, at(u, v), at(nu, nv), width, color, alpha, 1);
      [u, v] = [nu, nv];
    }
  }
  extra?.();
  ctx.restore();
  return points;
}

/**
 * A marble top at height y over x [x0, x1] and z [z0, z1]. `reflect(view)` draws what shows in the
 * polish, through a mirrored view; it is clipped to the top.
 */
export function drawMarbleTop(ctx, view, [x0, x1], y, [z0, z1], seed, reflect) {
  const corners = [
    [x0, y, z0],
    [x1, y, z0],
    [x1, y, z1],
    [x0, y, z1],
  ];
  if (!drawMarble(ctx, view, corners, seed, () => reflect?.(mirrored(view, 'y', y, 0.32)))) return;
  // The polished near edge catches the light.
  strokeWorld(ctx, view, [x0, y, z0], [x1, y, z0], 0.3, EDGE, 0.55);
}

/** A marble block's near and side faces, below a top drawn with drawMarbleTop. */
export function drawMarbleSides(ctx, view, [x0, x1], [top, bottom], [z0, z1]) {
  if (facesCamera(view, [0, 0, -1], [(x0 + x1) / 2, top, z0]))
    fillPolygon(
      ctx,
      view,
      [
        [x0, top, z0],
        [x1, top, z0],
        [x1, bottom, z0],
        [x0, bottom, z0],
      ],
      SIDE,
      1,
      true,
    );
  const side = view.eye && view.eye[0] < x0 ? x0 : view.eye && view.eye[0] > x1 ? x1 : null;
  if (side !== null) {
    fillPolygon(
      ctx,
      view,
      [
        [side, top, z0],
        [side, top, z1],
        [side, bottom, z1],
        [side, bottom, z0],
      ],
      SIDE,
      1,
      true,
    );
  }
}
