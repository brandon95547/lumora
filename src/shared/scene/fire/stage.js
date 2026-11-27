// Where the fireball runs: stone ledges floating in the dark that glow like coals once struck,
// a sky that warms from below as the fire grows, and the camera that follows the ball.
import { aim, facesCamera, fillPolygon, perspective } from '../view.js';
import { mixColors, withAlpha } from '../sprites.js';
import { followAt } from './path.js';

const STONE = [34, 29, 28]; // dark basalt
const THICK = 1.1;
export const BALL = 1; // the fireball's radius, in world units

/** How hot a ledge still is at t: 0 before it's struck, a flash, then slowly cooling coals. */
export function warmthOf(landing, t) {
  if (t < landing.time) return 0;
  const age = t - landing.time;
  return Math.min(1, 0.3 * Math.exp(-age / 7) + 0.7 * Math.exp(-age * 1.6));
}

const LIGHT = [0.3, -1, -0.5].map((c, _, v) => c / Math.hypot(...v));

function shade(base, normal, glow, ember) {
  const d = Math.max(0, normal[0] * LIGHT[0] + normal[1] * LIGHT[1] + normal[2] * LIGHT[2]);
  const stone = `rgb(${base.map((c) => Math.round(c * (0.55 + 0.8 * d))).join(', ')})`;
  return glow > 0.02 ? mixColorsCss(stone, ember, glow) : stone;
}

/** Mixes an rgb() stone color toward a '#rrggbb' ember color. */
function mixColorsCss(rgb, hex, k) {
  const [r, g, b] = rgb.match(/\d+/g).map(Number);
  const toHex = (v) => v.toString(16).padStart(2, '0');
  return mixColors(`#${toHex(r)}${toHex(g)}${toHex(b)}`, hex, Math.min(1, k));
}

/** A ledge as a slab whose top the ball lands on; the top and edges glow as coals while it's hot. */
export function drawLedge(ctx, view, landing, warmth, alpha, ramp) {
  const half = landing.size / 2;
  const [x0, x1] = [landing.x - half, landing.x + half];
  const [z0, z1] = [landing.z - half * 0.85, landing.z + half * 0.85];
  const top = landing.y + BALL;
  const bottom = top + THICK;
  const ember = ramp[5]; // stone heats to a deep red; the bright glow is added on top
  const faces = [
    {
      c: [
        [x0, top, z0],
        [x1, top, z0],
        [x1, top, z1],
        [x0, top, z1],
      ],
      n: [0, -1, 0],
      g: warmth,
    },
    {
      c: [
        [x1, top, z0],
        [x0, top, z0],
        [x0, bottom, z0],
        [x1, bottom, z0],
      ],
      n: [0, 0, -1],
      g: warmth * 0.55,
    },
    {
      c: [
        [x0, top, z1],
        [x1, top, z1],
        [x1, bottom, z1],
        [x0, bottom, z1],
      ],
      n: [0, 0, 1],
      g: warmth * 0.55,
    },
    {
      c: [
        [x0, top, z0],
        [x0, top, z1],
        [x0, bottom, z1],
        [x0, bottom, z0],
      ],
      n: [-1, 0, 0],
      g: warmth * 0.55,
    },
    {
      c: [
        [x1, top, z1],
        [x1, top, z0],
        [x1, bottom, z0],
        [x1, bottom, z1],
      ],
      n: [1, 0, 0],
      g: warmth * 0.55,
    },
    {
      c: [
        [x0, bottom, z0],
        [x0, bottom, z1],
        [x1, bottom, z1],
        [x1, bottom, z0],
      ],
      n: [0, 1, 0],
      g: 0,
    },
  ];
  for (const f of faces) {
    const at = f.c[0];
    if (!facesCamera(view, f.n, at)) continue;
    fillPolygon(ctx, view, f.c, shade(STONE, f.n, f.g, ember), alpha, true);
  }
  // The rim of the top glows like a seam of lava while the ledge is hot; a faint cool edge otherwise.
  const rim = faces[0].c.map((c) => view.project(...c));
  if (rim.some((p) => !p)) return;
  ctx.globalAlpha = alpha * Math.min(...rim.map((p) => p.fog)) * (warmth > 0.02 ? 0.35 + 0.65 * warmth : 0.18);
  ctx.strokeStyle = warmth > 0.02 ? ramp[2] : 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = Math.max(1, 0.12 * rim[0].s);
  ctx.lineJoin = 'round';
  ctx.beginPath();
  rim.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.stroke();
}

/** The sky: the palette's dark, warming from below as the fire grows. */
export function drawHeat(ctx, layout, heat, ramp) {
  const g = ctx.createLinearGradient(0, layout.height, 0, layout.height * 0.25);
  g.addColorStop(0, withAlpha(ramp[4], 0.12 + 0.4 * heat));
  g.addColorStop(0.5, withAlpha(ramp[5], 0.06 + 0.18 * heat));
  g.addColorStop(1, withAlpha(ramp[5], 0));
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 1;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, layout.width, layout.height);
  ctx.globalCompositeOperation = 'source-over';
}

const DEG = Math.PI / 180;

/**
 * The camera following the fireballs (between them, when there are two). 2D is a side-on shot (a far, flat camera); 3D looks from the
 * chosen angle. The ball sits a little left of center so more of the run ahead is in view.
 */
export function fireView(scene, runs, camera, t) {
  const { layout } = scene;
  const pivot = followAt(runs, t);
  const scale = layout.portrait ? 58 : 50; // pixels per world unit at the pivot, at Distance 1
  const anchor = [layout.width * (layout.portrait ? 0.45 : 0.4), layout.height * 0.55];
  if (!camera) {
    // `flat` marks the side-on 2D shot, for pieces that are placed differently in it.
    return {
      flat: true,
      ...perspective({ pivot, anchor, distance: 4000, zoom: scale, yaw: 0, pitch: 0, fogFrom: 50, fogTo: 60 }),
    };
  }
  const { yaw, pitch } = aim(camera, t);
  const turned = Math.min(1, Math.abs(yaw) / (60 * DEG));
  return perspective({
    pivot,
    anchor: [anchor[0] + (layout.width / 2 - anchor[0]) * turned, anchor[1]],
    distance: 34,
    zoom: scale * camera.zoom,
    yaw,
    pitch,
    fogFrom: 1.6,
    fogTo: 3.6,
  });
}
