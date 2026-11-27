// The staff itself — lines, system barline, brace and clefs — and the ground it stands on.
// Drawn through a view, so the same code draws the flat staff and the one seen in 3D.
import { GLYPHS } from './glyphs.js';
import { cachedLayer, paintBackground } from '../backdrop.js';
import { withAlpha } from '../sprites.js';
import { onPlane, strokeWorld } from '../view.js';
import { flatView } from './view.js';

const paths = new Map();
/** A Bravura glyph as a Path2D, in staff spaces. */
function glyphPath(name) {
  if (!paths.has(name)) paths.set(name, new Path2D(GLYPHS[name].d));
  return paths.get(name);
}

/** Fills a glyph lying on the staff plane at (x, y), `scale` pixels per staff space. */
export function drawGlyph(ctx, view, name, x, y, scale, color, alpha) {
  const p = view.project(x, y);
  const a = alpha * view.opacity * (p?.fog ?? 0);
  if (a <= 0.01) return;
  ctx.save();
  if (onPlane(ctx, view, x, y)) {
    ctx.scale(scale, scale);
    ctx.globalAlpha = a;
    ctx.fillStyle = color;
    ctx.fill(glyphPath(name));
  }
  ctx.restore();
}

export function drawStaff(ctx, view, layout, palette) {
  const { space } = layout;
  const width = Math.max(2, space * 0.06);
  const left = view.staffLeft + space * 1.3;
  for (const top of [layout.trebleTop, layout.bassTop]) {
    for (let i = 0; i < 5; i++) {
      const y = top + i * space;
      strokeWorld(ctx, view, [left, y, 0], [view.noteRight, y, 0], width, palette.staff, 1);
    }
  }
  strokeWorld(ctx, view, [left, layout.grandTop, 0], [left, layout.grandBottom, 0], width, palette.staff, 1);
  const braceScale = (layout.grandBottom - layout.grandTop) / 4;
  drawGlyph(ctx, view, 'brace', view.staffLeft, layout.grandBottom, braceScale, palette.staff, 1);
  drawGlyph(ctx, view, 'gClef', left + space * 0.6, layout.bottomLine.treble - space, space, palette.ink, 0.85);
  drawGlyph(ctx, view, 'fClef', left + space * 0.6, layout.bottomLine.bass - 3 * space, space, palette.ink, 0.85);
}

/** The still part of a flat frame: background and staff, drawn once per format and palette. */
export function flatBackdrop(layout, palette, motion) {
  return cachedLayer(`staff:${layout.width}x${layout.height}:${palette.id}:${motion}`, layout, (ctx) => {
    paintBackground(ctx, layout, palette);
    drawStaff(ctx, flatView(layout, motion), layout, palette);
  });
}

/** Where the floor's far edge meets the sky: a soft band of light. */
export function drawHorizon(ctx, view, layout, palette, floorY) {
  const far = view.project((view.noteLeft + view.noteRight) / 2, floorY, layout.width * 3);
  if (!far) return;
  ctx.save();
  ctx.translate(layout.width / 2, far.y);
  ctx.scale(1, 0.22);
  const r = layout.width * 0.9;
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, withAlpha(palette.lit[0], 0.2));
  g.addColorStop(1, withAlpha(palette.lit[0], 0));
  ctx.globalCompositeOperation = palette.blend;
  ctx.fillStyle = g;
  ctx.fillRect(-r, -r, 2 * r, 2 * r);
  ctx.restore();
}

/**
 * A grid on the floor. Its cross lines keep time with the music in scrolling styles,
 * so the ground moves with the notes.
 */
export function drawFloor(ctx, view, layout, palette, floorY, t, motion) {
  const { space } = layout;
  const color = palette.staff;
  const width = Math.max(1.5, space * 0.04);
  const zNear = -space * 30;
  const zFar = layout.width * 3;
  for (let z = zNear; z <= zFar; z += space * 5) {
    strokeWorld(ctx, view, [view.staffLeft - space * 20, floorY, z], [view.noteRight, floorY, z], width, color, 0.35);
  }
  const step = motion === 'scroll' ? layout.pixelsPerSecond * 0.5 : space * 5;
  const shift = motion === 'scroll' ? (t * layout.pixelsPerSecond) % step : 0;
  for (let x = view.staffLeft - shift; x <= view.noteRight; x += step) {
    strokeWorld(ctx, view, [x, floorY, zNear], [x, floorY, zFar], width, color, 0.35);
  }
}
