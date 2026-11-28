// Shooting Stars: every note is a star far out in the sky. It shows a few seconds before its note,
// brightens as its time comes, then shoots in a curve toward its key, faster as it falls, trailing
// light, and lands exactly as the note sounds, scattering sparkles; the key glows while the note is
// held. Each hand's stars burn in its own color.
import { burst, held, noise } from '../envelope.js';
import { litColor } from '../palettes.js';
import { notesBetween } from '../scene.js';
import { glowSprite, mixColors } from '../sprites.js';
import { landingOf, starOf } from './layout.js';

export const FLIGHT = 1.5; // seconds a star takes to reach its key
const SHOW = 3.5; // seconds a star shows in the sky before it shoots
const WAKE = 0.5; // seconds it brightens before it shoots
const SPARK_LIFE = 0.8;
const SPARKS = 10;
const TAIL = 26;
const TAIL_LENGTH = 0.12; // of the whole path

/**
 * Where a star is `t` on its way from `from` (the sky) to `to` (its key), landing at `start`: a curve
 * that bows up and over, speeding up as it comes.
 */
export function shootingStarAt(from, to, start, t) {
  return alongPath(from, to, progressOf(start, t));
}

/** How far along its path (0–1) a star landing at `start` is at t: speeding up as it comes. */
const progressOf = (start, t) => Math.max(0, Math.min(1, (t - (start - FLIGHT)) / FLIGHT)) ** 1.7;

/** The point `e` (0–1) of the way along the path from the sky to the key. */
function alongPath(from, to, e) {
  const control = [(from[0] + to[0]) / 2, Math.min(from[1], to[1]) - 40, (from[2] + to[2]) / 2];
  const a = (1 - e) ** 2;
  const b = 2 * (1 - e) * e;
  const c = e ** 2;
  return [0, 1, 2].map((i) => a * from[i] + b * control[i] + c * to[i]);
}

/** A glow at a world point, `size` world units across but never under `least` pixels. */
function glow(ctx, view, point, size, least, color, alpha) {
  const p = view.project(...point);
  if (!p || alpha <= 0.01) return null;
  const s = Math.max(least, size * p.s);
  ctx.globalAlpha = Math.min(1, alpha * Math.max(0.35, p.fog));
  ctx.drawImage(glowSprite(color), p.x - s / 2, p.y - s / 2, s, s);
  return { ...p, size: s };
}

/** A four-pointed glint across a bright star. */
function glint(ctx, p, size, color, alpha) {
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

function drawSparkles(ctx, view, at, age, seed, color, force) {
  const u = age / SPARK_LIFE;
  for (let i = 0; i < SPARKS; i++) {
    const k = seed * 13 + i;
    const v = [(noise(k, 1) - 0.5) * 18 * force, -(5 + 9 * noise(k, 2)) * force, (noise(k, 3) - 0.5) * 18 * force];
    const point = [at[0] + v[0] * age, at[1] + v[1] * age + 14 * age * age, at[2] + v[2] * age];
    glow(ctx, view, point, 0.9 * (1 - u) + 0.3, 2, i % 3 ? color : '#ffffff', (1 - u) ** 1.5);
  }
}

/** Every star near its time: waiting in the sky, shooting, or landed and sparkling. */
export function drawShootingStars(ctx, view, scene, model, t, palette) {
  ctx.globalCompositeOperation = 'lighter';
  const shooting = [];
  for (const n of notesBetween(scene, t - SPARK_LIFE, t + FLIGHT + SHOW)) {
    const launch = n.start - FLIGHT;
    if (t < launch - SHOW) continue;
    const color = litColor(palette, n);
    const white = mixColors('#ffffff', color, 0.35);
    const from = starOf(n.pitch, n.index);
    const to = landingOf(model, n.pitch);
    if (t < launch) {
      // Waiting: fading in, twinkling, then brightening as its time comes.
      const shown = Math.min(1, (t - (launch - SHOW)) / 1.2);
      const wake = Math.max(0, 1 - (launch - t) / WAKE);
      const twinkle = 0.75 + 0.25 * Math.sin(t * (3 + 3 * noise(n.index, 44)) + n.index);
      const p = glow(ctx, view, from, 3 + 5 * wake, 4 + 8 * wake, color, shown * (0.45 * twinkle + 0.55 * wake));
      if (p && wake > 0.05) glint(ctx, p, p.size * 0.9, white, wake);
    } else if (t < n.start) {
      shooting.push({ n, from, to, color, white, depth: view.depthOf(...shootingStarAt(from, to, n.start, t)) });
    } else {
      const age = t - n.start;
      if (age < SPARK_LIFE) drawSparkles(ctx, view, to, age, n.index, color, 0.6 + 0.6 * n.velocity);
      glow(ctx, view, to, 3 + 3 * burst(n, t), 4, color, held(n, t) * 0.5 + burst(n, t) * 0.7);
    }
  }
  // Farthest first, so nearer stars pass in front.
  shooting.sort((a, b) => b.depth - a.depth);
  for (const { n, from, to, color, white } of shooting) {
    // The trail, spaced along the path (not in time, which spreads it out as the star speeds up): a
    // streak that tapers and fades, with soft light along it.
    const e = progressOf(n.start, t);
    const points = [];
    for (let i = 0; i < TAIL; i++) {
      const p = view.project(...alongPath(from, to, Math.max(0, e - (i / TAIL) * TAIL_LENGTH)));
      if (p) points.push(p);
    }
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    for (let i = 1; i < points.length; i++) {
      const k = 1 - i / TAIL;
      ctx.globalAlpha = 0.85 * k * k;
      ctx.lineWidth = Math.max(1, 1.6 * points[i].s * k);
      ctx.beginPath();
      ctx.moveTo(points[i - 1].x, points[i - 1].y);
      ctx.lineTo(points[i].x, points[i].y);
      ctx.stroke();
    }
    for (let i = 0; i < TAIL; i += 3) {
      glow(
        ctx,
        view,
        alongPath(from, to, Math.max(0, e - (i / TAIL) * TAIL_LENGTH)),
        3 * (1 - i / TAIL),
        4,
        color,
        0.5 * (1 - i / TAIL),
      );
    }
    const head = glow(ctx, view, alongPath(from, to, e), 2.4 + 1.2 * n.velocity, 7, white, 1);
    if (head) glint(ctx, head, head.size * 0.8, '#ffffff', 0.9);
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}
