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

/** A color ('#rrggbb' or 'rgba(…)') at `alpha` times its own opacity. */
export function withAlpha(color, alpha) {
  if (color.startsWith('#')) {
    const n = parseInt(color.slice(1), 16);
    return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }
  const [r, g, b, a = 1] = color.match(/[\d.]+/g).map(Number);
  return `rgba(${r}, ${g}, ${b}, ${a * alpha})`;
}

const spheres = new Map();

/** A lit glass ball: a bright highlight up and to the left, the color, and a shaded rim. For 3D. */
export function sphereSprite(color) {
  let sprite = spheres.get(color);
  if (sprite) return sprite;
  sprite = makeCanvas(SIZE, SIZE);
  const ctx = sprite.getContext('2d');
  const c = SIZE / 2;
  ctx.beginPath();
  ctx.arc(c, c, c - 1, 0, Math.PI * 2);
  ctx.clip();
  const body = ctx.createRadialGradient(c * 0.7, c * 0.62, 0, c, c, c);
  body.addColorStop(0, '#ffffff');
  body.addColorStop(0.22, color);
  body.addColorStop(1, color);
  ctx.fillStyle = body;
  ctx.fillRect(0, 0, SIZE, SIZE);
  const rim = ctx.createRadialGradient(c * 0.85, c * 0.8, c * 0.35, c, c, c);
  rim.addColorStop(0, 'rgba(0, 0, 0, 0)');
  rim.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
  ctx.fillStyle = rim;
  ctx.fillRect(0, 0, SIZE, SIZE);
  spheres.set(color, sprite);
  return sprite;
}
