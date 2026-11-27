// The still part of every frame — background, staff lines, brace, clefs — drawn once per
// format and palette, then copied in each frame.
import { GLYPHS } from './glyphs.js';
import { makeCanvas } from './sprites.js';

const paths = new Map();
/** A Bravura glyph as a Path2D, in staff spaces. */
export function glyphPath(name) {
  if (!paths.has(name)) paths.set(name, new Path2D(GLYPHS[name].d));
  return paths.get(name);
}

export function drawGlyph(ctx, name, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fill(glyphPath(name));
  ctx.restore();
}

const cache = new Map();

export function backdrop(layout, palette) {
  const key = `${layout.width}x${layout.height}:${palette.id}`;
  if (cache.has(key)) return cache.get(key);
  const canvas = makeCanvas(layout.width, layout.height);
  const ctx = canvas.getContext('2d');
  const { width, height, space, marginX } = layout;

  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, palette.background[0]);
  bg.addColorStop(1, palette.background[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = palette.staff;
  ctx.lineWidth = Math.max(2, space * 0.06);
  const left = marginX + space * 1.3;
  for (const top of [layout.trebleTop, layout.bassTop]) {
    for (let i = 0; i < 5; i++) {
      const y = Math.round(top + i * space) + 0.5;
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(layout.noteRight, y);
      ctx.stroke();
    }
  }
  // System barline joining the staves.
  ctx.beginPath();
  ctx.moveTo(left, layout.grandTop);
  ctx.lineTo(left, layout.grandBottom);
  ctx.stroke();

  ctx.fillStyle = palette.staff;
  drawGlyph(ctx, 'brace', marginX, layout.grandBottom, (layout.grandBottom - layout.grandTop) / 4);
  ctx.fillStyle = palette.ink;
  ctx.globalAlpha = 0.85;
  drawGlyph(ctx, 'gClef', left + space * 0.6, layout.bottomLine.treble - space, space);
  drawGlyph(ctx, 'fClef', left + space * 0.6, layout.bottomLine.bass - 3 * space, space);
  ctx.globalAlpha = 1;

  cache.set(key, canvas);
  return canvas;
}
