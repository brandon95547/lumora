// Fire drawn from soft lights: many small glows, each a color from white-hot to smoke, added
// together. Every flame, spark and ember is placed from its birth time and a fixed random seed,
// so the same moment always burns the same way. The Fire style's runs and Marble Walk's burning
// balls both draw with it.
import { noise } from './envelope.js';
import { glowSprite, mixColors } from './sprites.js';

/** The palette's fire, hottest first: white core, its two colors, then dark smoke. */
export function fireRamp(palette) {
  const twelve = palette.lit.length === 12;
  return rampFrom(twelve ? palette.lit[3] : palette.lit[0], twelve ? palette.lit[0] : palette.lit[1]);
}

/** A teal-blue fire, whatever the palette: the right hand's in Two Hands and Gothic. */
export const TEAL_FIRE = rampFrom('#6ff3ff', '#1f7cff');

/** A crimson hellfire: the left hand's in Gothic. */
export const CRIMSON_FIRE = rampFrom('#ff6a4a', '#a3001c');

/** A fire from a bright color `a` cooling to a deeper `b`, hottest first. */
export function rampFrom(a, b) {
  return [
    mixColors(a, '#ffffff', 0.78),
    mixColors(a, '#ffffff', 0.35),
    a,
    mixColors(a, b, 0.5),
    b,
    mixColors(b, '#000000', 0.45),
    mixColors(b, '#000000', 0.8),
  ];
}

/** Draws one glow at a world point, `size` world units across. */
function glow(ctx, view, point, size, color, alpha) {
  const p = view.project(...point);
  if (!p) return;
  const a = alpha * p.fog * view.opacity;
  if (a <= 0.01) return;
  const s = size * p.s;
  if (s < 0.5) return;
  ctx.globalAlpha = Math.min(1, a);
  ctx.drawImage(glowSprite(color), p.x - s / 2, p.y - s / 2, s, s);
}

/** The color for a flame `u` of the way through its life (0 newborn, 1 gone). */
const colorAt = (ramp, u) => ramp[Math.min(ramp.length - 1, Math.floor(u * ramp.length))];

/**
 * The trail of flame the fireball sheds: puffs born along its path that rise, swell, cool and fade.
 * `place(t)` gives the ball's position at time t; `heat` 0–1 sets how big and long-lived the flames are.
 */
export function drawTrail(ctx, view, place, t, heat, radius, ramp) {
  const rate = 45 + 95 * heat; // puffs a second
  const life = 0.32 + 0.75 * heat;
  const last = Math.floor(t * rate);
  for (let k = Math.floor((t - life) * rate); k <= last; k++) {
    const born = k / rate;
    const age = t - born;
    if (age < 0 || age > life) continue;
    const u = age / life;
    const [x, y, z] = place(born);
    const spread = radius * 0.7;
    const point = [
      x + (noise(k, 1) - 0.5) * spread + (noise(k, 4) - 0.5) * 1.2 * age,
      y + (noise(k, 2) - 0.5) * spread - (1.8 + 3.2 * heat) * age - 1.2 * age * age,
      z + (noise(k, 3) - 0.5) * spread,
    ];
    const size = radius * (1.1 + 2.2 * u) * (0.75 + 0.5 * heat) * (0.8 + 0.4 * noise(k, 5));
    glow(ctx, view, point, size, colorAt(ramp, u * 0.75 + 0.25), (1 - u) ** 1.6 * 0.3);
  }
}

/** The fireball itself: a white-hot heart in layers of flame, flickering, bigger as the fire grows. */
export function drawBall(ctx, view, point, t, heat, radius, ramp) {
  const flicker = 0.9 + 0.1 * Math.sin(t * 31) + 0.05 * Math.sin(t * 57);
  glow(ctx, view, point, radius * (7 + 8 * heat) * flicker, ramp[5], 0.25 + 0.25 * heat);
  glow(ctx, view, point, radius * (3.6 + 2 * heat) * flicker, ramp[3], 0.55);
  glow(ctx, view, point, radius * 2.3 * flicker, ramp[2], 0.8);
  glow(ctx, view, point, radius * 1.25, ramp[0], 1);
}

