// The stage and the fireplace, standing in space, all in dark marble glass: a floor, a dais with the
// fireplace on it (a surround with its dark firebox trimmed in gold, a short chimney and a mantel), and
// the keyboard's stand. Built from flat faces through the camera, so it is the same in 2D (from above)
// and in 3D.
import { facesCamera, fillPolygon, strokeWorld } from '../view.js';
import { KEY } from '../piano/keyboard.js';
import { BREAST, DAIS_SPAN, FIRE_X, FLOOR, HEARTH_Y, MANTEL, OPENING, STAGE, WALL_Z } from './layout.js';
import { drawMarble, drawMarbleSides, drawMarbleTop } from './marble.js';

const L = KEY.length;
const TOP = HEARTH_Y - 69; // the stone surround's top
const CHIMNEY = { half: 12, top: HEARTH_Y - 103 };
const THICK = 4; // the stage floor's thickness

const center = (corners) => [0, 1, 2].map((i) => corners.reduce((s, c) => s + c[i], 0) / corners.length);

function face(ctx, view, corners, normal, fill) {
  if (!facesCamera(view, normal, center(corners))) return null;
  return fillPolygon(ctx, view, corners, fill, 1, true);
}

/** A box's faces that turn toward the camera: x, y and z are [from, to]. */
export function slab(ctx, view, [x0, x1], [y0, y1], [z0, z1], { front, top, side, back = side }) {
  face(
    ctx,
    view,
    [
      [x0, y0, z1],
      [x1, y0, z1],
      [x1, y0, z0],
      [x0, y0, z0],
    ],
    [0, -1, 0],
    top,
  );
  face(
    ctx,
    view,
    [
      [x0, y0, z0],
      [x1, y0, z0],
      [x1, y1, z0],
      [x0, y1, z0],
    ],
    [0, 0, -1],
    front,
  );
  face(
    ctx,
    view,
    [
      [x1, y0, z1],
      [x0, y0, z1],
      [x0, y1, z1],
      [x1, y1, z1],
    ],
    [0, 0, 1],
    back,
  );
  face(
    ctx,
    view,
    [
      [x0, y0, z1],
      [x0, y0, z0],
      [x0, y1, z0],
      [x0, y1, z1],
    ],
    [-1, 0, 0],
    side,
  );
  face(
    ctx,
    view,
    [
      [x1, y0, z0],
      [x1, y0, z1],
      [x1, y1, z1],
      [x1, y1, z0],
    ],
    [1, 0, 0],
    side,
  );
}

const DARK = { top: '#15131b', side: '#0b0a0f', back: '#09080c' }; // marble seen edge-on
const MANTEL_MARBLE = { front: '#14121a', top: '#26222e', side: '#0e0d12' };
const GOLD = '#b8976a';

/** The fire's warm light caught in a polished face, around screen point `fire`. */
function sheen(ctx, fire, reach, glow) {
  if (!fire) return;
  const g = ctx.createRadialGradient(fire.x, fire.y, 0, fire.x, fire.y, reach);
  g.addColorStop(0, `rgba(255, 140, 60, ${0.3 * glow})`);
  g.addColorStop(0.5, `rgba(255, 110, 40, ${0.07 * glow})`);
  g.addColorStop(1, 'rgba(255, 110, 40, 0)');
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 1;
  ctx.fillStyle = g;
  ctx.fillRect(fire.x - reach, fire.y - reach, 2 * reach, 2 * reach);
  ctx.globalCompositeOperation = 'source-over';
}

/** The marble stage and dais. `reflect(mirror, y)` draws what shows in a top at height y. */
export function drawStage(ctx, view, reflect) {
  drawMarbleTop(ctx, view, STAGE.x, FLOOR, STAGE.z, 3, (mirror) => reflect(mirror, FLOOR));
  drawMarbleSides(ctx, view, STAGE.x, [FLOOR, FLOOR + THICK], STAGE.z);
  drawMarbleTop(ctx, view, DAIS_SPAN.x, HEARTH_Y, DAIS_SPAN.z, 41, (mirror) => reflect(mirror, HEARTH_Y));
  drawMarbleSides(ctx, view, DAIS_SPAN.x, [HEARTH_Y, FLOOR], DAIS_SPAN.z);
}

