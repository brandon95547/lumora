// The fireball's run: one landing per beat of the music, each on its own ledge, worked out once
// per song. Between landings the ball flies a parabola, so a frame depends only on its time.
// World units: about one ball across. x runs forward along the run, y downward, z to the side.

const MIN_GAP = 0.11; // notes closer than this share one landing
const STEP = 5; // forward distance per landing, at least
const SPEED = 5.5; // more forward distance for longer gaps, per second
const PITCH_RISE = 0.16; // ledge height per semitone (higher melody, higher ledge)
const HEIGHT = 7; // ledges stay within ± this
const WEAVE = 5; // how far the run swings side to side (seen in 3D)
const LEAD_IN = 0.9; // the ball drops in this long before the first landing

const runs = new WeakMap();

/** The song's landings and ledges, worked out once per scene. */
export function runOf(scene) {
  let run = runs.get(scene);
  if (run) return run;
  // Group notes into landings: a chord, or a quick run of notes, is one landing.
  const groups = [];
  for (const note of scene.items) {
    const last = groups[groups.length - 1];
    if (last && note.start - last.time < MIN_GAP) {
      last.top = Math.max(last.top, note.pitch);
      last.force = Math.max(last.force, note.velocity);
      last.notes.push(note);
    } else {
      groups.push({ time: note.start, top: note.pitch, force: note.velocity, notes: [note] });
    }
  }
  const pitches = groups.map((g) => g.top).sort((a, b) => a - b);
  const middle = pitches.length ? pitches[pitches.length >> 1] : 60;
  let x = 0;
  const landings = groups.map((g, i) => {
    const gap = i ? g.time - groups[i - 1].time : 1;
    if (i) x += STEP + Math.min(gap, 2) * SPEED;
    return {
      ...g,
      index: i,
      x,
      y: Math.max(-HEIGHT, Math.min(HEIGHT, -(g.top - middle) * PITCH_RISE)),
      z: WEAVE * Math.sin(i * 0.42) * Math.min(1, i / 6),
      size: 3.4 + Math.min(gap, 1.5) * 1.4, // longer notes, bigger ledges
    };
  });
  run = { landings };
  runs.set(scene, run);
  return run;
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
  if (!landings.length) return [0, -2, 0];
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

/** Where the camera looks at t: the ball's path smoothed over a second either way, so it glides. */
export function followAt(run, t) {
  const sum = [0, 0, 0];
  let weight = 0;
  for (let k = -6; k <= 6; k++) {
    const w = 7 - Math.abs(k);
    const p = ballAt(run, t + k * 0.15);
    for (let d = 0; d < 3; d++) sum[d] += p[d] * w;
    weight += w;
  }
  return sum.map((v) => v / weight);
}
