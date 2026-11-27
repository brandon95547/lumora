// Draws one frame of the animation at time t. Pure: the same inputs always give the same picture.
import { backdrop } from './backdrop.js';
import { burst } from './envelope.js';
import { notesBetween } from './scene.js';
import { withAlpha } from './sprites.js';

/** How much is being played right now, 0–1, for the background's breathing light. */
function activity(scene, t) {
  let sum = 0;
  for (const n of notesBetween(scene, t - 1, t)) sum += burst(n, t);
  return Math.min(1, sum / 3);
}

function drawAmbient(ctx, layout, palette, level) {
  if (level <= 0.01) return;
  const cx = layout.width / 2;
  const cy = (layout.grandTop + layout.grandBottom) / 2;
  const radius = Math.max(layout.width, layout.height) * 0.6;
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  g.addColorStop(0, withAlpha(palette.lit[0], 0.16 * level));
  g.addColorStop(1, withAlpha(palette.lit[0], 0));
  ctx.globalCompositeOperation = palette.blend;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, layout.width, layout.height);
  ctx.globalCompositeOperation = 'source-over';
}

function drawTitle(ctx, layout, palette, title) {
  if (!title) return;
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = palette.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${layout.titleSize}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`;
  const maxWidth = layout.width - layout.marginX * 2;
  ctx.fillText(title, layout.width / 2, layout.titleY, maxWidth);
}

function drawProgress(ctx, layout, palette, t, duration) {
  if (!duration) return;
  const y = layout.height - (layout.portrait ? 170 : 70);
  const x0 = layout.marginX + layout.space;
  const w = layout.width - 2 * x0;
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = palette.staff;
  ctx.fillRect(x0, y, w, 4);
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = palette.lit[0];
  ctx.fillRect(x0, y, w * Math.min(1, Math.max(0, t / duration)), 4);
}

export function renderFrame(ctx, scene, { t, style, palette, title }) {
  const { layout } = scene;
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(backdrop(layout, palette), 0, 0);
  drawAmbient(ctx, layout, palette, activity(scene, t));
  drawTitle(ctx, layout, palette, title);
  style.draw(ctx, scene, t, palette);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  drawProgress(ctx, layout, palette, t, scene.duration);
  ctx.restore();
}
