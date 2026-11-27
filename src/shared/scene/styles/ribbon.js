// Ribbon: each note trails a bar as long as it is held, lit up to the playhead.
import { burst, held } from '../envelope.js';
import { litColor } from '../palettes.js';
import { drawAccidental, drawBar, drawDisc, drawGlow, drawLedgers, drawLine, scrollPlacement } from './common.js';

export const ribbon = {
  id: 'ribbon',
  name: 'Ribbon',
  description: 'Every note draws a ribbon of light as long as it is held.',
  motion: 'scroll',
  draw(ctx, scene, t, palette, view) {
    const { layout } = scene;
    const r = layout.radius;
    const { notes, xAt } = scrollPlacement(scene, t, view);
    const h = r * 1.1;
    drawLine(ctx, view, layout, palette, layout.playheadX, 0.5);
    for (const { note, x, alpha } of notes) {
      const color = litColor(palette, note);
      const endX = Math.min(xAt(note.end) + note.dx, view.noteRight);
      const startX = Math.max(x, view.noteLeft);
      const fade = Math.max(alpha, endX > layout.playheadX ? 1 : 0) * Math.min(1, (endX - view.noteLeft) / r);
      const split = Math.max(startX, Math.min(endX, layout.playheadX));
      drawLedgers(ctx, view, layout, note, x, palette.staff, alpha);
      drawBar(ctx, view, split, endX, note.y, h, palette.idle, fade * 0.45);
      drawBar(ctx, view, startX, split, note.y, h, color, fade * (0.35 + 0.4 * held(note, t)));
      const b = burst(note, t);
      const played = t >= note.start;
      drawAccidental(ctx, view, layout, note, x, played ? color : palette.idle, alpha * 0.8);
      if (played && t <= note.end + 0.4) {
        const tipX = Math.min(layout.playheadX, endX);
        drawGlow(ctx, view, palette, tipX, note.y, r * (3.5 + 4 * b), color, held(note, t) * 0.8 + b * 0.4);
      }
      drawDisc(ctx, view, x, note.y, r, played ? color : palette.idle, alpha * (played ? 0.9 : 0.7));
    }
  },
};
