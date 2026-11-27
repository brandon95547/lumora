// Where a note is at time t and how its parts are drawn. Every helper draws through the view, so
// Marble Walk is drawn in 2D and in 3D by the same code.
import { notesBetween } from '../scene.js';
import { glowSprite } from '../sprites.js';
import { drawGlyph } from './stage.js';
import { onPlane, strokeWorld } from '../view.js';

/** Scrolling: notes travel right to left and reach the playhead as they sound. */
export function scrollPlacement(scene, t, view) {
  const { layout } = scene;
  const pps = layout.pixelsPerSecond;
  const behind = (layout.playheadX - view.noteLeft) / pps;
  const ahead = (view.noteRight - layout.playheadX) / pps;
  const xAt = (time) => layout.playheadX + (time - t) * pps;
  const notes = notesBetween(scene, t - behind - 0.3, t + ahead + 0.3).map((n) => {
    const x = xAt(n.start) + n.dx;
    return { note: n, x, alpha: view.fade(x) };
  });
  return { notes, xAt };
}

/** The point on screen, and how opaque to draw there (fog and the view's own opacity included). */
function at(view, x, y, alpha) {
  const p = view.project(x, y);
  if (!p) return null;
  const a = alpha * p.fog * view.opacity;
  return a > 0.01 ? { ...p, a } : null;
}

export function drawLedgers(ctx, view, layout, note, x, color, alpha) {
  const half = layout.radius * 1.55;
  const width = Math.max(2, layout.space * 0.06);
  for (const y of note.ledgers) strokeWorld(ctx, view, [x - half, y, 0], [x + half, y, 0], width, color, alpha);
}

const ACCIDENTAL = { '-1': 'flat', 1: 'sharp' };

export function drawAccidental(ctx, view, layout, note, x, color, alpha) {
  const glyph = ACCIDENTAL[note.accidental];
  if (!glyph || alpha <= 0) return;
  drawGlyph(ctx, view, glyph, x - layout.radius - layout.space * 1.15, note.y, layout.space, color, alpha);
}

/** A ring lying on the staff, foreshortened in 3D. */
export function drawRing(ctx, view, x, y, r, width, color, alpha) {
  const p = at(view, x, y, alpha);
  if (!p) return;
  ctx.save();
  if (onPlane(ctx, view, x, y)) {
    ctx.globalAlpha = p.a;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/** A soft light around a point; on dark palettes it adds light, on light ones it tints. In 3D a beam rises from it. */
export function drawGlow(ctx, view, palette, x, y, size, color, alpha) {
  const p = at(view, x, y, alpha);
  if (!p) return;
  ctx.globalCompositeOperation = palette.blend;
  const strength = palette.blend === 'lighter' ? 1 : 0.55;
  ctx.globalAlpha = Math.min(1, p.a * strength);
  const s = size * p.s * view.glow;
  ctx.drawImage(glowSprite(color), p.x - s / 2, p.y - s / 2, s, s);
  if (view.depth && view.opacity === 1 && p.a > 0.25) {
    // Up is off the page on the upright staff, off the ground on the floor.
    const top = view.project(...(view.rise ? view.rise(x, y, size * 3.5) : [x, y - size * 3.5]));
    if (top) {
      const beam = ctx.createLinearGradient(p.x, p.y, top.x, top.y);
      beam.addColorStop(0, color);
      beam.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.globalAlpha = Math.min(1, (p.a - 0.25) * 0.5 * strength);
      ctx.strokeStyle = beam;
      ctx.lineCap = 'round';
      ctx.lineWidth = size * 0.16 * p.s;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(top.x, top.y);
      ctx.stroke();
    }
  }
  ctx.globalCompositeOperation = 'source-over';
}

/** A filled disc lying on the staff, foreshortened in 3D: a lit note on the floor. */
export function drawSpot(ctx, view, x, y, r, color, alpha) {
  const p = at(view, x, y, alpha);
  if (!p) return;
  ctx.save();
  if (onPlane(ctx, view, x, y)) {
    ctx.globalAlpha = p.a;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
