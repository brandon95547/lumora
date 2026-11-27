// The one shape every part of the app uses for a note:
// { pitch: MIDI number, start: seconds, end: seconds, velocity: 0–1, hand?: 'left' | 'right' }.
// `hand` is there only when the file said which hand plays the note (a score's staff, a MIDI track).

/** Pitches from middle C up go on the treble staff, the rest on the bass staff; also where the hands start. */
export const HAND_SPLIT = 60;

const PIANO_LOW = 21; // A0
const PIANO_HIGH = 108; // C8
const SHORTEST = 0.03;
const HANDS = new Set(['left', 'right']);

/** Keeps the notes a piano can play, drops empty ones, and sorts them by start (then pitch). */
export function normalizeNotes(raw) {
  return raw
    .filter((n) => Number.isFinite(n.start) && Number.isFinite(n.end) && n.pitch >= PIANO_LOW && n.pitch <= PIANO_HIGH)
    .map((n) => ({
      pitch: Math.round(n.pitch),
      start: Math.max(0, n.start),
      end: Math.max(n.start + SHORTEST, n.end),
      velocity: Math.min(1, Math.max(0, n.velocity ?? 0.8)),
      ...(HANDS.has(n.hand) && { hand: n.hand }),
    }))
    .sort((a, b) => a.start - b.start || a.pitch - b.pitch);
}

/** Index of the first note whose start is at or after `time` (notes sorted by start). */
export function firstStartingAt(notes, time) {
  let lo = 0;
  let hi = notes.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (notes[mid].start < time) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