/** The fireplace on the dais, in dark marble glass that catches the fire's light as `glow` (0–1) rises. */
export function drawFireplace(ctx, view, glow) {
  const fire = view.project(FIRE_X, HEARTH_Y - 10, WALL_Z - 4);
  const reach = fire ? BREAST.half * fire.s * (1.1 + 0.3 * glow) : 0; // the glow spreads over the surround, not the frame
  const [left, right] = [FIRE_X - BREAST.half, FIRE_X + BREAST.half];

  slab(
    ctx,
    view,
    [FIRE_X - CHIMNEY.half, FIRE_X + CHIMNEY.half],
    [CHIMNEY.top, TOP],
    [BREAST.front + 2, WALL_Z - 1],
    DARK,
  );
  drawMarble(
    ctx,
    view,
    [
      [FIRE_X - CHIMNEY.half, CHIMNEY.top, BREAST.front + 2],
      [FIRE_X + CHIMNEY.half, CHIMNEY.top, BREAST.front + 2],
      [FIRE_X + CHIMNEY.half, TOP, BREAST.front + 2],
      [FIRE_X - CHIMNEY.half, TOP, BREAST.front + 2],
    ],
    71,
  );
  slab(ctx, view, [left, right], [TOP, HEARTH_Y], [BREAST.front, WALL_Z], DARK);
  drawMarble(
    ctx,
    view,
    [
      [left, TOP, BREAST.front],
      [right, TOP, BREAST.front],
      [right, HEARTH_Y, BREAST.front],
      [left, HEARTH_Y, BREAST.front],
    ],
    57,
    () => sheen(ctx, fire, reach, glow),
  );
  const opening = fillPolygon(
    ctx,
    view,
    [
      [FIRE_X - OPENING.half, OPENING.top, BREAST.front - 0.05],
      [FIRE_X + OPENING.half, OPENING.top, BREAST.front - 0.05],
      [FIRE_X + OPENING.half, HEARTH_Y, BREAST.front - 0.05],
      [FIRE_X - OPENING.half, HEARTH_Y, BREAST.front - 0.05],
    ],
    '#0c0503',
  );
  // A thin gold trim around the firebox.
  const z = BREAST.front - 0.1;
  const [ox0, ox1] = [FIRE_X - OPENING.half, FIRE_X + OPENING.half];
  for (const [a, b] of [
    [
      [ox0, HEARTH_Y, z],
      [ox0, OPENING.top, z],
    ],
    [
      [ox0, OPENING.top, z],
      [ox1, OPENING.top, z],
    ],
    [
      [ox1, OPENING.top, z],
      [ox1, HEARTH_Y, z],
    ],
  ]) {
    strokeWorld(ctx, view, a, b, 0.5, GOLD, 0.8, 4);
  }
  slab(
    ctx,
    view,
    [FIRE_X - MANTEL.half, FIRE_X + MANTEL.half],
    [MANTEL.top, MANTEL.bottom],
    [MANTEL.front, BREAST.front],
    MANTEL_MARBLE,
  );
  strokeWorld(
    ctx,
    view,
    [FIRE_X - MANTEL.half, MANTEL.top, MANTEL.front],
    [FIRE_X + MANTEL.half, MANTEL.top, MANTEL.front],
    0.35,
    GOLD,
    0.7,
  );
  return opening; // the firebox's corners on screen, for the fire to burn inside
}

const BODY = { front: '#121216', top: '#1c1c22', side: '#0c0c0f' };
const METAL = '#5a5a66';

/**
 * The keyboard's own slim body under and behind the keys, on an X stand: two crossed legs at each
 * end, joined by a bar. Nothing stands above the keys, so the fire shows past it.
 */
export function drawStand(ctx, keyboard, model) {
  const W = model.whites;
  const [front, back] = [0.4, L + 1.6];
  ctx.lineCap = 'round';
  for (const x of [5, W - 5]) {
    strokeWorld(ctx, keyboard, [x, 3.2, front], [x, FLOOR, back], 0.9, METAL, 1, 4);
    strokeWorld(ctx, keyboard, [x, 3.2, back], [x, FLOOR, front], 0.9, METAL, 1, 4);
    strokeWorld(ctx, keyboard, [x - 0.6, 3.2, front - 0.5], [x - 0.6, 3.2, back + 0.5], 0.7, METAL, 1, 2);
  }
  const middle = (3.2 + FLOOR) / 2;
  strokeWorld(ctx, keyboard, [5, middle, (front + back) / 2], [W - 5, middle, (front + back) / 2], 0.7, METAL, 1, 6);
  slab(ctx, keyboard, [-1.8, W + 1.8], [-0.6, 3.2], [L + 0.4, L + 2.2], BODY);
  slab(ctx, keyboard, [-1.8, W + 1.8], [1.6, 3.2], [-0.4, L + 0.4], BODY);
}
