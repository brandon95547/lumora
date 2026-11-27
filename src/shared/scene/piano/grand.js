// The grand piano around the keys: its case (the long straight bass side, the curved bentside and
// the rounded tail), the lid propped open, the gold plate and strings inside, the music desk, three
// legs and the pedal lyre, standing in a pool of light. Built once as flat faces in world units of
// one white key (about 23.5 mm), then each frame sorted far to near and painted, so nearer parts
// cover farther ones. Lacquer is lit from above with a highlight that moves with the camera.
import { facesCamera, fillPolygon } from '../view.js';
import { KEY } from './keyboard.js';

const L = KEY.length;
const DEG = Math.PI / 180;

export const CASE = {
  left: -1.8,
  right: 53.8,
  front: -0.65,
  rimTop: -4.5, // the rim's top edge, above the key tops (0)
  rimBottom: 6,
  floor: 31, // key tops stand about 73 cm off the floor
  wall: 1.1, // rim thickness
  inside: L + 0.6, // where the inside of the case begins, just behind the fallboard
  plateY: 0.6,
  lidAngle: 32 * DEG,
  lidFront: L + 6.5,
};
CASE.width = CASE.right - CASE.left;
CASE.centerX = (CASE.left + CASE.right) / 2;
CASE.centerZ = 36;

// ---------- Shape ----------

function bezier([x0, z0], [x1, z1], [x2, z2], [x3, z3], steps) {
  const out = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    out.push([
      u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
      u * u * u * z0 + 3 * u * u * t * z1 + 3 * u * t * t * z2 + t * t * t * z3,
    ]);
  }
  return out;
}

function line([x0, z0], [x1, z1], steps) {
  return Array.from({ length: steps }, (_, i) => [
    x0 + ((x1 - x0) * (i + 1)) / steps,
    z0 + ((z1 - z0) * (i + 1)) / steps,
  ]);
}

/**
 * The case seen from above, as [x, z] points: from the front-right corner back along the treble
 * side, round the bentside and tail, and forward along the bass side to the front-left corner.
 * The front (the keyboard) is open.
 */
function outline() {
  const { left, right, front } = CASE;
  const start = [right, front];
  const trebleEnd = [right, 24];
  const bentEnd = [21, 72];
  const tailEnd = [left, 76];
  return [
    start,
    ...line(start, trebleEnd, 4),
    ...bezier(trebleEnd, [right, 44], [30, 50], bentEnd, 16),
    ...bezier(bentEnd, [14, 90], [left, 92], tailEnd, 12),
    ...line(tailEnd, [left, front], 10),
  ];
}

/** Outward normals ([nx, nz]) at each point, averaged from the edges either side. */
function normalsOf(points) {
  const edge = (a, b) => {
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const len = Math.hypot(dx, dz) || 1;
    return [dz / len, -dx / len]; // the points run counterclockwise seen from above, so this points out
  };
  return points.map((p, i) => {
    const a = i > 0 ? edge(points[i - 1], p) : edge(p, points[i + 1]);
    const b = i < points.length - 1 ? edge(p, points[i + 1]) : a;
    const len = Math.hypot(a[0] + b[0], a[1] + b[1]) || 1;
    return [(a[0] + b[0]) / len, (a[1] + b[1]) / len];
  });
}

/** The furthest-back z the inside reaches at x (where the strings end). */
function backAt(polygon, x) {
  let best = -Infinity;
  for (let i = 0; i < polygon.length; i++) {
    const [x0, z0] = polygon[i];
    const [x1, z1] = polygon[(i + 1) % polygon.length];
    if ((x0 - x) * (x1 - x) > 0 || x0 === x1) continue;
    best = Math.max(best, z0 + ((z1 - z0) * (x - x0)) / (x1 - x0));
  }
  return best;
}

/** Turns a point on the lid (lying closed on the rim) up about the hinge on the bass side. */
function lift([x, z]) {
  const dx = x - CASE.left;
  return [CASE.left + dx * Math.cos(CASE.lidAngle), CASE.rimTop - dx * Math.sin(CASE.lidAngle), z];
}

