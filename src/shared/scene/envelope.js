// How bright a note is at time t. Every style reads these, so a frame depends on t alone
// and the preview, the scrubber and the export always agree.

/** A quick flash at the onset, scaled by how hard the note was struck. */
export function burst(note, t) {
  const age = t - note.start;
  if (age < 0) return 0;
  return Math.exp(-age * 5.5) * (0.55 + 0.45 * note.velocity);
}

/** 1 while the note sounds, then fading after its release; 0 before it starts. */
export function held(note, t) {
  if (t < note.start) return 0;
  if (t <= note.end) return 1;
  return Math.exp(-(t - note.end) * 3);
}

/** A stable pseudo-random number in [0, 1) for a note and a slot, so sparkles never flicker. */
export function noise(seed, slot) {
  const x = Math.sin(seed * 127.1 + slot * 311.7) * 43758.5453;
  return x - Math.floor(x);
}
