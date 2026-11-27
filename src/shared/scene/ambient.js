// A soft light that breathes with how much is being played: shared by every kind of scene.
import { burst } from './envelope.js';
import { notesBetween } from './scene.js';
import { withAlpha } from './sprites.js';

/** How much is being played right now, 0–1. */
export function activity(scene, t) {
  let sum = 0;
  for (const n of notesBetween(scene, t - 1, t)) sum += burst(n, t);
  return Math.min(1, sum / 3);
}

/** Lights the frame around (cx, cy) by how much is being played. */
export function drawAmbient(ctx, scene, t, palette, cx, cy) {
  const level = activity(scene, t);
  if (level <= 0.01) return;
  const { width, height } = scene.layout;
  const radius = Math.max(width, height) * 0.6;
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  g.addColorStop(0, withAlpha(palette.lit[0], 0.16 * level));
  g.addColorStop(1, withAlpha(palette.lit[0], 0));
  ctx.globalCompositeOperation = palette.blend;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';
}
