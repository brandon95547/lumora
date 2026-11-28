// The keyboard in the sky: 88 stars, one for each key, in an arch over the solar system, the lowest
// key at the left and every C a little brighter. About a second before a note sounds, its star fires
// a mote of light at the note's planet; the mote strikes exactly as the note sounds and glances off
// into space. The star itself lights with the note, in its hand's color: the right hand's as sharp
// four-pointed sparkles, the left hand's as soft swelling glows, bigger for harder notes and lit for
// as long as the note is held. Stars and motes live on the frame, not in the world, like the sky.
import { burst, held, noise } from '../envelope.js';
import { litColor } from '../palettes.js';
import { notesBetween } from '../scene.js';
import { glowSprite, mixColors } from '../sprites.js';
import { planetAt, systemOf } from './system.js';
import { anchorOf } from './view.js';

const LOWEST = 21; // A0
const KEYS = 88;
export const LEAD = 1.1; // seconds a mote flies from its star to its planet
export const BOUNCE = 0.9; // seconds a mote glances off before it is gone
const TRAIL = 12; // glows behind a mote's head, close enough to read as one streak

/** Where key `pitch`'s star sits in the frame. */
export function starOf(layout, pitch) {
  const k = Math.min(KEYS - 1, Math.max(0, pitch - LOWEST)) / (KEYS - 1);
  const phi = Math.PI * (1.06 + 0.88 * k); // from low on the left, over the top, to low on the right
  const [cx, cy] = anchorOf(layout);
  const rx = layout.width * (layout.portrait ? 0.46 : 0.47);
  const ry = layout.height * (layout.portrait ? 0.33 : 0.4);
  return { x: cx + rx * Math.cos(phi), y: cy + ry * Math.sin(phi) };
}

/** A mote's place `u` (0–1) of the way from its star to its planet: a gentle curve, speeding up. */
export function motePath(from, to, u, seed) {
  const e = u ** 1.6;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const bend = 0.18 * (noise(seed, 31) < 0.5 ? -1 : 1);
  const cx = from.x + dx / 2 - dy * bend;
  const cy = from.y + dy / 2 + dx * bend;
  const a = (1 - e) ** 2;
  const b = 2 * (1 - e) * e;
  const c = e ** 2;
  return { x: a * from.x + b * cx + c * to.x, y: a * from.y + b * cy + c * to.y };
}

/** A mote `age` seconds after striking at `hit` from direction (dx, dy): it glances back off, slowing. */
export function bounceAt(hit, dx, dy, age, seed, reach) {
  const d = Math.hypot(dx, dy) || 1;
  const turn = (noise(seed, 32) - 0.5) * 1.6; // off a round planet, never straight back
  const ox = -dx / d;
  const oy = -dy / d;
  const [bx, by] = [ox * Math.cos(turn) - oy * Math.sin(turn), ox * Math.sin(turn) + oy * Math.cos(turn)];
  const far = reach * (1 - Math.exp(-age * 3.5));
  return { x: hit.x + bx * far, y: hit.y + by * far };
}

function glow(ctx, color, p, size, alpha) {
  if (alpha <= 0.01) return;
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.drawImage(glowSprite(color), p.x - size / 2, p.y - size / 2, size, size);
}

function sparkle(ctx, color, p, size, alpha) {
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - size);
  ctx.quadraticCurveTo(p.x, p.y, p.x + size, p.y);
  ctx.quadraticCurveTo(p.x, p.y, p.x, p.y + size);
  ctx.quadraticCurveTo(p.x, p.y, p.x - size, p.y);
  ctx.quadraticCurveTo(p.x, p.y, p.x, p.y - size);
  ctx.fill();
}

/** The 88 stars, waiting: faint points, every C a little brighter. */
export function drawKeyStars(ctx, layout, palette) {
  const unit = Math.min(layout.width, layout.height) / 1080;
  ctx.fillStyle = palette.ink;
  for (let pitch = LOWEST; pitch < LOWEST + KEYS; pitch++) {
    const p = starOf(layout, pitch);
    const c = pitch % 12 === 0;
    ctx.globalAlpha = c ? 0.6 : 0.3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, (c ? 2.4 : 1.6) * unit, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** The lit stars, the motes in flight and the motes glancing away, for every note near t. */
export function drawStarlight(ctx, scene, t, palette, view, places) {
  const { layout } = scene;
  const unit = Math.min(layout.width, layout.height) / 1080;
  const { planetOf } = systemOf(scene);
  ctx.globalCompositeOperation = palette.blend;
  for (const n of notesBetween(scene, t - BOUNCE - 1, t + LEAD)) {
    const color = litColor(palette, n);
    const star = starOf(layout, n.pitch);
    const k = planetOf[n.index];
    const launch = n.start - LEAD;
    if (t < launch) continue;
    const seed = n.index;

    // The star: a flicker as it fires, then lit with the note.
    if (t < launch + 0.3) glow(ctx, color, star, 22 * unit, 0.6 * (1 - (t - launch) / 0.3));
    if (t >= n.start) {
      const lit = Math.max(burst(n, t), held(n, t) * 0.5);
      if (n.hand === 'right') {
        glow(ctx, color, star, (26 + 30 * n.velocity) * unit, lit);
        sparkle(ctx, mixColors('#ffffff', color, 0.35), star, (8 + 14 * n.velocity) * unit * (0.5 + 0.5 * lit), lit);
      } else {
        const swell = 0.6 + 0.4 * Math.min(1, (t - n.start) / 0.3);
        glow(ctx, color, star, (44 + 50 * n.velocity) * unit * swell, lit * 0.85);
      }
    }

    // The mote: flying in, then glancing off where it struck.
    const target = view.project(...places[k]);
    if (!target) continue;
    const head = mixColors('#ffffff', color, 0.4);
    if (t < n.start) {
      const u = (t - launch) / LEAD;
      for (let i = TRAIL - 1; i >= 0; i--) {
        const p = motePath(star, target, Math.max(0, u - i * 0.012), seed);
        glow(ctx, i ? color : head, p, (12 - 0.7 * i) * unit, (1 - i / TRAIL) * 0.7);
      }
    } else if (t - n.start < BOUNCE) {
      const age = t - n.start;
      const hit = view.project(...planetAt(scene, k, n.start)) ?? target;
      const before = motePath(star, hit, 0.97, seed);
      const reach = 180 * unit * (0.6 + 0.6 * n.velocity);
      const fade = (1 - age / BOUNCE) ** 2;
      for (let i = TRAIL - 1; i >= 0; i--) {
        const p = bounceAt(hit, hit.x - before.x, hit.y - before.y, Math.max(0, age - i * 0.012), seed, reach);
        glow(ctx, i ? color : head, p, (10 - 0.6 * i) * unit, fade * (1 - i / TRAIL) * 0.8);
      }
    }
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}
