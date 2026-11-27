// Which hand plays each note. A note whose file said (a score's staff, a MIDI track) keeps that
// hand. The rest are worked out: a fixed line at middle C gets it wrong whenever a hand crosses it,
// so instead each hand's position is followed through the song, and every chord is divided between
// the hands by how close each note is to where that hand has just been, how far a hand can stretch,
// and how many notes one hand can hold. Notes with a known hand move that hand too.
import { HAND_SPLIT } from './notes.js';

const CHORD = 0.05; // notes starting this close together are one chord
const STRETCH = 14; // semitones one hand covers comfortably (an octave and a step)
const FINGERS = 5;
const HOME = { left: HAND_SPLIT - 12, right: HAND_SPLIT + 12 };
const DRIFT = 0.15; // how fast an idle hand drifts back toward home, per second
const FOLLOW = 0.45; // how far a hand moves toward the notes it just played

const mean = (list) => list.reduce((s, p) => s + p, 0) / list.length;

function cost(pitches, at) {
  if (!pitches.length) return 0;
  const reach = pitches.reduce((s, p) => s + Math.abs(p - at), 0);
  const span = pitches[pitches.length - 1] - pitches[0];
  return reach + 30 * Math.max(0, span - STRETCH) + 40 * Math.max(0, pitches.length - FINGERS);
}

/** 'left' or 'right' for each note (notes sorted by start). */
export function assignHands(notes) {
  const hands = new Array(notes.length);
  const at = { ...HOME };
  const last = { left: -Infinity, right: -Infinity };
  let i = 0;
  while (i < notes.length) {
    const time = notes[i].start;
    let j = i;
    while (j < notes.length && notes[j].start - time < CHORD) j++;
    // A hand that hasn't played for a while drifts back toward its home.
    for (const hand of ['left', 'right']) {
      const idle = Math.max(0, time - last[hand] - 1);
      at[hand] += (HOME[hand] - at[hand]) * Math.min(1, idle * DRIFT);
    }
    const known = { left: [], right: [] };
    const free = [];
    for (let k = i; k < j; k++) {
      if (notes[k].hand) known[notes[k].hand].push(notes[k].pitch);
      else free.push(k);
    }
    free.sort((a, b) => notes[a].pitch - notes[b].pitch);
    const freePitches = free.map((k) => notes[k].pitch);
    const sorted = (list) => list.sort((a, b) => a - b);
    const handsAt = (split) => ({
      left: sorted([...known.left, ...freePitches.slice(0, split)]),
      right: sorted([...known.right, ...freePitches.slice(split)]),
    });
    // Try every way of giving the lowest free notes to the left hand and the rest to the right.
    let best = 0;
    let bestCost = Infinity;
    for (let split = 0; split <= free.length; split++) {
      const { left, right } = handsAt(split);
      const c = cost(left, at.left) + cost(right, at.right);
      if (c < bestCost) [best, bestCost] = [split, c];
    }
    for (let k = i; k < j; k++) if (notes[k].hand) hands[k] = notes[k].hand;
    free.forEach((k, n) => (hands[k] = n < best ? 'left' : 'right'));
    const { left, right } = handsAt(best);
    if (left.length) [at.left, last.left] = [at.left + (mean(left) - at.left) * FOLLOW, time];
    if (right.length) [at.right, last.right] = [at.right + (mean(right) - at.right) * FOLLOW, time];
    // Hands don't pass through each other.
    if (at.left > at.right - 3) [at.left, at.right] = [(at.left + at.right) / 2 - 1.5, (at.left + at.right) / 2 + 1.5];
    i = j;
  }
  return hands;
}
