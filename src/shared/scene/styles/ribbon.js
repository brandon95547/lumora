// Ribbon: each note trails a bar as long as it is held, lit up to the playhead.
import { burst, held } from '../envelope.js';
import { litColor } from '../palettes.js';
import { drawAccidental, drawDisc, drawGlow, drawLedgers, drawLine, scrollPlacement } from './common.js';

function bar(ctx, x0, x1, y, h, color, alpha) {
  if (x1 <= x0 || alpha <= 0) return;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x0, y - h / 2, x1 - x0, h, h / 2);
  ctx.fill();
}

export const ribbon = {
  id: 'ribbon',
  name: 'Ribbon',
  description: 'Every note draws a ribbon of light as long as it is held.',
  draw(ctx, scene, t, palette) {
    const { layout } = scene;
    const r = layout.radius;
    const { notes, xAt } = scrollPlacement(scene, t);
    const h = r * 1.1;
    drawLine(ctx, layout, palette, layout.playheadX, 0.5);
    for (const { note, x, alpha } of notes) {
      const color = litColor(palette, note);
      const endX = Math.min(xAt(note.end) + note.dx, layout.noteRight);
      const startX = Math.max(x, layout.noteLeft);
      const fade = Math.max(alpha, endX > layout.playheadX ? 1 : 0) * Math.min(1, (endX - layout.noteLeft) / r);
      const split = Math.max(startX, Math.min(endX, layout.playheadX));
      drawLedgers(ctx, layout, note, x, palette.staff, alpha);
      bar(ctx, split, endX, note.y, h, palette.idle, fade * 0.45);
      bar(ctx, startX, split, note.y, h, color, fade * (0.35 + 0.4 * held(note, t)));
      const b = burst(note, t);
      const played = t >= note.start;
      drawAccidental(ctx, layout, note, x, played ? color : palette.idle, alpha * 0.8);
      if (played && t <= note.end + 0.4) {
        const tipX = Math.min(layout.playheadX, endX);
        drawGlow(ctx, palette, tipX, note.y, r * (3.5 + 4 * b), color, held(note, t) * 0.8 + b * 0.4);
      }
      drawDisc(ctx, x, note.y, r, played ? color : palette.idle, alpha * (played ? 0.9 : 0.7));
    }
  },
};
