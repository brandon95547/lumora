// The warm room: a plank floor, a plastered wall lit by the fire, a stone chimney breast with its
// firebox, a wooden mantel and a stone hearth, a rug, and the keyboard's console. Built from flat
// faces through the camera, so it is the same room in 2D (from above) and in 3D.
import { facesCamera, fillPolygon, strokeWorld } from '../view.js';
import { KEY } from '../piano/keyboard.js';
import { BREAST, FIRE_X, FLOOR, HEARTH, MANTEL, OPENING, WALL_Z } from './layout.js';

const L = KEY.length;
const WIDE = [-320, 400]; // how far the floor and wall run either side
const CEILING = -140;
const NEAR = -120; // how far toward the camera the floor runs

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

const STONE = { top: '#3e322a', side: '#2a211b' }; // its front is lit by the fire
const WOOD = { front: '#4a2a17', top: '#6a3e22', side: '#3a2012' };
const HEARTHSTONE = { front: '#3a2f29', top: '#4e4036', side: '#30261f' };

/** Floor, wall, rug and fireplace, the fire's light warmer as `glow` (0–1) rises. */
export function drawRoom(ctx, view, keyboard, layout, glow) {
  const fire = view.project(FIRE_X, FLOOR - 10, WALL_Z - 4);
  const reach = Math.max(layout.width, layout.height) * (0.9 + 0.25 * glow);
  const lit = (warm, dark) => (fire ? washFrom(ctx, fire, reach, warm, dark) : dark);
  const [left, right] = WIDE;

  // The wall, then the floor running to it.
  fillPolygon(
    ctx,
    view,
    [
      [left, CEILING, WALL_Z],
      [right, CEILING, WALL_Z],
      [right, FLOOR, WALL_Z],
      [left, FLOOR, WALL_Z],
    ],
    lit('#5e341d', '#100805'),
  );
  fillPolygon(
    ctx,
    view,
    [
      [left, FLOOR, NEAR],
      [right, FLOOR, NEAR],
      [right, FLOOR, WALL_Z],
      [left, FLOOR, WALL_Z],
    ],
    lit('#6a3a1e', '#0e0704'),
  );
  for (let x = left; x <= right; x += 7)
    strokeWorld(ctx, view, [x, FLOOR, NEAR], [x, FLOOR, WALL_Z], 0.25, '#000000', 0.3);
  strokeWorld(ctx, view, [left, FLOOR - 4, WALL_Z - 0.3], [right, FLOOR - 4, WALL_Z - 0.3], 0.6, '#2a160c', 0.8); // baseboard

  // The rug under the keyboard, square to it.
  const rug = (inset, color) =>
    fillPolygon(
      ctx,
      keyboard,
      [
        [-9 + inset, FLOOR - 0.05, -18 + inset],
        [61 - inset, FLOOR - 0.05, -18 + inset],
        [61 - inset, FLOOR - 0.05, L + 12 - inset],
        [-9 + inset, FLOOR - 0.05, L + 12 - inset],
      ],
      color,
    );
  rug(0, '#5c1a12');
  rug(1.5, '#a0662e');
  rug(2.5, '#6e2216');

  // Hearth, chimney breast with the dark firebox, mantel.
  slab(
    ctx,
    view,
    [FIRE_X - HEARTH.half, FIRE_X + HEARTH.half],
    [FLOOR - 1.2, FLOOR],
    [HEARTH.front, BREAST.front],
    HEARTHSTONE,
  );
  slab(ctx, view, [FIRE_X - BREAST.half, FIRE_X + BREAST.half], [CEILING, FLOOR - 1.2], [BREAST.front, WALL_Z], {
    ...STONE,
    front: lit('#7a6352', '#1a1410'),
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

const CONSOLE = { front: '#24140b', top: '#3a2214', side: '#1b0f08' };

/** The keyboard's stand: a low panel behind the keys, a short apron under them, two legs and a bar. */
export function drawConsole(ctx, keyboard, model) {
  const W = model.whites;
  slab(ctx, keyboard, [-1.8, W + 1.8], [-7, 1.6], [L + 0.6, L + 2.4], CONSOLE);
  slab(ctx, keyboard, [0, W], [FLOOR - 6, FLOOR - 4.5], [L, L + 1.6], CONSOLE);
  for (const x of [-1.8, W + 0.2]) slab(ctx, keyboard, [x, x + 1.6], [1.6, FLOOR], [-0.2, L + 2.4], CONSOLE);
  slab(ctx, keyboard, [-1.8, W + 1.8], [1.6, 4], [-0.2, L + 2.4], CONSOLE);
}
