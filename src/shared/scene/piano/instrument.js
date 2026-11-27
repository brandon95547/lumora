// Draws the grand piano's keyboard as a camera sees it: ivory and ebony keys as solid blocks that tip
// down when played, the felt behind them, the lacquered fallboard (which mirrors the keys), the key
// slip in front and the cheek blocks at each end. Faces turned away from the camera are skipped.
import { litColor } from '../palettes.js';
import { glowSprite } from '../sprites.js';
import { facesCamera, fillPolygon, mirrored } from '../view.js';
import { KEY } from './keyboard.js';

const L = KEY.length;
const FALLBOARD_Z = L + 0.55;
const CHEEK = 1.7; // width of each end block

const IVORY = { front: '#d9d2c3', side: '#c3bba9', near: '#fdfbf6', far: '#e6e0d3' };
const EBONY = { front: '#050507', side: '#0f0f12', near: '#3b3b42', far: '#101013', shine: 'rgba(255, 255, 255, 0.2)' };
const LACQUER = { top: '#1d1d22', front: '#0a0a0c', side: '#131317' };

const centroid = (corners) => [0, 1, 2].map((i) => corners.reduce((s, c) => s + c[i], 0) / corners.length);

function face(ctx, view, corners, normal, fill, alpha = 1) {
  if (!facesCamera(view, normal, centroid(corners))) return;
  fillPolygon(ctx, view, corners, fill, alpha);
}

/**
 * Key tops lit from the front: lighter nearer the player. One gradient per frame, laid from the
 * keyboard's front edge to its back, serves every key.
 */
function topShades(ctx, view, model) {
  const front = view.project(model.whites / 2, 0, 0);
  const back = view.project(model.whites / 2, 0, L);
  const shade = (near, far) => {
    if (!front || !back) return near;
    const g = ctx.createLinearGradient(front.x, front.y, back.x, back.y);
    g.addColorStop(0, near);
    g.addColorStop(1, far);
    return g;
  };
  return { ivory: shade(IVORY.near, IVORY.far), ebony: shade(EBONY.near, EBONY.far) };
}

function box(ctx, view, [x0, x1], [top, bottom], [z0, z1], colors) {
  face(
    ctx,
    view,
    [
      [x0, top, z0],
      [x1, top, z0],
      [x1, top, z1],
      [x0, top, z1],
    ],
    [0, -1, 0],
    colors.top,
  );
  face(
    ctx,
    view,
    [
      [x1, top, z0],
      [x0, top, z0],
      [x0, bottom, z0],
      [x1, bottom, z0],
    ],
    [0, 0, -1],
    colors.front,
  );
  face(
    ctx,
    view,
    [
      [x0, top, z0],
      [x0, top, z1],
      [x0, bottom, z1],
      [x0, bottom, z0],
    ],
    [-1, 0, 0],
    colors.side,
  );
  face(
    ctx,
    view,
    [
      [x1, top, z1],
      [x1, top, z0],
      [x1, bottom, z0],
      [x1, bottom, z1],
    ],
    [1, 0, 0],
    colors.side,
  );
}

/** How far a key's front and back have gone down. */
const drop = (press, depth) => [press * depth, press * depth * 0.12];

function whiteKey(ctx, view, key, press, tint, shades) {
  const [dF, dB] = drop(press, KEY.whitePress);
  const { x0, x1 } = key;
  const top = [
    [x0, dF, 0],
    [x1, dF, 0],
    [x1, dB, L],
    [x0, dB, L],
  ];
  const shade = press ? 0.93 : 1;
  face(ctx, view, top, [0, -1, 0], shades.ivory, shade);
  if (tint) face(ctx, view, top, [0, -1, 0], tint.color, tint.alpha);
  face(
    ctx,
    view,
    [
      [x1, dF, 0],
      [x0, dF, 0],
      [x0, dF + KEY.nose, 0],
      [x1, dF + KEY.nose, 0],
    ],
    [0, 0, -1],
    IVORY.front,
  );
}

/** The side of a resting white key, showing where its neighbor has gone down. */
function wall(ctx, view, x, facing, press) {
  const [dF, dB] = drop(press, KEY.whitePress);
  face(
    ctx,
    view,
    [
      [x, 0, 0],
      [x, 0, L],
      [x, dB, L],
      [x, dF, 0],
    ],
    [facing, 0, 0],
    IVORY.side,
  );
}

function blackKey(ctx, view, key, press, tint, shades) {
  const [dF, dB] = drop(press, KEY.blackPress);
  const { x0, x1 } = key;
  const z0 = L - KEY.blackLength;
  const inset = 0.06;
  const slope = 0.16;
  const yTop = (d) => -KEY.blackHeight + d;
  const base = 0.12;
  const a = [x0 + inset, yTop(dF), z0 + slope];
  const b = [x1 - inset, yTop(dF), z0 + slope];
  const c = [x1 - inset, yTop(dB), L];
  const d = [x0 + inset, yTop(dB), L];
  face(ctx, view, [a, d, [x0, base + dB, L], [x0, base + dF, z0]], [-1, -0.15, 0], EBONY.side);
  face(ctx, view, [c, b, [x1, base + dF, z0], [x1, base + dB, L]], [1, -0.15, 0], EBONY.side);
  face(ctx, view, [b, a, [x0, base + dF, z0], [x1, base + dF, z0]], [0, -0.35, -1], EBONY.front);
  face(ctx, view, [a, b, c, d], [0, -1, 0], shades.ebony);
  // The polished edge that catches the light at the front of the key.
  face(ctx, view, [a, b, [b[0], b[1], b[2] + 0.35], [a[0], a[1], a[2] + 0.35]], [0, -1, 0], EBONY.shine);
  if (tint) face(ctx, view, [a, b, c, d], [0, -1, 0], tint.color, tint.alpha * 0.85);
}

