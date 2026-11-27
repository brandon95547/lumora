// A short original phrase shown before any song is dropped, so every style can be tried at once.
const BEAT = 0.42;
// Left hand: a broken chord per bar. Right hand: a melody over it.
const BARS = [
  { bass: [48, 55, 60, 55], tune: [76, 74, 72, 74] },
  { bass: [45, 52, 57, 52], tune: [76, 79, 77, 76] },
  { bass: [41, 48, 53, 48], tune: [74, 72, 69, 72] },
  { bass: [43, 50, 55, 50], tune: [71, 74, 79, 78] },
  { bass: [48, 55, 60, 55], tune: [79, 76, 72, 76] },
  { bass: [45, 52, 57, 52], tune: [81, 79, 76, 72] },
  { bass: [41, 48, 53, 48], tune: [74, 77, 76, 74] },
  { bass: [43, 50, 55, 59], tune: [72, 71, 74, 72] },
];

export const DEMO_TITLE = 'Lumora demo';

export function demoNotes() {
  const notes = [];
  BARS.forEach((bar, b) => {
    for (let i = 0; i < 4; i++) {
      const start = 0.4 + (b * 4 + i) * BEAT;
      notes.push({ pitch: bar.bass[i], start, end: start + BEAT * 1.8, velocity: 0.55 });
      notes.push({ pitch: bar.tune[i], start, end: start + BEAT * 0.95, velocity: i === 0 ? 0.95 : 0.75 });
    }
  });
  const end = 0.4 + BARS.length * 4 * BEAT;
  for (const pitch of [36, 48, 64, 67, 72]) notes.push({ pitch, start: end, end: end + 2.2, velocity: 0.8 });
  return notes;
}