/** A box's faces (top, front, back, sides; no bottom unless asked), each with its outward normal. */
function boxFaces([x0, x1], [top, bottom], [z0, z1], color, withBottom = false) {
  const faces = [
    {
      corners: [
        [x0, top, z0],
        [x1, top, z0],
        [x1, top, z1],
        [x0, top, z1],
      ],
      normal: [0, -1, 0],
    },
    {
      corners: [
        [x1, top, z0],
        [x0, top, z0],
        [x0, bottom, z0],
        [x1, bottom, z0],
      ],
      normal: [0, 0, -1],
    },
    {
      corners: [
        [x0, top, z1],
        [x1, top, z1],
        [x1, bottom, z1],
        [x0, bottom, z1],
      ],
      normal: [0, 0, 1],
    },
    {
      corners: [
        [x0, top, z0],
        [x0, top, z1],
        [x0, bottom, z1],
        [x0, bottom, z0],
      ],
      normal: [-1, 0, 0],
    },
    {
      corners: [
        [x1, top, z1],
        [x1, top, z0],
        [x1, bottom, z0],
        [x1, bottom, z1],
      ],
      normal: [1, 0, 0],
    },
  ];
  if (withBottom)
    faces.push({
      corners: [
        [x0, bottom, z0],
        [x0, bottom, z1],
        [x1, bottom, z1],
        [x1, bottom, z0],
      ],
      normal: [0, 1, 0],
    });
  return faces.map((f) => ({ ...f, color }));
}

// ---------- The piano, built once ----------

const BLACK = [10, 10, 12];
const WOOD = [58, 32, 18];
const GOLD = [160, 122, 52];

function build() {
  const { left, right, front, rimTop, rimBottom, floor, wall, inside, plateY } = CASE;
  const points = outline();
  const normals = normalsOf(points);
  const inner = points.map(([x, z], i) => [x - normals[i][0] * wall, z - normals[i][1] * wall]);
  const faces = [];

  for (let i = 0; i < points.length - 1; i++) {
    const [px, pz] = points[i];
    const [qx, qz] = points[i + 1];
    const [ipx, ipz] = inner[i];
    const [iqx, iqz] = inner[i + 1];
    const len = Math.hypot(qx - px, qz - pz) || 1;
    const n = [(qz - pz) / len, 0, -(qx - px) / len];
    faces.push({
      corners: [
        [px, rimTop, pz],
        [qx, rimTop, qz],
        [qx, rimBottom, qz],
        [px, rimBottom, pz],
      ],
      normal: n,
      color: BLACK,
      gloss: 1,
    });
    faces.push({
      corners: [
        [px, rimTop, pz],
        [qx, rimTop, qz],
        [iqx, rimTop, iqz],
        [ipx, rimTop, ipz],
      ],
      normal: [0, -1, 0],
      color: BLACK,
      gloss: 1,
    });
    if (Math.min(ipz, iqz) > inside) {
      faces.push({
        corners: [
          [iqx, rimTop, iqz],
          [ipx, rimTop, ipz],
          [ipx, plateY, ipz],
          [iqx, plateY, iqz],
        ],
        normal: [-n[0], 0, -n[2]],
        color: WOOD,
        gloss: 0.3,
      });
    }
  }

  // The inside, behind the fallboard: soundboard, plate, strings.
  const innerLeft = left + wall;
  const innerRight = right - wall;
  const interior = [[innerRight, inside], ...inner.filter(([, z]) => z > inside), [innerLeft, inside]];
  const center = interior.reduce((c, [x, z]) => [c[0] + x / interior.length, c[1] + z / interior.length], [0, 0]);
  const plate = interior.map(([x, z]) => [center[0] + (x - center[0]) * 0.9, center[1] + (z - center[1]) * 0.9 + 0.8]);
  const strings = [];
  for (let x = innerLeft + 1.2; x < innerRight - 1; x += 0.85) {
    const back = backAt(interior, x) - 1.6;
    if (back > inside + 6) strings.push({ x, back, bass: x < 20 });
  }
  faces.push({
    corners: [
      [innerRight, rimTop, inside],
      [innerLeft, rimTop, inside],
      [innerLeft, plateY, inside],
      [innerRight, plateY, inside],
    ],
    normal: [0, 0, 1],
    color: WOOD,
    gloss: 0.3,
  });

  // Music desk: a lacquered panel leaning back above the fallboard, on a narrow ledge.
  const lean = 14 * DEG;
  const deskZ = L + 2.3;
  const deskH = 8;
  const top = rimTop - deskH * Math.cos(lean);
  const topZ = deskZ + deskH * Math.sin(lean);
  const desk = [
    [39, rimTop, deskZ],
    [13, rimTop, deskZ],
    [13, top, topZ],
    [39, top, topZ],
  ];
  faces.push({ corners: desk, normal: [0, -Math.sin(lean), -Math.cos(lean)], color: BLACK, gloss: 1 });
  faces.push({ corners: [...desk].reverse(), normal: [0, Math.sin(lean), Math.cos(lean)], color: BLACK, gloss: 1 });
  faces.push(...boxFaces([13, 39], [rimTop - 0.7, rimTop], [L + 1.7, L + 2.5], BLACK).map((f) => ({ ...f, gloss: 1 })));

  // Under the keys: the keybed. Legs at the two front corners and the tail; the pedal lyre.
  faces.push(
    ...boxFaces([left, right], [1.6, rimBottom], [front, inside], BLACK, true).map((f) => ({ ...f, gloss: 1 })),
  );
  for (const [x, z] of [
    [left + 2, 2.6],
    [right - 2, 2.6],
    [7, 76],
  ]) {
    faces.push(
      ...boxFaces([x - 1.3, x + 1.3], [rimBottom, floor], [z - 1.3, z + 1.3], BLACK).map((f) => ({ ...f, gloss: 1 })),
    );
  }
  for (const x of [25, 28]) faces.push(...boxFaces([x - 0.4, x + 0.4], [rimBottom, 27.5], [3, 3.8], BLACK));
  faces.push(...boxFaces([22.5, 30.5], [27.5, 29.6], [1.5, 5], BLACK).map((f) => ({ ...f, gloss: 1 })));
  for (const x of [24, 26.5, 29])
    faces.push(...boxFaces([x - 0.8, x + 0.8], [28.6, 29.1], [-1.6, 1.5], GOLD).map((f) => ({ ...f, gloss: 0.8 })));

  // The lid, from just behind the desk to the tail, propped up about the bass-side hinge.
  const lidShape = [[right, CASE.lidFront], ...points.filter(([, z]) => z > CASE.lidFront), [left, CASE.lidFront]];
  const lid = lidShape.map(lift);
  const up = [-Math.sin(CASE.lidAngle), -Math.cos(CASE.lidAngle), 0];
  const prop = { base: [right - 5.5, rimTop, 24], top: lift([right - 1.5, 24]) };

  return { points, faces, interior, plate, strings, lid, lidUp: up, prop };
}

