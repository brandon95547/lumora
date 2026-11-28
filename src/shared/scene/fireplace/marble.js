// Dark marble glass: a polished, near-black top with pale veins (a few gold), a bright bevel along
// its near edge, and whatever stands above it mirrored in the polish.
import { noise } from '../envelope.js';
import { facesCamera, fillPolygon, mirrored, strokeWorld } from '../view.js';

const VEINS = 16;
const SIDE = '#07070a';
const EDGE = '#9a98b0';

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
  const near = view.project((x0 + x1) / 2, y, z0);
  const far = view.project((x0 + x1) / 2, y, z1);
  const points = fillPolygon(ctx, view, corners, () => {
    if (!near || !far) return '#0b0a10';
    const g = ctx.createLinearGradient(near.x, near.y, far.x, far.y);
    g.addColorStop(0, '#060609');
    g.addColorStop(1, '#17151f');
    return g;
  });
  if (!points) return;
  ctx.save();
  ctx.beginPath();
  points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.clip();
  ctx.lineCap = 'round';
  for (let i = 0; i < VEINS; i++) {
    let x = x0 + (x1 - x0) * noise(seed + i, 1);
    let z = z0 + (z1 - z0) * noise(seed + i, 2);
    let a = noise(seed + i, 3) * Math.PI;
    const step = (x1 - x0) * 0.05;
    const color = i % 5 === 0 ? '#b8976a' : '#cfcadb';
    const width = 0.12 + 0.28 * noise(seed + i, 4);
    const alpha = 0.1 + 0.16 * noise(seed + i, 5);
    for (let k = 0; k < 8; k++) {
      a += (noise(seed + i, 10 + k) - 0.5) * 0.9;
      const [nx, nz] = [x + Math.cos(a) * step, z + Math.sin(a) * step];
      strokeWorld(ctx, view, [x, y, z], [nx, y, nz], width, color, alpha, 1);
      [x, z] = [nx, nz];
    }
  }
  reflect?.(mirrored(view, 'y', y, 0.32));
  ctx.restore();
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
