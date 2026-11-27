// Constellation: played notes become stars joined by lines, with sparks drifting off each onset.
import { burst, held, noise } from '../envelope.js';
import { litColor } from '../palettes.js';
import { drawAccidental, drawDisc, drawGlow, drawLedgers, drawSparkle, drawStroke, pagePlacement } from './common.js';

const SPARKS = 7;
const SPARK_SECONDS = 1.3;
const LINK_SECONDS = 1.6; // notes further apart in time are not joined

export const constellation = {
  id: 'constellation',
  name: 'Constellation',
  description: 'Played notes turn to stars and join into constellations.',
  motion: 'page',
  draw(ctx, scene, t, palette, view) {
    const { layout } = scene;
    const r = layout.radius;
    const page = pagePlacement(scene, t);
    const played = page.notes.filter((p) => t >= p.note.start);

    // Lines between each hand's consecutive notes.
    for (const clef of ['treble', 'bass']) {
      const hand = played.filter((p) => p.note.clef === clef);
      for (let i = 1; i < hand.length; i++) {
        const a = hand[i - 1];
        const b = hand[i];
        if (b.note.start - a.note.start > LINK_SECONDS) continue;
        const grow = Math.min(1, (t - b.note.start) / 0.25);
        const toX = a.x + (b.x - a.x) * grow;
        const toY = a.note.y + (b.note.y - a.note.y) * grow;
        drawStroke(
          ctx,
          view,
          a.x,
          a.note.y,
          toX,
          toY,
          Math.max(2, r * 0.12),
          litColor(palette, b.note),
          page.alpha * 0.45,
        );
      }
    }

    for (const { note, x, alpha } of page.notes) {
      const color = litColor(palette, note);
      drawLedgers(ctx, view, layout, note, x, palette.staff, alpha * 0.8);
      if (t < note.start) {
        drawDisc(ctx, view, x, note.y, r * 0.4, palette.idle, alpha * 0.8);
        continue;
      }
      drawAccidental(ctx, view, layout, note, x, color, alpha * 0.8);
      const b = burst(note, t);
      const on = held(note, t);
      const age = t - note.start;
      if (age < SPARK_SECONDS) {
        const p = age / SPARK_SECONDS;
        for (let k = 0; k < SPARKS; k++) {
          const angle = noise(note.index, k) * Math.PI * 2;
          const dist = r * (1.2 + 3.5 * noise(note.index, k + 9)) * Math.sqrt(p);
          const sx = x + Math.cos(angle) * dist;
          const sy = note.y + Math.sin(angle) * dist - p * r * 2;
          drawDisc(ctx, view, sx, sy, r * 0.12 * (1 - p) + 1, color, alpha * (1 - p));
        }
      }
      drawGlow(ctx, view, palette, x, note.y, r * (3.5 + 5 * b), color, alpha * (0.35 + 0.65 * Math.max(b, on * 0.5)));
      drawSparkle(ctx, view, x, note.y, r * (1.1 + 0.9 * b), color, alpha * (0.7 + 0.3 * on));
      drawDisc(ctx, view, x, note.y, r * 0.3, '#ffffff', alpha * (0.4 + 0.6 * Math.max(b, on * 0.6)));
    }
  },
};
