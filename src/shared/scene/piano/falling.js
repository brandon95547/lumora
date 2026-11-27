// Falling Notes: bars of light run toward the keys and press them as they land, like a piano lesson.
import { drawAmbient } from '../ambient.js';
import { noise } from '../envelope.js';
import { litColor } from '../palettes.js';
import { notesBetween } from '../scene.js';
import { glowSprite, withAlpha } from '../sprites.js';
import { fillPolygon, strokeWorld } from '../view.js';
import { drawInstrument } from './instrument.js';
import { isBlack, KEY, pitchOfWhite, whiteIndex } from './keyboard.js';
import { keysDown, runwayOf } from './model.js';

const L = KEY.length;
const LANE_Y = -0.02;
const SPARKS = 5;
const SPARK_SECONDS = 0.6;

function drawRunway(ctx, view, model, runway, palette) {
  const far = L + runway.length;
  const W = model.whites;
  fillPolygon(
    ctx,
    view,
    [
      [0, LANE_Y, L],
      [W, LANE_Y, L],
      [W, LANE_Y, far],
      [0, LANE_Y, far],
    ],
    palette.blend === 'lighter' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(60, 40, 20, 0.05)',
  );
  // A guide line at every C and F, as on a lesson roll.
  const first = whiteIndex(model.keys[0].pitch);
  for (let i = 0; i <= W; i++) {
    const pc = pitchOfWhite(first + i) % 12;
    if (pc !== 0 && pc !== 5) continue;
    strokeWorld(ctx, view, [i, LANE_Y, L], [i, LANE_Y, far], 0.025, palette.staff, pc === 0 ? 0.6 : 0.3);
  }
  strokeWorld(ctx, view, [0, LANE_Y, L], [W, LANE_Y, L], 0.06, palette.lit[0], 0.8);
}

function drawBars(ctx, view, scene, model, runway, palette, t) {
  const speed = runway.length / runway.seconds;
  const far = L + runway.length;
  const landing = [];
  for (const note of notesBetween(scene, t, t + runway.seconds)) {
    const key = model.byPitch.get(note.pitch);
    if (!key) continue;
    const z0 = L + Math.max(0, note.start - t) * speed;
    const z1 = Math.min(far, L + (note.end - t) * speed);
    if (z1 <= z0) continue;
    const inset = isBlack(note.pitch) ? 0.02 : 0.12;
    const x0 = key.x0 + inset;
    const x1 = key.x1 - inset;
    const color = litColor(palette, note);
    const sounding = t >= note.start;
    fillPolygon(
      ctx,
      view,
      [
        [x0, LANE_Y, z0],
        [x1, LANE_Y, z0],
        [x1, LANE_Y, z1],
        [x0, LANE_Y, z1],
      ],
      color,
      sounding ? 1 : 0.85,
    );
    // A lighter core down the middle gives the bar some roundness.
    const mid = (x0 + x1) / 2;
    const core = (x1 - x0) * 0.18;
    fillPolygon(
      ctx,
      view,
      [
        [mid - core, LANE_Y, z0],
        [mid + core, LANE_Y, z0],
        [mid + core, LANE_Y, z1],
        [mid - core, LANE_Y, z1],
      ],
      withAlpha('#ffffff', 0.28),
    );
    if (sounding) landing.push({ note, x: mid });
  }
  return landing;
}

/** Light and sparks where each bar meets its key. */
function drawImpacts(ctx, view, landing, palette, t) {
  ctx.globalCompositeOperation = palette.blend;
  const strength = palette.blend === 'lighter' ? 1 : 0.5;
  for (const { note, x } of landing) {
    const color = litColor(palette, note);
    const p = view.project(x, -0.2, L);
    if (!p) continue;
    const size = 4.5 * p.s * view.glow;
    ctx.globalAlpha = 0.85 * strength * p.fog;
    ctx.drawImage(glowSprite(color), p.x - size / 2, p.y - size / 2, size, size);
    const age = t - note.start;
    if (age > SPARK_SECONDS) continue;
    const k = age / SPARK_SECONDS;
    for (let i = 0; i < SPARKS; i++) {
      const s = view.project(
        x + (noise(note.index, i) - 0.5) * 1.4,
        -k * (1.5 + 2.5 * noise(note.index, i + 7)),
        L - 0.2,
      );
      if (!s) continue;
      const r = 0.5 * s.s * (1 - k);
      ctx.globalAlpha = (1 - k) * strength * s.fog;
      ctx.drawImage(glowSprite(color), s.x - r, s.y - r, 2 * r, 2 * r);
    }
  }
  ctx.globalCompositeOperation = 'source-over';
}

export const falling = {
  id: 'piano-falling',
  name: 'Falling Notes',
  description: 'Bars of light run to the keys and press them as they land.',
  falling: true,
  draw(ctx, scene, t, palette, view, model) {
    const { layout } = scene;
    const runway = runwayOf(scene);
    drawAmbient(ctx, scene, t, palette, layout.width / 2, runway.keyFront);
    drawRunway(ctx, view, model, runway, palette);
    const landing = drawBars(ctx, view, scene, model, runway, palette, t);
    drawInstrument(ctx, view, model, keysDown(scene, t), palette, {
      fallboard: false,
      tint: 0.6,
      light: 0.5,
      lightAtBack: true,
    });
    drawImpacts(ctx, view, landing, palette, t);
  },
};
