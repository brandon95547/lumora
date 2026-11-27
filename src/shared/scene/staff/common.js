// What the styles share: where a note is at time t (scrolling or paged) and how its parts are drawn.
// Every helper draws through the view, so a style written once is drawn in 2D and in 3D.
import { notesBetween } from '../scene.js';
import { glowSprite, sphereSprite } from '../sprites.js';
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

const PAGE_FADE = 0.18;

/** Paged: one page of notes sits still while a sweep crosses it, then the next page fades in. */
export function pagePlacement(scene, t) {
  const { layout } = scene;
  const seconds = layout.pageSeconds;
  const page = Math.max(0, Math.floor(t / seconds));
  const pageStart = page * seconds;
  const pageEnd = pageStart + seconds;
  const pad = layout.space * 1.2;
  const width = layout.noteRight - layout.noteLeft - 2 * pad;
  const xAt = (time) => layout.noteLeft + pad + ((time - pageStart) / seconds) * width;
  const fadeIn = Math.min(1, (t - pageStart) / PAGE_FADE);
  const fadeOut = Math.min(1, (pageEnd - t) / PAGE_FADE);
  const alpha = Math.max(0, Math.min(fadeIn, fadeOut));
  const notes = notesBetween(scene, pageStart, pageEnd)
    .filter((n) => n.start >= pageStart && n.start < pageEnd)
    .map((n) => ({ note: n, x: xAt(n.start) + n.dx, alpha }));
  return { notes, xAt, sweepX: xAt(t), alpha, pageStart, pageEnd };
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

/** A note's body: a flat disc in 2D, a lit glass ball in 3D. */
export function drawDisc(ctx, view, x, y, r, color, alpha) {
  const p = at(view, x, y, alpha);
  if (!p) return;
  ctx.globalAlpha = p.a;
  if (view.depth) {
    const size = 2 * r * p.s;
    ctx.drawImage(sphereSprite(color), p.x - size / 2, p.y - size / 2, size, size);
    return;
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();
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

/** A bar along the staff from x0 to x1 at height y, with round ends. */
export function drawBar(ctx, view, x0, x1, y, h, color, alpha) {
  if (x1 <= x0 || alpha <= 0) return;
  const a = at(view, x0, y, alpha);
  const b = at(view, x1, y, alpha);
  if (!a || !b) return;
  ctx.globalAlpha = Math.min(a.a, b.a);
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = h * (a.s + b.s) * 0.5;
  ctx.beginPath();
  ctx.moveTo(a.x + (h / 2) * a.s, a.y);
  ctx.lineTo(Math.max(a.x + (h / 2) * a.s, b.x - (h / 2) * b.s), b.y);
  ctx.stroke();
}

/** A straight stroke between two points on the staff. */
export function drawStroke(ctx, view, ax, ay, bx, by, width, color, alpha) {
  const a = at(view, ax, ay, alpha);
  const b = at(view, bx, by, alpha);
  if (!a || !b) return;
  ctx.globalAlpha = Math.min(a.a, b.a);
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = width * (a.s + b.s) * 0.5;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

/** A four-pointed star facing the camera. */
export function drawSparkle(ctx, view, x, y, size, color, alpha) {
  const p = at(view, x, y, alpha);
  if (!p) return;
  const s = size * p.s;
  ctx.globalAlpha = p.a;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - s);
  ctx.quadraticCurveTo(p.x, p.y, p.x + s, p.y);
  ctx.quadraticCurveTo(p.x, p.y, p.x, p.y + s);
  ctx.quadraticCurveTo(p.x, p.y, p.x - s, p.y);
  ctx.quadraticCurveTo(p.x, p.y, p.x, p.y - s);
  ctx.fill();
}

/** The vertical line where notes light: a scroll's playhead or a page's sweep. */
export function drawLine(ctx, view, layout, palette, x, alpha) {
  const top = at(view, x, layout.grandTop - layout.space * 2, alpha);
  const bottom = at(view, x, layout.grandBottom + layout.space * 2, alpha);
  if (!top || !bottom) return;
  const g = ctx.createLinearGradient(top.x, top.y, bottom.x, bottom.y);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.2, palette.lit[0]);
  g.addColorStop(0.8, palette.lit[palette.lit.length > 2 ? 8 : 1]);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = Math.min(top.a, bottom.a);
  ctx.strokeStyle = g;
  ctx.lineCap = 'butt';
  ctx.lineWidth = 3 * (top.s + bottom.s) * 0.5;
  ctx.beginPath();
  ctx.moveTo(top.x, top.y);
  ctx.lineTo(bottom.x, bottom.y);
  ctx.stroke();
}