/**
 * A landing: a pillar of flame leaping off the ledge and a spray of sparks, sized by how hard the
 * notes were struck and how hot the fire is. `age` is seconds since the landing.
 */
export function drawBurst(ctx, view, point, age, force, heat, seed, ramp) {
  const power = (0.5 + 0.5 * force) * (0.45 + 0.9 * heat);
  // The pillar: stacked flames that shoot up and die back.
  const pillar = 0.75 + 0.5 * heat;
  if (age < pillar) {
    const u = age / pillar;
    const height = (3 + 9 * power) * Math.sin(Math.min(1, u * 2.2) * Math.PI * 0.5) * (1 - u * 0.4);
    for (let j = 0; j < 7; j++) {
      const f = j / 6;
      const sway = (noise(seed, j) - 0.5) * 1.2 + Math.sin(age * 18 + j) * 0.25;
      glow(
        ctx,
        view,
        [point[0] + sway * f, point[1] - height * f, point[2]],
        (2.4 - 1.5 * f) * (1.2 + power),
        colorAt(ramp, f * 0.55 + u * 0.35 + 0.1),
        (1 - u) ** 1.2 * (1 - f * 0.4) * 0.55,
      );
    }
  }
  // Sparks: thrown up and out, falling back under gravity.
  const sparks = Math.round(8 + 34 * power);
  const sparkLife = 0.9 + 0.6 * heat;
  if (age < sparkLife) {
    const u = age / sparkLife;
    for (let k = 0; k < sparks; k++) {
      const vx = (noise(seed, k + 20) - 0.5) * 9 * power;
      const vz = (noise(seed, k + 60) - 0.5) * 9 * power;
      const vy = -(5 + 10 * noise(seed, k + 100)) * (0.5 + power);
      const point2 = [point[0] + vx * age, point[1] + vy * age + 9 * age * age, point[2] + vz * age];
      glow(ctx, view, point2, 0.55 + 0.4 * noise(seed, k), colorAt(ramp, 0.15 + u * 0.6), (1 - u) ** 1.5);
    }
  }
}

/** Small flames still licking a ledge after the ball has gone, more of them as the fire grows. */
export function drawEmbersOn(ctx, view, point, width, warmth, heat, t, seed, ramp) {
  glow(ctx, view, point, width * 1.5, ramp[4], warmth * 0.45); // the coals' own light
  const count = Math.round(1 + 5 * heat);
  for (let j = 0; j < count; j++) {
    const phase = (t * (1.4 + noise(seed, j)) + noise(seed, j + 9)) % 1;
    const x = point[0] + (noise(seed, j + 3) - 0.5) * width;
    const z = point[2] + (noise(seed, j + 5) - 0.5) * width * 0.8;
    glow(
      ctx,
      view,
      [x, point[1] - phase * (1 + 2.5 * heat), z],
      1.4 * (1 - phase) + 0.4,
      colorAt(ramp, 0.2 + phase * 0.6),
      warmth * (1 - phase) * 0.8,
    );
  }
}

/** Embers drifting up through the whole frame, in screen space; more and brighter as the fire grows. */
export function drawAirEmbers(ctx, layout, t, heat, ramp) {
  const count = Math.round(20 + 120 * heat);
  for (let k = 0; k < count; k++) {
    const cycle = 4 + 5 * noise(k, 2);
    const phase = (t / cycle + noise(k, 3)) % 1;
    const x = layout.width * noise(k, 1) + Math.sin(t * 0.7 + k) * 24;
    const y = layout.height * (1.05 - phase * 1.15);
    const size = 5 + 12 * noise(k, 4) * (0.5 + heat);
    ctx.globalAlpha = Math.sin(phase * Math.PI) * (0.35 + 0.5 * heat);
    ctx.drawImage(glowSprite(ramp[1 + (k % 3)]), x - size / 2, y - size / 2, size, size);
  }
}
