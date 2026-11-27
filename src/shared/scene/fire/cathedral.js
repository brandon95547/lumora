// The cathedral the Gothic fire runs through: a stone floor, two rows of columns joined by pointed
// arches, vault ribs overhead, candles along the aisles, and a rose window at the far end. All of
// it is cold stone under moonlight, lit warm (teal on one side, crimson on the other) only where
// the fire is near. Built in the run's world: x down the nave, z across it (+z on the left), y down.
import { facesCamera, fillPolygon, strokeWorld } from '../view.js';
import { glowSprite } from '../sprites.js';

export const FLOOR = 7;
const BAY = 9; // column spacing down the nave
const COLUMN_Z = 13;
const SPRING = -24; // where the arches spring from the columns
const CANDLE_Z = 11.6;
const CANDLE_STEP = 4.5;
const STONE = [40, 42, 52]; // dark, cold grey-blue
const MOON = [10, 14, 30]; // what moonlight adds to faces turned up

// ---------- Light ----------

/** A stone color at a point: dim moonlight, plus each fire's light falling off with distance. */
export function litStone(base, normal, point, lights) {
  const up = Math.max(0, -normal[1]);
  const c = base.map((v, i) => v * 0.55 + MOON[i] * up);
  for (const { pos, rgb, strength } of lights) {
    const d = Math.hypot(pos[0] - point[0], pos[1] - point[1], pos[2] - point[2]);
    const toward = [(pos[0] - point[0]) / (d || 1), (pos[1] - point[1]) / (d || 1), (pos[2] - point[2]) / (d || 1)];
    const facing = Math.max(0.15, normal[0] * toward[0] + normal[1] * toward[1] + normal[2] * toward[2]);
    const k = strength * facing * Math.exp(-d / 11);
    for (let i = 0; i < 3; i++) c[i] += rgb[i] * k * 0.55;
  }
  return `rgb(${c.map((v) => Math.min(255, Math.round(v))).join(', ')})`;
}

// ---------- Pieces, each { depth, draw } for painting far to near ----------

function boxItems(ctx, view, [x0, x1], [top, bottom], [z0, z1], base, lights) {
  const faces = [
    {
      c: [
        [x0, top, z0],
        [x1, top, z0],
        [x1, top, z1],
        [x0, top, z1],
      ],
      n: [0, -1, 0],
    },
    {
      c: [
        [x1, top, z0],
        [x0, top, z0],
        [x0, bottom, z0],
        [x1, bottom, z0],
      ],
      n: [0, 0, -1],
    },
    {
      c: [
        [x0, top, z1],
        [x1, top, z1],
        [x1, bottom, z1],
        [x0, bottom, z1],
      ],
      n: [0, 0, 1],
    },
    {
      c: [
        [x0, top, z0],
        [x0, top, z1],
        [x0, bottom, z1],
        [x0, bottom, z0],
      ],
      n: [-1, 0, 0],
    },
    {
      c: [
        [x1, top, z1],
        [x1, top, z0],
        [x1, bottom, z0],
        [x1, bottom, z1],
      ],
      n: [1, 0, 0],
    },
  ];
  const items = [];
  for (const f of faces) {
    const mid = [0, 1, 2].map((i) => f.c.reduce((s, c) => s + c[i], 0) / 4);
    if (!facesCamera(view, f.n, mid)) continue;
    const item = {
      depth: view.depthOf(...mid),
      alpha: 1,
      draw: () => fillPolygon(ctx, view, f.c, litStone(base, f.n, mid, lights), item.alpha, true),
    };
    items.push(item);
  }
  return items;
}

/** A pointed (equilateral) arch from a to b, springing at height `y`, as world points. */
function archPoints(a, b, y, steps = 10, flatten = 1) {
  const span = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const pts = [];
  const at = (k, from, to) => from + (to - from) * k;
  for (let i = 0; i <= steps; i++) {
    const phi = (i / steps) * (Math.PI / 3);
    // Left half: circle centered on b; right half mirrors it.
    const u = 1 - Math.cos(phi); // 0 → 0.5 along the span
    pts.push([at(u, a[0], b[0]), y - span * Math.sin(phi) * flatten, at(u, a[1], b[1])]);
  }
  for (let i = steps - 1; i >= 0; i--) {
    const phi = (i / steps) * (Math.PI / 3);
    const u = Math.cos(phi); // 0.5 → 1
    pts.push([at(u, a[0], b[0]), y - span * Math.sin(phi) * flatten, at(u, a[1], b[1])]);
  }
  return pts;
}

