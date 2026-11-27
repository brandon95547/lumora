// Marble Walk's haunting: translucent ghosts that fly across the stage, more of them as the song goes
// on, and now and then a swell of heat over the floor with a faint mist rising from it. Both are
// worked out once per song from its energy, so every frame is the same each time it is drawn.
import { energyAt } from '../energy.js';
import { noise } from '../envelope.js';
import { glowSprite, withAlpha } from '../sprites.js';
import { onPlane } from '../view.js';

// --- Heat --------------------------------------------------------------------------------------

const HEAT_GAP = 8; // seconds at least between swells
const HEAT_RISE = 1.4;
const HEAT_HOLD = 1.6;
const HEAT_FALL = 3;

const heats = new WeakMap();

/** When the floor heats up: the song's most energetic moments, no two closer than HEAT_GAP. */
export function heatSwells(scene) {
  if (heats.has(scene)) return heats.get(scene);
  const step = 0.25;
  const levels = [];
  for (let t = 0; t <= scene.duration; t += step) levels.push({ t, e: energyAt(scene, t) });
  const sorted = levels.map((l) => l.e).sort((a, b) => a - b);
  const bar = Math.max(0.45, sorted[Math.floor(sorted.length * 0.6)] ?? 1);
  const peaks = levels.filter((l, i) => l.e >= bar && l.e >= (levels[i - 1]?.e ?? 0) && l.e >= (levels[i + 1]?.e ?? 0));
  const chosen = [];
  for (const p of peaks.sort((a, b) => b.e - a.e)) {
    if (chosen.every((c) => Math.abs(c.t - p.t) >= HEAT_GAP)) chosen.push(p);
  }
  const swells = chosen.map((c) => ({ peak: c.t, strength: 0.6 + 0.4 * c.e })).sort((a, b) => a.peak - b.peak);
  heats.set(scene, swells);
  return swells;
}

/** How hot the floor is at t, 0–1. */
export function heatAt(scene, t) {
  let heat = 0;
  for (const { peak, strength } of heatSwells(scene)) {
    const from = peak - HEAT_RISE;
    if (t < from || t > peak + HEAT_HOLD + HEAT_FALL) continue;
    const k = t < peak ? (t - from) / HEAT_RISE : t < peak + HEAT_HOLD ? 1 : 1 - (t - peak - HEAT_HOLD) / HEAT_FALL;
    heat = Math.max(heat, strength * Math.sin((Math.PI / 2) * k));
  }
  return heat;
}

const EMBER = '#ff6a2b';

/** The floor glowing with heat around and ahead of the balls. */
export function drawHeat(ctx, view, layout, palette, heat) {
  if (heat <= 0.01) return;
  const x = layout.playheadX + layout.pixelsPerSecond * 1.2;
  const y = (layout.grandTop + layout.grandBottom) / 2;
  const p = view.project(x, y);
  if (!p) return;
  ctx.save();
  if (onPlane(ctx, view, x, y)) {
    const r = layout.width * 1.3;
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, withAlpha(EMBER, 0.5));
    g.addColorStop(0.45, withAlpha(EMBER, 0.16));
    g.addColorStop(1, withAlpha(EMBER, 0));
    ctx.globalCompositeOperation = palette.blend;
    ctx.globalAlpha = heat * p.fog * view.opacity * (palette.blend === 'lighter' ? 0.75 : 0.35);
    ctx.fillStyle = g;
    ctx.fillRect(-r, -r, 2 * r, 2 * r);
  }
  ctx.restore();
}

const MIST = 9;

/** Faint mist hanging low over the floor, drifting slowly across the stage; it rises with the heat. */
export function drawMist(ctx, view, layout, t, heat) {
  const level = 0.25 + 0.75 * heat;
  const { space, pixelsPerSecond: pps } = layout;
  const middle = (layout.grandTop + layout.grandBottom) / 2;
  for (let k = 0; k < MIST; k++) {
    const drift = ((noise(k, 1) + t * (0.01 + 0.012 * noise(k, 2))) % 1.4) - 0.7;
    const x = layout.playheadX + pps * (-0.5 + 6 * noise(k, 3));
    const y = middle + drift * layout.width * 2.4;
    const lift = -space * (0.6 + 1.2 * noise(k, 4) + 1.5 * heat);
    const p = view.project(x, y, lift);
    if (!p) continue;
    const r = layout.width * (0.35 + 0.3 * noise(k, 5)) * p.s;
    const warm = heat > 0.05 ? `rgba(255, 196, 160, ${0.16 * level})` : `rgba(175, 190, 220, ${0.12 * level})`;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(1, 0.24);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, warm);
    g.addColorStop(1, 'rgba(175, 190, 220, 0)');
    ctx.globalAlpha = p.fog * view.opacity;
    ctx.fillStyle = g;
    ctx.fillRect(-r, -r, 2 * r, 2 * r);
    ctx.restore();
  }
}

// --- Ghosts ------------------------------------------------------------------------------------

const ghostLists = new WeakMap();

/**
 * The ghosts of a song: when each sets off, how long it takes to cross, which way, how far ahead of
 * the balls and how high. They begin a little way in and come more often as the song goes on and
 * builds.
 */
