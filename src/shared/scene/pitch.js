// Where a MIDI pitch sits on a grand staff: its spelling, its clef and its line or space.

const SHARP_SPELLING = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
  [2, 0],
  [3, 0],
  [3, 1],
  [4, 0],
  [4, 1],
  [5, 0],
  [5, 1],
  [6, 0],
];
const FLAT_SPELLING = [
  [0, 0],
  [1, -1],
  [1, 0],
  [2, -1],
  [2, 0],
  [3, 0],
  [4, -1],
  [4, 0],
  [5, -1],
  [5, 0],
  [6, -1],
  [6, 0],
];

/** Diatonic steps (octave × 7 + letter, C = 0) of each staff's bottom line: E4 and G2. */
export const BOTTOM_LINE = { treble: 4 * 7 + 2, bass: 2 * 7 + 4 };

/** Pitches from middle C up are read on the treble staff, the rest on the bass staff. */
export const HAND_SPLIT = 60;

/** Spells a MIDI pitch as a letter (C = 0 … B = 6), an octave and an accidental (-1, 0, 1). */
export function spell(pitch, preferFlats = false) {
  const [letter, accidental] = (preferFlats ? FLAT_SPELLING : SHARP_SPELLING)[pitch % 12];
  return { letter, accidental, octave: Math.floor(pitch / 12) - 1 };
}

/**
 * Places a pitch on the grand staff. `offset` counts half-spaces up from the clef's bottom line:
 * 0 is the bottom line, 8 the top line, -2 the first ledger line below.
 */
export function placePitch(pitch, preferFlats = false) {
  const { letter, accidental, octave } = spell(pitch, preferFlats);
  const clef = pitch >= HAND_SPLIT ? 'treble' : 'bass';
  return { clef, accidental, offset: octave * 7 + letter - BOTTOM_LINE[clef] };
}

/** The ledger lines (as offsets) a note at `offset` needs. */
export function ledgerLines(offset) {
  const lines = [];
  for (let o = -2; o >= offset; o -= 2) lines.push(o);
  for (let o = 10; o <= offset; o += 2) lines.push(o);
  return lines;
}

// Krumhansl–Kessler key profiles.
const MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
// Tonics whose key signature uses flats (F, B♭, E♭, A♭, D♭, G♭ major; their relative minors).
const FLAT_MAJORS = new Set([5, 10, 3, 8, 1, 6]);
const FLAT_MINORS = new Set([2, 7, 0, 5, 10, 3]);

function correlation(a, b) {
  const mean = (v) => v.reduce((s, x) => s + x, 0) / v.length;
  const ma = mean(a);
  const mb = mean(b);
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < a.length; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  return da && db ? num / Math.sqrt(da * db) : 0;
}

/** Estimates the song's key from how long each pitch class sounds, to spell black keys as sharps or flats. */
export function estimateKey(notes) {
  const weight = new Array(12).fill(0);
  for (const n of notes) weight[n.pitch % 12] += n.end - n.start;
  let best = { tonic: 0, mode: 'major', score: -Infinity };
  for (let tonic = 0; tonic < 12; tonic++) {
    for (const [mode, profile] of [
      ['major', MAJOR],
      ['minor', MINOR],
    ]) {
      const rotated = profile.map((_, i) => profile[(i - tonic + 12) % 12]);
      const score = correlation(weight, rotated);
      if (score > best.score) best = { tonic, mode, score };
    }
  }
  const flats = best.mode === 'major' ? FLAT_MAJORS : FLAT_MINORS;
  return { tonic: best.tonic, mode: best.mode, preferFlats: flats.has(best.tonic) };
}