/** An arch or rib as one stroked path, as clear as its middle is near. */
function ribItem(ctx, view, points, width, lights) {
  const mid = points[points.length >> 1];
  return {
    depth: view.depthOf(...mid),
    draw: () => {
      const projected = points.map((p) => view.project(...p));
      const m = projected[projected.length >> 1];
      if (!m || projected.some((p) => !p) || m.fog <= 0.01) return;
      ctx.globalAlpha = m.fog;
      ctx.strokeStyle = litStone(STONE, [0, 1, 0], mid, lights);
      ctx.lineWidth = width * m.s;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      projected.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
    },
  };
}

/** Everything solid in the nave between `from` and `to` along it, ready to sort with the pedestals. */
export function naveItems(ctx, view, from, to, lights) {
  const items = [];
  const first = Math.floor(from / BAY) * BAY;
  for (let x = first; x <= to; x += BAY) {
    for (const side of [1, -1]) {
      const z = side * COLUMN_Z;
      items.push(...boxItems(ctx, view, [x - 1.1, x + 1.1], [SPRING, FLOOR], [z - 1.1, z + 1.1], STONE, lights));
      items.push(...boxItems(ctx, view, [x - 1.7, x + 1.7], [FLOOR - 1.1, FLOOR], [z - 1.7, z + 1.7], STONE, lights));
      items.push(...boxItems(ctx, view, [x - 1.6, x + 1.6], [SPRING - 1, SPRING], [z - 1.6, z + 1.6], STONE, lights));
      // The arcade arch to the next column along this side.
      items.push(ribItem(ctx, view, archPoints([x, z], [x + BAY, z], SPRING), 1.1, lights));
    }
    // A vault rib across the nave, from column to column.
    items.push(ribItem(ctx, view, archPoints([x, COLUMN_Z], [x, -COLUMN_Z], SPRING - 1, 14, 0.55), 0.8, lights));
  }
  return items;
}

/** The stone floor and its joints, fading into the dark down the nave. */
export function drawNaveFloor(ctx, view, from, to, lights) {
  const corners = [
    [from, FLOOR, COLUMN_Z + 2],
    [to, FLOOR, COLUMN_Z + 2],
    [to, FLOOR, -COLUMN_Z - 2],
    [from, FLOOR, -COLUMN_Z - 2],
  ];
  fillPolygon(ctx, view, corners, litStone([20, 20, 26], [0, -1, 0], [(from + to) / 2, FLOOR, 0], lights));
  const joint = 'rgba(0, 0, 0, 0.45)';
  for (let z = -COLUMN_Z; z <= COLUMN_Z; z += 3.25)
    strokeWorld(ctx, view, [from, FLOOR, z], [to, FLOOR, z], 0.08, joint, 1);
  for (let x = Math.ceil(from / 3.25) * 3.25; x <= to; x += 3.25)
    strokeWorld(ctx, view, [x, FLOOR, -COLUMN_Z], [x, FLOOR, COLUMN_Z], 0.08, joint, 1, 1);
}

/** Candles on iron stands along both aisles. Those the fire has passed are lit. */
export function candleItems(ctx, view, from, to, lights) {
  const items = [];
  for (let x = Math.ceil(from / CANDLE_STEP) * CANDLE_STEP; x <= to; x += CANDLE_STEP) {
    for (const side of [1, -1]) {
      const z = side * CANDLE_Z;
      items.push({
        depth: view.depthOf(x, FLOOR - 3, z),
        draw: () => strokeWorld(ctx, view, [x, FLOOR, z], [x, FLOOR - 4, z], 0.18, '#121216', 1, 1),
      });
      items.push(
        ...boxItems(
          ctx,
          view,
          [x - 0.2, x + 0.2],
          [FLOOR - 5.3, FLOOR - 4],
          [z - 0.2, z + 0.2],
          [200, 190, 165],
          lights,
        ),
      );
    }
  }
  return items;
}

