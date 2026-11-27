// Backgrounds every kind of scene shares: the palette's gradient, and a darker-cornered version for 3D.
import { makeCanvas } from './sprites.js';

export function paintBackground(ctx, layout, palette) {
  const bg = ctx.createLinearGradient(0, 0, 0, layout.height);
  bg.addColorStop(0, palette.background[0]);
  bg.addColorStop(1, palette.background[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, layout.width, layout.height);
}

const cache = new Map();

/** A canvas painted once per format, palette and key, then copied into each frame. */
export function cachedLayer(key, layout, paint) {
  if (!cache.has(key)) {
    const canvas = makeCanvas(layout.width, layout.height);
    paint(canvas.getContext('2d'));
    cache.set(key, canvas);
  }
  return cache.get(key);
}

/** The palette's background with a vignette that deepens the corners, for scenes in depth. */
export function depthBackdrop(layout, palette) {
  return cachedLayer(`depth:${layout.width}x${layout.height}:${palette.id}`, layout, (ctx) => {
    paintBackground(ctx, layout, palette);
    const r = Math.hypot(layout.width, layout.height) / 2;
    const cx = layout.width / 2;
    const cy = layout.height / 2;
    const v = ctx.createRadialGradient(cx, cy, r * 0.45, cx, cy, r);
    v.addColorStop(0, 'rgba(0, 0, 0, 0)');
    v.addColorStop(1, palette.blend === 'lighter' ? 'rgba(0, 0, 0, 0.55)' : 'rgba(60, 40, 20, 0.18)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, layout.width, layout.height);
  });
}