export function ghostsOf(scene) {
  if (ghostLists.has(scene)) return ghostLists.get(scene);
  const ghosts = [];
  let t = Math.max(3, scene.duration * 0.08);
  for (let k = 0; t < scene.duration - 2; k++) {
    const progress = t / scene.duration;
    const busy = energyAt(scene, t);
    ghosts.push({
      start: t,
      duration: 5 + 3 * noise(k, 11),
      dir: noise(k, 12) < 0.5 ? 1 : -1,
      ahead: 1.2 + 4.5 * noise(k, 13),
      height: 2.5 + 4 * noise(k, 14),
      size: 0.8 + 0.5 * noise(k, 15),
      seed: k,
    });
    const gap = (9 - 5.5 * progress - 2 * busy) * (0.7 + 0.6 * noise(k, 16));
    t += Math.max(1.8, gap);
  }
  ghostLists.set(scene, ghosts);
  return ghosts;
}

/** Where a ghost is at t on the staff (null when it isn't flying), and how clearly it shows. */
export function ghostAt(ghost, t, layout) {
  const u = (t - ghost.start) / ghost.duration;
  if (u < 0 || u > 1) return null;
  const { space, pixelsPerSecond: pps, width } = layout;
  const middle = (layout.grandTop + layout.grandBottom) / 2;
  const across = width * 1.6;
  return {
    x: layout.playheadX + pps * (ghost.ahead - 0.6 * u) + Math.sin(u * 5 + ghost.seed) * space * 2,
    y: middle + ghost.dir * across * (u - 0.5) + Math.sin(u * 9 + ghost.seed) * space,
    z: -space * (ghost.height + Math.sin(t * 2.2 + ghost.seed) * 0.6),
    clear: Math.min(1, u / 0.12, (1 - u) / 0.15),
  };
}

/** A ghost: a pale, glowing hooded shape with a wavering tail, trailing away from where it flies. */
function drawGhost(ctx, view, layout, palette, ghost, t) {
  const at = ghostAt(ghost, t, layout);
  const ahead = ghostAt(ghost, t + 0.05, layout);
  if (!at || !ahead) return;
  const p = view.project(at.x, at.y, at.z);
  const q = view.project(ahead.x, ahead.y, ahead.z);
  if (!p || !q) return;
  const alpha = at.clear * p.fog * view.opacity * (0.75 + 0.25 * Math.sin(t * 7 + ghost.seed));
  if (alpha <= 0.01) return;
  const size = layout.space * 3.6 * ghost.size * p.s;
  const facing = q.x >= p.x ? 1 : -1;
  const lean = Math.max(-0.35, Math.min(0.35, Math.atan2(q.y - p.y, Math.abs(q.x - p.x) + 1e-6) * 0.5));
  const pale = palette.blend === 'lighter' ? '#e8eeff' : palette.ink;

  ctx.save();
  ctx.globalCompositeOperation = palette.blend;
  ctx.globalAlpha = alpha * 0.22;
  const glow = size * 3.2;
  ctx.drawImage(glowSprite(pale), p.x - glow / 2, p.y - glow / 2, glow, glow);

  ctx.translate(p.x, p.y);
  ctx.scale(facing * size, size);
  ctx.rotate(lean);
  // Hood and body, then a tail streaming back (-x) that waves as it goes.
  const wave = (k) => Math.sin(t * 6 + ghost.seed + k * 1.3) * 0.08;
  ctx.beginPath();
  ctx.moveTo(0.32, -0.1);
  ctx.bezierCurveTo(0.36, -0.62, -0.3, -0.66, -0.3, -0.16);
  ctx.bezierCurveTo(-0.55, 0.0 + wave(1), -0.85, 0.08 + wave(2), -1.25, 0.18 + wave(3));
  ctx.bezierCurveTo(-0.85, 0.3 + wave(4), -0.45, 0.42 + wave(5), -0.1, 0.4);
  ctx.bezierCurveTo(0.12, 0.38, 0.3, 0.25, 0.32, -0.1);
  const body = ctx.createLinearGradient(0.3, 0, -1.25, 0);
  body.addColorStop(0, withAlpha(pale, 0.34));
  body.addColorStop(0.55, withAlpha(pale, 0.12));
  body.addColorStop(1, withAlpha(pale, 0));
  ctx.globalAlpha = alpha;
  ctx.fillStyle = body;
  ctx.fill();
  // Two hollow eyes.
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = alpha * 0.3;
  ctx.fillStyle = palette.background[1];
  for (const ex of [0.02, 0.18]) {
    ctx.beginPath();
    ctx.ellipse(ex, -0.24, 0.045, 0.075, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Every ghost in flight at t, the farthest first. */
export function drawGhosts(ctx, view, layout, palette, scene, t) {
  const flying = ghostsOf(scene)
    .map((g) => ({ g, at: ghostAt(g, t, layout) }))
    .filter((f) => f.at);
  if (view.depth) flying.sort((a, b) => view.depthOf(b.at.x, b.at.y, b.at.z) - view.depthOf(a.at.x, a.at.y, a.at.z));
  for (const { g } of flying) drawGhost(ctx, view, layout, palette, g, t);
}
