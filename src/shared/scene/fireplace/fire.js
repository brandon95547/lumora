// The fire in the firebox: logs on a bed of embers, flames rising from them, and the warm light the
// fire throws around it. Flames are soft lights placed from their birth time and a fixed seed,
// so a moment always burns the same way; the fire grows and flickers more as the song builds.
import { noise } from '../envelope.js';
import { rampFrom } from '../flames.js';
import { glowSprite } from '../sprites.js';
import { strokeWorld } from '../view.js';
import { FIRE_X, HEARTH_Y, OPENING, WALL_Z } from './layout.js';

const HEARTH_FIRE = rampFrom('#ffc35a', '#ff4a12');
const BED_Z = WALL_Z - 3.5;

/** How bright the fire burns at t, about 0.6–1.2: a flicker on top of the song's energy. */
export function flickerAt(t, energy) {
  const flicker = 0.9 + 0.06 * Math.sin(t * 7.3) + 0.04 * Math.sin(t * 13.1 + 1) + 0.03 * Math.sin(t * 23.7 + 2);
  return flicker * (0.7 + 0.5 * energy);
}

function glow(ctx, view, point, size, color, alpha) {
  const p = view.project(...point);
  if (!p) return;
  const s = size * p.s;
  if (s < 0.5 || alpha <= 0.01) return;
  ctx.globalAlpha = Math.min(1, alpha * p.fog);
  ctx.drawImage(glowSprite(color), p.x - s / 2, p.y - s / 2, s, s);
}

/** Inside the firebox (clipped to its opening on screen): embers, logs, then the flames. */
export function drawFire(ctx, view, t, heat, opening) {
  ctx.save();
  if (opening) {
    ctx.beginPath();
    opening.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.clip();
  }
  ctx.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 9; k++) {
    glow(ctx, view, [FIRE_X + (k - 4) * 3.2, HEARTH_Y - 2, BED_Z], 9, '#ff5a1a', 0.35 * heat);
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.lineCap = 'round';
  strokeWorld(
    ctx,
    view,
    [FIRE_X - 13, HEARTH_Y - 2.6, BED_Z - 1],
    [FIRE_X + 11, HEARTH_Y - 2.2, BED_Z + 1],
    3.4,
    '#2b160b',
    1,
    1,
  );
  strokeWorld(
    ctx,
    view,
    [FIRE_X - 9, HEARTH_Y - 3.2, BED_Z + 1.5],
    [FIRE_X + 14, HEARTH_Y - 3.6, BED_Z - 1.5],
    3,
    '#3a1e0f',
    1,
    1,
  );
  strokeWorld(
    ctx,
    view,
    [FIRE_X - 4, HEARTH_Y - 5.6, BED_Z],
    [FIRE_X + 6, HEARTH_Y - 5.2, BED_Z + 0.5],
    2.6,
    '#24120a',
    1,
    1,
  );

  // Flames: puffs born along the logs that rise, sway, cool and fade.
  ctx.globalCompositeOperation = 'lighter';
  const rate = 70;
  const life = 0.7 + 0.5 * heat;
  const last = Math.floor(t * rate);
  for (let k = Math.floor((t - life) * rate); k <= last; k++) {
    const age = t - k / rate;
    if (age < 0 || age > life) continue;
    const u = age / life;
    const spread = 26 * (noise(k, 1) - 0.5);
    const rise = (9 + 10 * heat) * age + 4 * age * age;
    const point = [
      FIRE_X + spread * (1 - 0.5 * u) + Math.sin(t * 3 + k) * 1.2 * u,
      HEARTH_Y - 4 - rise * 1.8,
      BED_Z + (noise(k, 2) - 0.5) * 3,
    ];
    const size = (5 + 7 * heat) * (1 - 0.55 * u) * (0.75 + 0.5 * noise(k, 3));
    glow(ctx, view, point, size, HEARTH_FIRE[Math.min(6, Math.floor((0.15 + u * 0.8) * 7))], (1 - u) ** 1.3 * 0.55);
  }
  ctx.restore();
}

/** The fire's light thrown around it, over everything, breathing with the flicker. */
export function drawFirelight(ctx, view, layout, heat) {
  const p = view.project(FIRE_X, OPENING.top + (HEARTH_Y - OPENING.top) * 0.6, WALL_Z - 6);
  if (!p) return;
  const r = Math.max(layout.width, layout.height) * (0.55 + 0.2 * heat);
  const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
  g.addColorStop(0, `rgba(255, 150, 70, ${0.22 * heat})`);
  g.addColorStop(0.4, `rgba(255, 120, 50, ${0.08 * heat})`);
  g.addColorStop(1, 'rgba(255, 120, 50, 0)');
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 1;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, layout.width, layout.height);
  ctx.globalCompositeOperation = 'source-over';
}

/** The fire as a polished surface below mirrors it: a warm glow where the flames are. */
export function drawFireGlow(ctx, view, heat) {
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, view, [FIRE_X, HEARTH_Y - 8, WALL_Z - 4], 34 * heat, '#ff7a2a', 0.5 * view.opacity * heat);
  glow(ctx, view, [FIRE_X, HEARTH_Y - 5, WALL_Z - 4], 16 * heat, '#ffd27a', 0.7 * view.opacity * heat);
  ctx.globalCompositeOperation = 'source-over';
}