const GRAND = build();

// ---------- Painting ----------

const LIGHT = (() => {
  const v = [0.35, -1, -0.45];
  const len = Math.hypot(...v);
  return v.map((c) => c / len);
})();

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const unit = (v) => {
  const len = Math.hypot(...v) || 1;
  return v.map((c) => c / len);
};
const centroid = (corners) => [0, 1, 2].map((i) => corners.reduce((s, c) => s + c[i], 0) / corners.length);

/** A surface's color under the stage light: a little diffuse light, and gloss that catches it. */
function lit(color, normal, at, view, gloss = 1) {
  const toEye = unit(view.eye.map((e, i) => e - at[i]));
  const diffuse = Math.max(0, dot(normal, LIGHT));
  const half = unit(LIGHT.map((l, i) => l + toEye[i]));
  const shine = Math.max(0, dot(normal, half)) ** 24 * gloss;
  // Lacquer mirrors the room: faces turned up catch the lights above, and every face brightens
  // toward its silhouette as it turns away (the glossy rim light of a polished case).
  const sky = Math.max(0, -normal[1]) * 22 * gloss;
  const edge = (1 - Math.max(0, dot(normal, toEye))) ** 2 * 70 * gloss;
  const k = 0.6 + 1.1 * diffuse;
  const add = 230 * shine + sky + edge;
  return `rgb(${color.map((c) => Math.min(255, Math.round(c * k + add))).join(', ')})`;
}

const depthOfFace = (view, corners) => corners.reduce((s, c) => s + view.depthOf(...c), 0) / corners.length;

