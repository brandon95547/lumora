// Ripple Pages: a page of notes waits on the staff; each sends out rings of light as it sounds.
import { burst, held } from '../envelope.js';
import { litColor } from '../palettes.js';
import { drawAccidental, drawDisc, drawGlow, drawLedgers, drawLine, drawRing, pagePlacement } from './common.js';

const RING_SECONDS = 0.9;

export const ripple = {
  id: 'ripple',
  name: 'Ripple Pages',
  description: 'A page of notes waits on the staff; each one ripples as it plays.',
  motion: 'page',
  draw(ctx, scene, t, palette, view) {
    const { layout } = scene;
    const r = layout.radius;
    const page = pagePlacement(scene, t);
    drawLine(ctx, view, layout, palette, page.sweepX, 0.35 * page.alpha);
    for (const { note, x, alpha } of page.notes) {
      const color = litColor(palette, note);
      const played = t >= note.start;
      drawLedgers(ctx, view, layout, note, x, palette.staff, alpha);
      drawAccidental(ctx, view, layout, note, x, played ? color : palette.idle, alpha * 0.85);
      if (!played) {
        drawDisc(ctx, view, x, note.y, r * 0.9, palette.idle, alpha * 0.75);
        continue;
      }
      const age = t - note.start;
      for (const lag of [0, 0.22]) {
        const p = (age - lag) / RING_SECONDS;
        if (p > 0 && p < 1)
          drawRing(ctx, view, x, note.y, r * (1 + p * 3.2), r * 0.16 * (1 - p), color, alpha * (1 - p));
      }
      const b = burst(note, t);
      const on = held(note, t);
      drawGlow(ctx, view, palette, x, note.y, r * (3 + 4 * b), color, alpha * (0.3 + 0.7 * Math.max(b, on * 0.45)));
      drawDisc(ctx, view, x, note.y, r * (1 + 0.2 * b), color, alpha * (0.6 + 0.4 * Math.max(on, b)));
    }
  },
};
