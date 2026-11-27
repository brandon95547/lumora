// Pre-drawn glows, one per color, so a frame of a hundred lit notes costs a hundred image draws.
const SIZE = 128;
const cache = new Map();

export function makeCanvas(width, height) {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function glowSprite(color) {
  let sprite = cache.get(color);
  if (sprite) return sprite;
  sprite = makeCanvas(SIZE, SIZE);
  const ctx = sprite.getContext('2d');
  const g = ctx.createRadialGradient(SIZE / 2, SIZE / 2, 0, SIZE / 2, SIZE / 2, SIZE / 2);
  g.addColorStop(0, color);
  g.addColorStop(0.18, color);
  g.addColorStop(0.42, withAlpha(color, 0.35));
  g.addColorStop(1, withAlpha(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SIZE, SIZE);
  cache.set(color, sprite);
  return sprite;
}

/** '#rrggbb' → 'rgba(r, g, b, a)'. */
export function withAlpha(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