function drawInside(ctx, view) {
  const { plateY } = CASE;
  const flat = (shape, y) => shape.map(([x, z]) => [x, y, z]);
  fillPolygon(ctx, view, flat(GRAND.interior, plateY), lit([120, 84, 46], [0, -1, 0], [26, plateY, 40], view, 0.2));
  fillPolygon(ctx, view, flat(GRAND.plate, plateY - 0.2), lit(GOLD, [0, -1, 0], [26, plateY, 40], view, 0.35));
  for (const [x, z] of [
    [9, 34],
    [23, 27],
    [15, 52],
  ]) {
    const hole = Array.from({ length: 14 }, (_, i) => [
      x + 3.2 * Math.cos((i / 14) * Math.PI * 2),
      z + 4.6 * Math.sin((i / 14) * Math.PI * 2),
    ]);
    fillPolygon(ctx, view, flat(hole, plateY - 0.25), '#2a1a0d');
  }
  const stringsY = plateY - 0.6;
  ctx.lineCap = 'butt';
  for (const s of GRAND.strings) {
    const a = view.project(s.x, stringsY, CASE.inside + 2);
    const b = view.project(s.x, stringsY, s.back);
    if (!a || !b) continue;
    ctx.globalAlpha = 0.85 * Math.min(a.fog, b.fog);
    ctx.strokeStyle = s.bass ? '#b0703f' : '#dcdce4';
    ctx.lineWidth = Math.max(0.6, (s.bass ? 0.16 : 0.1) * (a.s + b.s) * 0.5);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  // Damper felts in a row across the strings.
  fillPolygon(
    ctx,
    view,
    flat(
      [
        [CASE.left + 2, CASE.inside + 3.4],
        [CASE.right - 3, CASE.inside + 3.4],
        [CASE.right - 3, CASE.inside + 4.6],
        [CASE.left + 2, CASE.inside + 4.6],
      ],
      stringsY - 0.5,
    ),
    '#141414',
  );
}

function drawLid(ctx, view) {
  const at = centroid(GRAND.lid);
  const facingUp = facesCamera(view, GRAND.lidUp, at);
  const normal = facingUp ? GRAND.lidUp : GRAND.lidUp.map((c) => -c);
  const hinge = view.project(CASE.left, CASE.rimTop, at[2]);
  const edge = view.project(...lift([CASE.right, at[2]]));
  const tone = lit(BLACK, normal, at, view, 1.2);
  const points = fillPolygon(ctx, view, GRAND.lid, () => {
    if (!hinge || !edge) return tone;
    // A polished lid shows a soft band of reflected light across it.
    const g = ctx.createLinearGradient(hinge.x, hinge.y, edge.x, edge.y);
    g.addColorStop(0, '#060608');
    g.addColorStop(0.45, tone);
    g.addColorStop(0.62, '#34343c');
    g.addColorStop(0.8, tone);
    g.addColorStop(1, '#0a0a0c');
    return g;
  });
  if (!points) return;
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  ctx.stroke();
}

function drawProp(ctx, view) {
  const a = view.project(...GRAND.prop.base);
  const b = view.project(...GRAND.prop.top);
  if (!a || !b) return;
  ctx.globalAlpha = Math.min(a.fog, b.fog);
  ctx.strokeStyle = '#121215';
  ctx.lineCap = 'round';
  ctx.lineWidth = 0.5 * (a.s + b.s) * 0.5;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

/** The stage under the piano: a pool of light and the piano's shadow. */
function drawFloor(ctx, view, palette) {
  const { floor } = CASE;
  const ring = Array.from({ length: 36 }, (_, i) => {
    const a = (i / 36) * Math.PI * 2;
    return [CASE.centerX + 70 * Math.cos(a), floor, 40 + 70 * Math.sin(a)];
  });
  const middle = view.project(CASE.centerX, floor, 40);
  const edge = view.project(CASE.centerX + 70, floor, 40);
  if (middle && edge) {
    fillPolygon(ctx, view, ring, () => {
      const r = Math.max(1, Math.hypot(edge.x - middle.x, edge.y - middle.y) * 1.2);
      const g = ctx.createRadialGradient(middle.x, middle.y, 0, middle.x, middle.y, r);
      g.addColorStop(0, palette.blend === 'lighter' ? 'rgba(255, 245, 230, 0.13)' : 'rgba(60, 40, 20, 0.12)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      return g;
    });
  }
  fillPolygon(
    ctx,
    view,
    GRAND.points.map(([x, z]) => [x, floor, z]),
    'rgba(0, 0, 0, 0.45)',
  );
}

/**
 * Paints the grand piano. `drawKeyboard` paints the keys, fallboard and key slip, slotted in
 * where they belong among the case's faces.
 */
export function drawGrand(ctx, view, palette, drawKeyboard) {
  drawFloor(ctx, view, palette);
  const items = [];
  for (const face of GRAND.faces) {
    const at = centroid(face.corners);
    if (!facesCamera(view, face.normal, at)) continue;
    items.push({
      depth: depthOfFace(view, face.corners),
      draw: () =>
        fillPolygon(ctx, view, face.corners, lit(face.color, face.normal, at, view, face.gloss ?? 0.6), 1, true),
    });
  }
  items.push({ depth: view.depthOf(26, CASE.plateY, 40), draw: () => drawInside(ctx, view) });
  items.push({ depth: view.depthOf(...centroid(GRAND.lid)), draw: () => drawLid(ctx, view) });
  items.push({
    depth: view.depthOf(...GRAND.prop.base.map((v, i) => (v + GRAND.prop.top[i]) / 2)),
    draw: () => drawProp(ctx, view),
  });
  items.push({ depth: view.depthOf(26, 0, L * 0.5), draw: drawKeyboard });
  items.sort((a, b) => b.depth - a.depth);
  for (const item of items) item.draw();
}