/** The candle flames: lit one by one as the fire passes them, then flickering on. */
export function drawCandleFlames(ctx, view, from, to, lead, t) {
  for (let x = Math.ceil(from / CANDLE_STEP) * CANDLE_STEP; x <= to; x += CANDLE_STEP) {
    const lit = Math.max(0, Math.min(1, (lead - x) / 3));
    if (lit <= 0) continue;
    for (const side of [1, -1]) {
      const p = view.project(x, FLOOR - 5.8, side * CANDLE_Z);
      if (!p) continue;
      const flicker = 0.85 + 0.15 * Math.sin(t * 13 + x * 1.7 + side);
      const size = 2.2 * p.s * flicker;
      ctx.globalAlpha = lit * p.fog * 0.9;
      ctx.drawImage(glowSprite('#ffb54a'), p.x - size / 2, p.y - size / 2, size, size);
      ctx.globalAlpha = lit * p.fog;
      ctx.drawImage(glowSprite('#fff2c8'), p.x - size / 5, p.y - size / 5, size / 2.5, size / 2.5);
    }
  }
}

const GLASS = ['#b3122e', '#1fb5b8', '#d9a23a', '#6b3fb5'];

/**
 * The rose window at the far end of the nave (or high in the background, side-on): stained glass
 * in twelve petals around a golden heart, glowing brighter as the fire grows and flaring with lightning.
 */
export function drawRoseWindow(ctx, center, radius, glow) {
  const [cx, cy] = center;
  ctx.save();
  // Light pouring through.
  ctx.globalCompositeOperation = 'lighter';
  const halo = ctx.createRadialGradient(cx, cy, radius * 0.4, cx, cy, radius * 2.6);
  halo.addColorStop(0, `rgba(180, 60, 90, ${0.18 * glow})`);
  halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(cx - radius * 3, cy - radius * 3, radius * 6, radius * 6);
  ctx.globalCompositeOperation = 'source-over';
  // The stone ring.
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#16161c';
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 1.08, 0, Math.PI * 2);
  ctx.fill();
  // Glass petals.
  const petals = 12;
  for (let k = 0; k < petals; k++) {
    const a0 = (k / petals) * Math.PI * 2 + 0.04;
    const a1 = ((k + 1) / petals) * Math.PI * 2 - 0.04;
    ctx.globalAlpha = 0.18 + 0.6 * glow;
    ctx.fillStyle = GLASS[k % GLASS.length];
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.95, a0, a1);
    ctx.arc(cx, cy, radius * 0.36, a1, a0, true);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 0.25 + 0.6 * glow;
  ctx.fillStyle = '#e0b04a';
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Stone tracery.
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#121217';
  ctx.lineWidth = Math.max(2, radius * 0.05);
  for (const r of [0.36, 0.66, 0.95]) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius * r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  for (let k = 0; k < petals; k++) {
    const a = (k / petals) * Math.PI * 2;
    ctx.moveTo(cx + Math.cos(a) * radius * 0.3, cy + Math.sin(a) * radius * 0.3);
    ctx.lineTo(cx + Math.cos(a) * radius * 0.95, cy + Math.sin(a) * radius * 0.95);
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * A landing in the nave: a stone pedestal rising from the floor, its top carved with a quatrefoil
 * that runs with lava once the fire has struck it.
 */
export function pedestalItems(ctx, view, landing, warmth, alpha, ramp, lights) {
  const half = landing.size / 2;
  const top = landing.y + 1; // the fireball rests on it
  const x = [landing.x - half * 0.8, landing.x + half * 0.8];
  const z = [landing.z - half * 0.8, landing.z + half * 0.8];
  const items = [
    ...boxItems(ctx, view, x, [top + 0.6, FLOOR], z, STONE, lights),
    ...boxItems(
      ctx,
      view,
      [landing.x - half, landing.x + half],
      [top, top + 0.6],
      [landing.z - half, landing.z + half],
      STONE,
      lights,
    ),
  ];
  if (alpha < 1) for (const item of items) item.alpha = alpha;
  // The carving, drawn with its top so nearer stone covers it.
  const carving = {
    depth: view.depthOf(landing.x, top, landing.z) - 0.01,
    draw: () => {
      const r = landing.size * 0.36;
      const points = [];
      for (let i = 0; i <= 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        const lobe = r * (0.6 + 0.4 * Math.abs(Math.cos(2 * a)));
        points.push(view.project(landing.x + Math.cos(a) * lobe, top - 0.01, landing.z + Math.sin(a) * lobe));
      }
      if (points.some((p) => !p)) return;
      ctx.globalAlpha = alpha * points[0].fog * (warmth > 0.03 ? 0.5 + 0.5 * warmth : 0.5);
      ctx.strokeStyle = warmth > 0.03 ? ramp[1] : 'rgba(0, 0, 0, 0.6)';
      ctx.lineWidth = Math.max(1, 0.14 * points[0].s);
      ctx.beginPath();
      points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
    },
  };
  return [...items, carving];
}
