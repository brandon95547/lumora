// Glow Lane: notes scroll toward the playhead as rings and burst into light when they sound.
import { burst, held } from '../envelope.js';
import { litColor } from '../palettes.js';
import { drawAccidental, drawDisc, drawGlow, drawLedgers, drawLine, drawRing, scrollPlacement } from './common.js';

export const glowLane = {
  id: 'glow-lane',
  name: 'Glow Lane',
  description: 'Notes glide toward a playhead and flare as they sound.',
  motion: 'scroll',
  draw(ctx, scene, t, palette, view) {
    const { layout } = scene;
    const r = layout.radius;
    const { notes } = scrollPlacement(scene, t, view);
    drawLine(ctx, view, layout, palette, layout.playheadX, 0.55);
    for (const { note, x, alpha } of notes) {
      const color = litColor(palette, note);
      const on = held(note, t);
      const b = burst(note, t);
      const played = t >= note.start;
      const ink = played ? color : palette.idle;
      drawLedgers(ctx, view, layout, note, x, palette.staff, alpha);
      drawAccidental(ctx, view, layout, note, x, ink, alpha * (played ? 0.9 : 0.7));
      if (!played) {
        drawRing(ctx, view, x, note.y, r * 0.86, r * 0.22, palette.idle, alpha);
        continue;
      }
      drawGlow(ctx, view, palette, x, note.y, r * (4 + 5 * b), color, alpha * (0.35 + 0.65 * Math.max(b, on * 0.5)));
      drawDisc(ctx, view, x, note.y, r * (1 + 0.25 * b), color, alpha * (0.45 + 0.55 * Math.max(on, b)));
    }
  },
};
