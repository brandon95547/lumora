// Marble Walk's balls as the song builds: they catch fire partway through and burn hotter toward
// the end, and on a big chord a beam of light shoots up through the ball. Pure functions of t.
import { energyAt } from '../energy.js';
import { drawBall as drawFireball, drawTrail, rampFrom } from '../flames.js';
import { mixColors, withAlpha } from '../sprites.js';
import { ballAt, bouncePath } from './bounce.js';

// --- Fire --------------------------------------------------------------------------------------

const CATCH = 0.22; // of the way through the song, the first flames
const BLAZE = 0.75; // and by here the balls are fully alight

const smooth = (u) => u * u * (3 - 2 * u);

/** How alight the balls are at t, 0–1: growing through the song, flaring when the music is busiest. */
export function fireAt(scene, t) {
  const u = Math.min(1, Math.max(0, (t / scene.duration - CATCH) / (BLAZE - CATCH)));
  return smooth(u) * (0.65 + 0.35 * energyAt(scene, t));
}

/**
 * The flame drawing works in its own units, with up as -y. This view sets one unit to the ball's
 * radius and turns its up into the staff's (-z, off the floor).
 */
function flameSpace(view, unit) {
  // From straight above (2D), height shows as a shift up the screen, as the ball's hop does.
  const place = view.depth
    ? (x, y, z = 0) => view.project(x * unit, z * unit, y * unit)
    : (x, y, z = 0) => view.project(x * unit, (z + 0.45 * y) * unit);
  // Sizes are in flame units too, so a unit is `unit` times what the staff view measures.
  const project = (x, y, z) => {
    const p = place(x, y, z);
    return p && { ...p, s: p.s * unit };
  };
  return { ...view, project };
}

/**
 * Flames streaming off a ball and a burning glow around it, behind the glass. `place(time)` is where
 * the ball is (staff x, y, z) at a time; `color` is its hand's.
 */
export function drawBallFire(ctx, view, place, t, fire, radius, color, palette) {
  if (fire <= 0.03) return;
  // Real fire, orange to red, with a touch of the hand's own color at its edges.
  const ramp = rampFrom('#ffb347', mixColors('#ff4a12', color, 0.25));
  const space = flameSpace(view, radius);
  const toFlame = ([x, y, z]) => [x / radius, z / radius, y / radius];
  ctx.globalCompositeOperation = palette.blend;
  drawTrail(ctx, space, (time) => toFlame(place(time)), t, fire, 1, ramp);
  const before = ctx.globalAlpha;
  drawFireball(ctx, space, toFlame(place(t)), t, fire, 0.3 + 0.25 * fire, ramp);
  ctx.globalAlpha = before;
  ctx.globalCompositeOperation = 'source-over';
}

// --- Beams -------------------------------------------------------------------------------------

const BIG_CHORD = 3; // notes in one landing
const BEAM_GAP = 3; // seconds at least between one ball's beams
const BEAM_LIFE = 1.3;

const beamLists = new WeakMap();

/** When a hand's ball shoots a beam: its landings on big chords, now and then (not every one). */
export function beamsOf(scene, hand) {
  let byHand = beamLists.get(scene);
  if (!byHand) beamLists.set(scene, (byHand = {}));
  if (byHand[hand]) return byHand[hand];
  const times = [];
  for (const landing of bouncePath(scene, hand)) {
    if (landing.notes.length < BIG_CHORD) continue;
    if (times.length && landing.time - times[times.length - 1] < BEAM_GAP) continue;
    times.push(landing.time);
  }
  return (byHand[hand] = times);
}

/** How bright a hand's beam is at t, 0–1: a flash on the chord, then fading. */
export function beamAt(times, t) {
  let lo = 0;
  let hi = times.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (times[mid] <= t) lo = mid + 1;
    else hi = mid;
  }
  const age = t - (times[lo - 1] ?? -Infinity);
  if (age < 0 || age > BEAM_LIFE) return 0;
  return Math.min(1, age / 0.04) * (1 - age / BEAM_LIFE) ** 1.5;
}

/** A shaft of light rising straight up through the ball's top, `power` 0–1. */
export function drawBeam(ctx, view, layout, palette, point, radius, color, power) {
  if (power <= 0.01) return;
  const [x, y, z] = point;
  const reach = layout.space * 60;
  const base = view.project(x, y, z);
  const top = view.project(...(view.rise ? view.rise(x, y, reach - z) : [x, y - reach]));
  if (!base || !top) return;
  const width = radius * 1.6 * base.s;
  const g = ctx.createLinearGradient(base.x, base.y, top.x, top.y);
  g.addColorStop(0, withAlpha('#ffffff', 0.95));
  g.addColorStop(0.08, withAlpha(color, 0.8));
  g.addColorStop(1, withAlpha(color, 0));
  ctx.globalCompositeOperation = palette.blend;
  ctx.lineCap = 'round';
  ctx.strokeStyle = g;
  for (const [w, a] of [
    [width * 2.6, 0.18],
    [width, 0.55],
    [width * 0.35, 0.9],
  ]) {
    ctx.globalAlpha = a * power * base.fog * view.opacity;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(base.x, base.y);
    ctx.lineTo(top.x, top.y);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
}

/**
 * Where a hand's ball was at `time`, seen in the frame at `now` (staff x, y, z): the floor carries
 * the music toward the camera, so where it was is that much nearer, and its flames stream back.
 */
export function ballPlace(scene, hand, now) {
  const { layout } = scene;
  const r = layout.radius * 1.35;
  const landings = bouncePath(scene, hand);
  return (time) => {
    const b = ballAt(landings, time, layout);
    const x = layout.playheadX + (time - now) * layout.pixelsPerSecond;
    return b ? [x, b.y, -(b.height + r)] : [x, 0, -r];
  };
}
