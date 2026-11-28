// Ember fireballs: every note leaps out of the fire FLIGHT seconds before it sounds, arcs across the
// room and lands on its key exactly as the note sounds, bursting into sparks; the key then smolders
// for as long as the note is held. Each hand's fireballs burn in its own color.
import { burst, held, noise } from '../envelope.js';
import { drawBall, drawTrail, rampFrom } from '../flames.js';
import { litColor } from '../palettes.js';
import { notesBetween } from '../scene.js';
import { glowSprite, mixColors } from '../sprites.js';
import { landingOf, launchOf } from './layout.js';

export const FLIGHT = 1.4;
const SPARKS = 10;
const SPARK_LIFE = 0.7;
const RADIUS = 1.5;

const ramps = new Map();

/** A fire in a hand's color, cooling into deep ember. */
function rampOf(color) {
  if (!ramps.has(color)) ramps.set(color, rampFrom(color, mixColors(color, '#3a0800', 0.55)));
  return ramps.get(color);
}

/** Where note `seed`'s fireball is at `t` on its way from `from` to `to`: a high arc, landing at u = 1. */
export function emberAt(from, to, start, t, seed) {
  const u = Math.max(0, Math.min(1, (t - (start - FLIGHT)) / FLIGHT));
  const height = 26 + 14 * noise(seed, 23);
  return [
    from[0] + (to[0] - from[0]) * u,
    from[1] + (to[1] - from[1]) * u - height * 4 * u * (1 - u),
    from[2] + (to[2] - from[2]) * u,
  ];
}

function glow(ctx, view, point, size, color, alpha) {
  const p = view.project(...point);
  if (!p) return;
  const s = size * p.s;
  if (s < 0.5 || alpha <= 0.01) return;
  ctx.globalAlpha = Math.min(1, alpha * p.fog);
  ctx.drawImage(glowSprite(color), p.x - s / 2, p.y - s / 2, s, s);
}

/** Sparks thrown up where a fireball landed, `age` seconds ago, falling back as they cool. */
function drawSparks(ctx, view, at, age, seed, ramp, force) {
  const u = age / SPARK_LIFE;
  for (let i = 0; i < SPARKS; i++) {
    const vx = (noise(seed * 13 + i, 1) - 0.5) * 16 * force;
    const vy = -(7 + 10 * noise(seed * 13 + i, 2)) * force;
    const vz = (noise(seed * 13 + i, 3) - 0.5) * 16 * force;
    const point = [at[0] + vx * age, at[1] + vy * age + 22 * age * age, at[2] + vz * age];
    glow(ctx, view, point, 0.9 * (1 - u) + 0.3, ramp[Math.min(6, Math.floor(1 + u * 5))], (1 - u) ** 1.5);
  }
}

/** Every fireball in flight, every landing's sparks and every smoldering key at t. */
export function drawEmbers(ctx, view, scene, model, t, palette, heat) {
  ctx.globalCompositeOperation = 'lighter';
  const flying = [];
  for (const n of notesBetween(scene, t - SPARK_LIFE, t + FLIGHT)) {
    if (n.start - FLIGHT > t) continue;
    const ramp = rampOf(litColor(palette, n));
    const from = launchOf(n.index);
    const to = landingOf(model, n.pitch);
    if (t < n.start) {
      const at = emberAt(from, to, n.start, t, n.index);
      flying.push({ n, at, ramp, from, to, depth: view.depthOf(...at) });
      continue;
    }
    const age = t - n.start;
    if (age < SPARK_LIFE) drawSparks(ctx, view, to, age, n.index, ramp, 0.6 + 0.6 * n.velocity);
    glow(ctx, view, to, 3.2 + 3 * burst(n, t), ramp[2], held(n, t) * 0.55 + burst(n, t) * 0.6);
  }
  // Farthest first, so nearer fireballs pass in front.
  flying.sort((a, b) => b.depth - a.depth);
  for (const { n, at, ramp, from, to } of flying) {
    const place = (time) => emberAt(from, to, n.start, Math.max(n.start - FLIGHT, time), n.index);
    drawTrail(ctx, view, place, t, 0.35 + heat * 0.3, RADIUS * 0.7, ramp);
    drawBall(ctx, view, at, t, 0.3 + heat * 0.3, RADIUS * (0.75 + 0.4 * n.velocity), ramp);
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}
