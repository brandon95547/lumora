// Renders the song's notes through an instrument's voice into one piece of audio.
//
// Web Audio works on every scheduled note for the whole length of a render, so one render of a whole
// song costs notes × length and a five-minute song takes minutes. Instead the song is rendered in
// short sections, each holding only the notes that start in it (and their ringing tails), a few at a
// time, and the sections are added into one buffer. The cost then grows with the song's length alone.
//
// A voice is `{ tail, connect(ctx, output) }`: `tail` is how long (seconds) a note sounds after it
// ends, and `connect` returns `play(note, start, end)`, which schedules one note in that context.
const RATE = 48000;
const TAIL = 1.5;
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

function renderSection({ from, notes }, voice) {
  const until = notes.reduce((m, n) => Math.max(m, n.end), from) + voice.tail + 0.2;
  const ctx = new OfflineAudioContext(2, Math.ceil((until - from) * RATE), RATE);
  // Keeps dense chords from clipping.
  const master = ctx.createDynamicsCompressor();
  master.connect(ctx.destination);
  const play = voice.connect(ctx, master);
  for (const note of notes) play(note, note.start - from, note.end - from);
  return ctx.startRendering();
}

/** The song as audio, played by `voice`. `onProgress(0–1)` is called as sections finish. */
export async function synthesize(notes, voice, onProgress = () => {}) {
  const length = notes.reduce((m, n) => Math.max(m, n.end), 0) + TAIL;
  const out = new AudioBuffer({ numberOfChannels: 2, length: Math.ceil(length * RATE), sampleRate: RATE });
  const sections = sectionsOf(notes);
  let next = 0;
  let done = 0;
  const worker = async () => {
    while (next < sections.length) {
      const section = sections[next++];
      const audio = await renderSection(section, voice);
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
