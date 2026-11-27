// Fire drawn from soft lights: many small glows, each a color from white-hot to smoke, added
// together. Every flame, spark and ember is placed from its birth time and a fixed random seed,
// so the same moment always burns the same way. Marble Walk's burning balls draw with it.
import { noise } from './envelope.js';
import { glowSprite, mixColors } from './sprites.js';

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
