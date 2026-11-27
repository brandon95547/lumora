// How fiercely the fire burns at t, 0–1. It follows the music (how many notes, how hard) and climbs
// across the song, so a quiet bridge cools the fire and the finale burns hottest. Worked out once
// per song at 20 samples a second; frames read it back.

const RATE = 20;
const MEMORY = 1.2; // seconds a note keeps adding heat
const RISE = 0.25; // seconds to heat up
const FALL = 1.6; // seconds to cool down

const curves = new WeakMap();

function curveOf(scene) {
  let curve = curves.get(scene);
  if (curve) return curve;
  const count = Math.ceil(scene.duration * RATE) + 1;
  const raw = new Float32Array(count);
  for (const note of scene.items) {
    const first = Math.ceil(note.start * RATE);
    for (let i = first; i < count && i < first + MEMORY * RATE * 4; i++) {
      raw[i] += note.velocity * Math.exp(-(i / RATE - note.start) / MEMORY);
    }
  }
  // The busiest passages set the scale (90th percentile, so one spike can't flatten the rest).
  const sorted = [...raw].sort((a, b) => a - b);
  const scale = sorted[Math.floor(sorted.length * 0.9)] || 1;
  curve = new Float32Array(count);
  let level = 0;
  for (let i = 0; i < count; i++) {
    const target = Math.min(1, raw[i] / scale);
    const rate = target > level ? 1 / (RISE * RATE) : 1 / (FALL * RATE);
    level += (target - level) * Math.min(1, rate);
    const progress = i / Math.max(1, count - 1);
    curve[i] = Math.min(1, level * (0.55 + 0.45 * progress) + 0.2 * progress);
  }
  curves.set(scene, curve);
  return curve;
}

export function energyAt(scene, t) {
  const curve = curveOf(scene);
  const f = Math.max(0, Math.min(curve.length - 1, t * RATE));
  const i = Math.floor(f);
  const next = curve[Math.min(curve.length - 1, i + 1)];
  return curve[i] + (next - curve[i]) * (f - i);
}
