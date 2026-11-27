// A soft, piano-like voice that plays the song's notes (a MIDI file, a score, the demo).
//
// Web Audio works on every scheduled note for the whole length of a render, so one render of a whole
// song costs notes × length and a five-minute song takes minutes. Instead the song is rendered in
// short sections, each holding only the notes that start in it (and their ringing tails), a few at a
// time, and the sections are added into one buffer. The cost then grows with the song's length alone.
const RATE = 48000;
const TAIL = 1.5;
const RELEASE = 0.6; // seconds a note rings on after it ends
const SECTION = 3; // seconds of note starts per section
const AT_ONCE = 4; // sections rendered side by side (each renders on its own audio thread)

/** The notes starting in each SECTION-second stretch of the song. Exported for the tests. */
export function sectionsOf(notes) {
  const sections = [];
  for (const n of notes) {
    const k = Math.floor(n.start / SECTION);
    (sections[k] ??= []).push(n);
  }
  return sections.map((list, k) => list && { from: k * SECTION, notes: list }).filter(Boolean);
}

function renderSection({ from, notes }) {
  const until = notes.reduce((m, n) => Math.max(m, n.end), from) + RELEASE + 0.2;
  const ctx = new OfflineAudioContext(2, Math.ceil((until - from) * RATE), RATE);
  const master = ctx.createDynamicsCompressor();
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 4200;
  tone.connect(master);
  master.connect(ctx.destination);

  for (const note of notes) {
    const start = note.start - from;
    const end = note.end - from;
    const freq = 440 * 2 ** ((note.pitch - 69) / 12);
    const peak = 0.12 + 0.18 * note.velocity;
    const decay = 0.35 + (108 - note.pitch) / 90; // low notes ring longer
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.006);
    gain.gain.setTargetAtTime(peak * 0.25, start + 0.006, decay);
    gain.gain.setTargetAtTime(0, end, 0.09);
    gain.connect(tone);
    for (const [type, mult, level] of [
      ['triangle', 1, 1],
      ['sine', 2, 0.35],
      ['sine', 3, 0.12],
    ]) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq * mult;
      const partial = ctx.createGain();
      partial.gain.value = level;
      osc.connect(partial).connect(gain);
      osc.start(start);
      osc.stop(end + RELEASE);
    }
  }
  return ctx.startRendering();
}

/** The song as audio. `onProgress(0–1)` is called as sections finish. */
export async function synthesize(notes, onProgress = () => {}) {
  const length = notes.reduce((m, n) => Math.max(m, n.end), 0) + TAIL;
  const out = new AudioBuffer({ numberOfChannels: 2, length: Math.ceil(length * RATE), sampleRate: RATE });
  const sections = sectionsOf(notes);
  let next = 0;
  let done = 0;
  const worker = async () => {
    while (next < sections.length) {
      const section = sections[next++];
      const audio = await renderSection(section);
      const offset = Math.round(section.from * RATE);
      for (let c = 0; c < 2; c++) {
        const into = out.getChannelData(c);
        const from = audio.getChannelData(c);
        const count = Math.min(from.length, into.length - offset);
        for (let i = 0; i < count; i++) into[offset + i] += from[i];
      }
      onProgress(++done / sections.length);
    }
  };
  await Promise.all(Array.from({ length: AT_ONCE }, worker));
  return out;
}
