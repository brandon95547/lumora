// The fireplace, standing on its own in space: a stone hearth, a stone surround with its dark firebox
// and a short chimney, and a wooden mantel; and the keyboard's stand. Built from flat faces through
// the camera, so it is the same in 2D (from above) and in 3D.
import { facesCamera, fillPolygon, strokeWorld } from '../view.js';
import { KEY } from '../piano/keyboard.js';
import { BREAST, FIRE_X, FLOOR, HEARTH, MANTEL, OPENING, WALL_Z } from './layout.js';

const L = KEY.length;
const TOP = -38; // the stone surround's top
const CHIMNEY = { half: 12, top: -72 };

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

/** A radial wash lit from screen point `glowAt`, from `warm` there to `dark` far off. */
const washFrom = (ctx, glowAt, reach, warm, dark) => () => {
  const g = ctx.createRadialGradient(glowAt.x, glowAt.y, 0, glowAt.x, glowAt.y, reach);
  g.addColorStop(0, warm);
  g.addColorStop(1, dark);
  return g;
};

const STONE = { top: '#3e322a', side: '#2a211b', back: '#1f1914' }; // its front is lit by the fire
const WOOD = { front: '#4a2a17', top: '#6a3e22', side: '#3a2012' };
const HEARTHSTONE = { front: '#3a2f29', top: '#4e4036', side: '#30261f' };

/** The fireplace, its stone warmer as `glow` (0–1) rises. Returns the firebox opening on screen. */
export function drawFireplace(ctx, view, layout, glow) {
  const fire = view.project(FIRE_X, FLOOR - 10, WALL_Z - 4);
  const reach = Math.max(layout.width, layout.height) * (0.5 + 0.2 * glow);
  const lit = (warm, dark) => (fire ? washFrom(ctx, fire, reach, warm, dark) : dark);

  slab(
    ctx,
    view,
    [FIRE_X - HEARTH.half, FIRE_X + HEARTH.half],
    [FLOOR - 1.2, FLOOR + 2],
    [HEARTH.front, WALL_Z + 2],
    HEARTHSTONE,
  );
  slab(
    ctx,
    view,
    [FIRE_X - CHIMNEY.half, FIRE_X + CHIMNEY.half],
    [CHIMNEY.top, TOP],
    [BREAST.front + 2, WALL_Z - 1],
    STONE,
  );
  slab(ctx, view, [FIRE_X - BREAST.half, FIRE_X + BREAST.half], [TOP, FLOOR - 1.2], [BREAST.front, WALL_Z], {
    ...STONE,
    front: lit('#6e5848', '#221a15'),
  });
  const opening = fillPolygon(
    ctx,
    view,
    [
      [FIRE_X - OPENING.half, OPENING.top, BREAST.front - 0.05],
      [FIRE_X + OPENING.half, OPENING.top, BREAST.front - 0.05],
      [FIRE_X + OPENING.half, FLOOR - 1.2, BREAST.front - 0.05],
      [FIRE_X - OPENING.half, FLOOR - 1.2, BREAST.front - 0.05],
    ],
    '#0c0503',
  );
  slab(
    ctx,
    view,
    [FIRE_X - MANTEL.half, FIRE_X + MANTEL.half],
    [MANTEL.top, MANTEL.bottom],
    [MANTEL.front, BREAST.front],
    WOOD,
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
