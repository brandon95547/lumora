// Where a hand's ball is at time t in Marble Walk: it hops from note to note along the staff,
// landing on each of its hand's notes exactly as it sounds (a chord is one landing, on its top note
// for the right hand and its bottom note for the left, the melody and the bass). Worked out once
// per scene and hand; reading it is a pure function of t.

const CHORD = 0.05; // notes starting this close together are one landing
const LONGEST_HOP = 0.9; // seconds: after a longer rest the ball waits on its note, then hops
const DROP = 0.6; // seconds the ball falls in before its first note

const paths = new WeakMap();

/** A hand's landings: when, on which note, at what height on the staff. */
export function bouncePath(scene, hand) {
  let byHand = paths.get(scene);
  if (!byHand) paths.set(scene, (byHand = {}));
  if (byHand[hand]) return byHand[hand];
  const landings = [];
  for (const note of scene.items) {
    if (note.hand !== hand) continue;
    const last = landings[landings.length - 1];
    if (last && note.start - last.time < CHORD) {
      const outer = hand === 'right' ? note.pitch > last.note.pitch : note.pitch < last.note.pitch;
      if (outer) Object.assign(last, { note, y: note.y });
      last.notes.push(note);
    } else {
      landings.push({ time: note.start, note, y: note.y, notes: [note] });
    }
  }
  return (byHand[hand] = landings);
}

/** The first landing after `t` (binary search). */
function nextIndex(landings, t) {
  let lo = 0;
  let hi = landings.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (landings[mid].time <= t) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * The ball at time t: `y` across the staff, `height` above it (0 on landing), the note it is
 * heading for (its color), and `hop` in 0–1 through the current hop. Null when the hand has no notes.
 */
export function ballAt(landings, t, { space, pixelsPerSecond }) {
  if (!landings.length) return null;
  const i = nextIndex(landings, t);
  const to = landings[i];
  const from = landings[i - 1] ?? { time: landings[0].time - DROP, y: landings[0].y, note: landings[0].note };
  if (!to) return { y: from.y, height: 0, note: from.note, hop: 1 };
  const duration = Math.min(to.time - from.time, LONGEST_HOP);
  const leave = to.time - duration;
  if (t < leave) return { y: from.y, height: 0, note: from.note, hop: 0 };
  const u = (t - leave) / duration;
  const top = Math.min(space * 6, Math.max(space * 0.8, duration * pixelsPerSecond * 0.7));
  // The first note is fallen onto, not hopped to.
  const arc = i === 0 ? 1 - u * u : 4 * u * (1 - u);
  return { y: from.y + (to.y - from.y) * u, height: top * arc, note: to.note, hop: u };
}