/** Every key, drawn back to front so nearer keys cover farther ones. */
function drawKeys(ctx, view, model, down, palette, tintStrength) {
  const tintOf = (pitch) => {
    const d = down.get(pitch);
    return d && tintStrength ? { color: litColor(palette, d.note), alpha: tintStrength * d.amount } : null;
  };
  const pressOf = (pitch) => down.get(pitch)?.amount ?? 0;
  const shades = topShades(ctx, view, model);
  const whites = model.keys.filter((k) => !k.black);
  const byDistance = (keys) =>
    view.depthOf
      ? [...keys].sort((p, q) => view.depthOf((q.x0 + q.x1) / 2, 0, L / 2) - view.depthOf((p.x0 + p.x1) / 2, 0, L / 2))
      : keys;

  // Keys that are down first, then the sides they uncover, then the keys at rest over them.
  for (const k of whites) if (pressOf(k.pitch)) whiteKey(ctx, view, k, pressOf(k.pitch), tintOf(k.pitch), shades);
  whites.forEach((k, i) => {
    const p = pressOf(k.pitch);
    if (!p) return;
    const left = whites[i - 1];
    const right = whites[i + 1];
    if (left && !pressOf(left.pitch)) wall(ctx, view, left.x1, 1, p);
    if (right && !pressOf(right.pitch)) wall(ctx, view, right.x0, -1, p);
  });
  for (const k of whites) if (!pressOf(k.pitch)) whiteKey(ctx, view, k, 0, null, shades);
  for (const k of byDistance(model.keys.filter((k) => k.black)))
    blackKey(ctx, view, k, pressOf(k.pitch), tintOf(k.pitch), shades);
}

/** Soft light rising off each key that is down. */
function drawKeyLights(ctx, view, model, down, palette, strength, atBack) {
  ctx.globalCompositeOperation = palette.blend;
  for (const [pitch, { amount, note }] of down) {
    const key = model.byPitch.get(pitch);
    if (!key) continue;
    const p = view.project((key.x0 + key.x1) / 2, -0.3, atBack ? L : L * 0.35);
    if (!p) continue;
    const size = 3.2 * p.s * view.glow;
    ctx.globalAlpha = Math.min(1, strength * amount * p.fog * (palette.blend === 'lighter' ? 1 : 0.5));
    ctx.drawImage(glowSprite(litColor(palette, note)), p.x - size / 2, p.y - size / 2, size, size);
  }
  ctx.globalCompositeOperation = 'source-over';
}

/**
 * The whole instrument. `fallboard`: draw the lacquered panel behind the keys and the keys' reflection
 * in it (Live), or leave the space open for falling notes. `tint` and `light`: how strongly played
 * keys take on the palette's color and glow.
 */
export function drawInstrument(ctx, view, model, down, palette, { fallboard, tint, light, lightAtBack = false }) {
  const W = model.whites;
  const left = -CHEEK - 0.05;
  const right = W + CHEEK + 0.05;

  if (fallboard) {
    const panel = [
      [right, -2.6, FALLBOARD_Z],
      [left, -2.6, FALLBOARD_Z],
      [left, 0.02, FALLBOARD_Z],
      [right, 0.02, FALLBOARD_Z],
    ];
    const points = fillPolygon(ctx, view, panel, (pts) => {
      const g = ctx.createLinearGradient(0, pts[0].y, 0, pts[2].y);
      g.addColorStop(0, '#1a1a1f');
      g.addColorStop(0.55, '#0b0b0d');
      g.addColorStop(1, '#040405');
      return g;
    });
    if (points && view.depth) {
      ctx.save();
      ctx.beginPath();
      points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.clip();
      const reflection = mirrored(view, 'z', FALLBOARD_Z, 0.17);
      drawKeys(ctx, reflection, model, down, palette, tint);
      drawKeyLights(ctx, reflection, model, down, palette, light * 0.6, lightAtBack);
      ctx.restore();
    }
    // The red felt strip between the keys and the fallboard.
    face(
      ctx,
      view,
      [
        [0, -0.01, L],
        [W, -0.01, L],
        [W, -0.01, FALLBOARD_Z],
        [0, -0.01, FALLBOARD_Z],
      ],
      [0, -1, 0],
      '#5e1520',
    );
  }

  // The dark bed the keys sit in, seen through the gaps.
  face(
    ctx,
    view,
    [
      [-0.1, KEY.nose, 0],
      [W + 0.1, KEY.nose, 0],
      [W + 0.1, KEY.nose, L],
      [-0.1, KEY.nose, L],
    ],
    [0, -1, 0],
    '#030304',
  );
  drawKeys(ctx, view, model, down, palette, tint);

  // Key slip in front; cheek blocks at the ends.
  box(ctx, view, [left, right], [KEY.nose * 0.9, 1.6], [-0.65, -0.04], LACQUER);
  const back = fallboard ? FALLBOARD_Z + 0.3 : L + 0.3;
  box(ctx, view, [left, -0.06], [-0.6, 1.6], [-0.65, back], LACQUER);
  box(ctx, view, [W + 0.06, right], [-0.6, 1.6], [-0.65, back], LACQUER);

  drawKeyLights(ctx, view, model, down, palette, light, lightAtBack);
}
