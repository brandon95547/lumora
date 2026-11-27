// What the styles share: where a note is at time t (scrolling or paged) and how its parts are drawn.
import { drawGlyph } from '../backdrop.js';
import { notesBetween } from '../scene.js';
import { glowSprite } from '../sprites.js';

/** Scrolling: notes travel right to left and reach the playhead as they sound. */
export function scrollPlacement(scene, t) {
  const { layout } = scene;
  const pps = layout.pixelsPerSecond;
  const behind = (layout.playheadX - layout.noteLeft) / pps;
  const ahead = (layout.noteRight - layout.playheadX) / pps;
  const xAt = (time) => layout.playheadX + (time - t) * pps;
  const notes = notesBetween(scene, t - behind - 0.3, t + ahead + 0.3).map((n) => ({
    note: n,
    x: xAt(n.start) + n.dx,
    alpha: edgeFade(layout, xAt(n.start) + n.dx),
  }));
  return { notes, xAt };
}

/** Fades notes in at the right edge and out at the left, so nothing pops. */
function edgeFade(layout, x) {
  const span = layout.space * 2.5;
  const a = Math.min((x - layout.noteLeft) / span, (layout.noteRight - x) / span);
  return Math.max(0, Math.min(1, a));
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

export function drawLedgers(ctx, layout, note, x, color, alpha) {
  if (!note.ledgers.length || alpha <= 0) return;
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, layout.space * 0.06);
  const half = layout.radius * 1.55;
  ctx.beginPath();
  for (const y of note.ledgers) {
    ctx.moveTo(x - half, Math.round(y) + 0.5);
    ctx.lineTo(x + half, Math.round(y) + 0.5);
  }
  ctx.stroke();
}

const ACCIDENTAL = { '-1': 'flat', 1: 'sharp' };

export function drawAccidental(ctx, layout, note, x, color, alpha) {
  const glyph = ACCIDENTAL[note.accidental];
  if (!glyph || alpha <= 0) return;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  drawGlyph(ctx, glyph, x - layout.radius - layout.space * 1.15, note.y, layout.space);
}

export function drawDisc(ctx, x, y, r, color, alpha) {
  if (alpha <= 0) return;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

export function drawRing(ctx, x, y, r, width, color, alpha) {
  if (alpha <= 0) return;
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
}

/** A soft light around a point; on dark palettes it adds light, on light ones it tints. */
export function drawGlow(ctx, palette, x, y, size, color, alpha) {
  if (alpha <= 0.01) return;
  ctx.globalCompositeOperation = palette.blend;
  ctx.globalAlpha = Math.min(1, alpha * (palette.blend === 'lighter' ? 1 : 0.55));
  ctx.drawImage(glowSprite(color), x - size / 2, y - size / 2, size, size);
  ctx.globalCompositeOperation = 'source-over';
}

/** The vertical line where notes light: a scroll's playhead or a page's sweep. */
export function drawLine(ctx, layout, palette, x, alpha) {
  if (alpha <= 0) return;
  const top = layout.grandTop - layout.space * 2;
  const bottom = layout.grandBottom + layout.space * 2;
  const g = ctx.createLinearGradient(0, top, 0, bottom);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.2, palette.lit[0]);
  g.addColorStop(0.8, palette.lit[palette.lit.length > 2 ? 8 : 1]);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.fillRect(x - 1.5, top, 3, bottom - top);
}
