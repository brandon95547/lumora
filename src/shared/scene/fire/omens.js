// The Gothic omens: lightning on the mightiest landings, bats scattering from them, ash falling
// and mist hanging over the floor. All seeded from the song, so every frame is the same each time.
import { noise } from '../envelope.js';
import { energyAt } from '../energy.js';

const strikesOf = new WeakMap();

/** The landings mighty enough to call down lightning: the hardest-struck at the hottest moments. */
export function strikes(scene, runs) {
  let list = strikesOf.get(runs[0]);
  if (list) return list;
  const all = runs.flatMap((run) =>
    run.landings.map((l) => ({ l, power: l.force * (0.4 + 0.6 * energyAt(scene, l.time)) })),
  );
  const sorted = all.map((s) => s.power).sort((a, b) => b - a);
  const bar = Math.max(0.45, sorted[Math.floor(sorted.length * 0.08)] ?? 1);
  // At most one strike every two seconds.
  list = [];
  for (const s of all.filter((s) => s.power >= bar).sort((a, b) => a.l.time - b.l.time)) {
    if (!list.length || s.l.time - list[list.length - 1].time > 2) list.push(s.l);
  }
  strikesOf.set(runs[0], list);
  return list;
}

/** How bright the lightning is at t (0–1): a flash, a flicker, then dark. */
export function lightningAt(list, t) {
  let flash = 0;
  for (const l of list) {
    const age = t - l.time;
    if (age < 0 || age > 0.5) continue;
    flash = Math.max(flash, Math.exp(-age * 14) + 0.6 * Math.exp(-Math.abs(age - 0.12) * 40));
  }
  return Math.min(1, flash);
}

/** A jagged bolt from the top of the frame, seeded by its strike, and the flash over everything. */
export function drawLightning(ctx, layout, list, t) {
  const flash = lightningAt(list, t);
  if (flash <= 0.01) return;
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.35 * flash;
  ctx.fillStyle = '#b8c8ff';
  ctx.fillRect(0, 0, layout.width, layout.height);
  for (const l of list) {
    const age = t - l.time;
    if (age < 0 || age > 0.22) continue;
    const seed = l.index + l.time;
    let x = layout.width * (0.2 + 0.6 * noise(seed, 1));
    let y = 0;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let k = 1; k <= 9; k++) {
      x += (noise(seed, k + 2) - 0.5) * layout.width * 0.09;
      y += layout.height * 0.045;
      ctx.lineTo(x, y);
    }
    for (const [width, alpha] of [
      [14, 0.25],
      [4, 0.9],
    ]) {
      ctx.globalAlpha = alpha * (1 - age / 0.22);
      ctx.strokeStyle = '#e6ecff';
      ctx.lineWidth = width;
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  }
  ctx.globalCompositeOperation = 'source-over';
}

const BATS = 7;
const BAT_SECONDS = 2.6;

/** Bats bursting up out of the stone at each strike, wings beating, flying off into the vault. */
export function drawBats(ctx, view, list, t) {
  ctx.fillStyle = '#050407';
  for (const l of list) {
    const age = t - l.time;
    if (age < 0 || age > BAT_SECONDS) continue;
    for (let k = 0; k < BATS; k++) {
      const vx = (noise(l.index, k) - 0.3) * 8;
      const vy = -(5 + 6 * noise(l.index, k + 11));
      const vz = (noise(l.index, k + 23) - 0.5) * 14;
      const p = view.project(l.x + vx * age, l.y + vy * age + Math.sin(age * 3 + k) * 0.8, l.z + vz * age);
      if (!p) continue;
      const w = 1.1 * p.s;
      const h = 0.7 * p.s;
      const flap = Math.sin(t * 24 + k * 1.7);
      ctx.globalAlpha = p.fog * Math.min(1, (BAT_SECONDS - age) * 1.5);
      ctx.beginPath();
      for (const side of [-1, 1]) {
        ctx.moveTo(p.x, p.y);
        ctx.quadraticCurveTo(p.x + side * w * 0.5, p.y - h * (0.3 + flap), p.x + side * w, p.y - h * flap);
        ctx.quadraticCurveTo(p.x + side * w * 0.75, p.y + h * 0.1, p.x + side * w * 0.5, p.y + h * 0.2);
        ctx.quadraticCurveTo(p.x + side * w * 0.25, p.y + h * 0.05, p.x, p.y + h * 0.35);
      }
      ctx.fill();
    }
  }
}

/** Ash drifting down through the frame; more of it as the fire grows. */
export function drawAsh(ctx, layout, t, heat) {
  const count = Math.round(25 + 55 * heat);
  ctx.fillStyle = '#b9b2a8';
  for (let k = 0; k < count; k++) {
    const cycle = 7 + 6 * noise(k, 7);
    const phase = (t / cycle + noise(k, 8)) % 1;
    const x = layout.width * noise(k, 9) + Math.sin(t * 0.6 + k) * 30;
    const y = layout.height * (phase * 1.1 - 0.05);
    ctx.globalAlpha = 0.35 * Math.sin(phase * Math.PI);
    ctx.fillRect(x, y, 2 + 2 * noise(k, 10), 2 + 2 * noise(k, 10));
  }
}

/** Low mist drifting over the floor of the nave. */
export function drawMist(ctx, layout, t) {
  for (let k = 0; k < 5; k++) {
    const x = layout.width * (((noise(k, 30) + t * 0.012 * (1 + k * 0.3)) % 1.4) - 0.2);
    const y = layout.height * (0.72 + 0.2 * noise(k, 31));
    const r = layout.width * (0.35 + 0.25 * noise(k, 32));
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, 0.22);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, 'rgba(150, 165, 195, 0.13)');
    g.addColorStop(1, 'rgba(150, 165, 195, 0)');
    ctx.fillStyle = g;
    ctx.globalAlpha = 1;
    ctx.fillRect(-r, -r, 2 * r, 2 * r);
    ctx.restore();
  }
}
