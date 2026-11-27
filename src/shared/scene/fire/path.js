// The fireballs' runs: one landing per beat of the music, each on its own ledge, worked out once
// per song. Between landings a ball flies a parabola, so a frame depends only on its time.
// World units: about one ball across. x runs forward along the run, y downward, z to the side.
//
// A run follows all the notes ('both'), or one hand's: 'right' (middle C and up) or 'left' (below).
// Every run shares one timeline, so the two hands' fireballs travel forward side by side.

import { HAND_SPLIT } from '../../notes.js';

const MIN_GAP = 0.11; // notes closer than this share one landing
const STEP = 5; // forward distance per landing, at least
const SPEED = 5.5; // more forward distance for longer gaps, per second
const PITCH_RISE = 0.16; // ledge height per semitone (higher melody, higher ledge)
const WEAVE = 5; // how far the run swings side to side (seen in 3D)
const LEAD_IN = 0.9; // a ball drops in this long before its first landing

/** Where each run sits: the hands apart, side by side in 3D and one above the other in 2D. */
const LANES = {
  both: { y: 0, z: 0, height: 7 },
  right: { y: -4, z: -3.5, height: 4 },
  left: { y: 4, z: 3.5, height: 4 },
};

const inHand = { both: () => true, right: (n) => n.pitch >= HAND_SPLIT, left: (n) => n.pitch < HAND_SPLIT };

/** Notes grouped into landings: a chord, or a quick run of notes, is one landing. */
function landingsOf(notes) {
  const groups = [];
  for (const note of notes) {
    const last = groups[groups.length - 1];
    if (last && note.start - last.time < MIN_GAP) {
      last.top = Math.max(last.top, note.pitch);
      last.force = Math.max(last.force, note.velocity);
      last.notes.push(note);
    } else {
      groups.push({ time: note.start, top: note.pitch, force: note.velocity, notes: [note] });
    }
  }
  return groups;
}

/** How far along the run every moment is, from all the notes, so every run keeps the same pace. */
function timelineOf(scene) {
  const times = landingsOf(scene.items).map((g) => g.time);
  const xs = [];
  times.forEach((time, i) => xs.push(i ? xs[i - 1] + STEP + Math.min(time - times[i - 1], 2) * SPEED : 0));
  return (t) => {
    if (!times.length) return t * SPEED;
    if (t <= times[0]) return (t - times[0]) * SPEED;
    const last = times.length - 1;
    if (t >= times[last]) return xs[last] + (t - times[last]) * SPEED;
    let lo = 0;
    let hi = last;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (times[mid] <= t) lo = mid;
      else hi = mid;
    }
    return xs[lo] + ((xs[hi] - xs[lo]) * (t - times[lo])) / (times[hi] - times[lo]);
  };
}

const runs = new WeakMap();

/** A run's landings and ledges, worked out once per scene and hand. */
export function runOf(scene, hand = 'both') {
  let cached = runs.get(scene);
  if (!cached) runs.set(scene, (cached = { xAt: timelineOf(scene) }));
  if (cached[hand]) return cached[hand];
  const lane = LANES[hand];
  const groups = landingsOf(scene.items.filter(inHand[hand]));
  const pitches = groups.map((g) => g.top).sort((a, b) => a - b);
  const middle = pitches.length ? pitches[pitches.length >> 1] : 60;
  const landings = groups.map((g, i) => {
    const gap = i ? g.time - groups[i - 1].time : 1;
    return {
      ...g,
      index: i,
      x: cached.xAt(g.time),
      y: lane.y + Math.max(-lane.height, Math.min(lane.height, -(g.top - middle) * PITCH_RISE)),
      z: lane.z + WEAVE * Math.sin(i * 0.42) * Math.min(1, i / 6),
      size: 3.4 + Math.min(gap, 1.5) * 1.4, // longer notes, bigger ledges
    };
  });
  cached[hand] = { hand, landings };
  return cached[hand];
}

/** Index of the last landing at or before t (-1 before the first). */
export function landingBefore(run, t) {
  let lo = 0;
  let hi = run.landings.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (run.landings[mid].time <= t) lo = mid + 1;
    else hi = mid;
  }
  return lo - 1;
}

/** How high the ball flies between two landings `gap` seconds apart. */
const hop = (gap) => Math.max(1.2, Math.min(7, 1 + gap * 4.5));

/** Where the ball is at t: [x, y, z], resting on top of a ledge at each landing. */
export function ballAt(run, t) {
  const { landings } = run;
  if (!landings.length) return null;
  const i = landingBefore(run, t);
  if (i < 0) {
    // Dropping in from above onto the first ledge.
    const first = landings[0];
    const k = Math.max(0, 1 - (first.time - t) / LEAD_IN);
    return [first.x - 3 * (1 - k), first.y - 14 * (1 - k * k), first.z];
  }
  const a = landings[i];
  const b = landings[i + 1];
  if (!b) return [a.x, a.y, a.z];
  const k = (t - a.time) / (b.time - a.time);
  const lift = hop(b.time - a.time) * 4 * k * (1 - k);
  return [a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k - lift, a.z + (b.z - a.z) * k];
}

/** Where the camera looks at t: the balls' paths smoothed over a second either way, so it glides. */
export function followAt(list, t) {
  const sum = [0, 0, 0];
  let weight = 0;
  for (const run of list) {
    for (let k = -6; k <= 6; k++) {
      const p = ballAt(run, t + k * 0.15);
      if (!p) continue;
      const w = 7 - Math.abs(k);
      for (let d = 0; d < 3; d++) sum[d] += p[d] * w;
      weight += w;
    }
  }
  return weight ? sum.map((v) => v / weight) : [0, 0, 0];
}
