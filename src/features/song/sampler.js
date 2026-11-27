// Sampled instruments: recordings of a real instrument, one per few keys and per velocity layer,
// built by scripts/build-instruments.mjs into public/instruments/<id>/. A song fetches only the
// samples its own notes need; each is kept once fetched, for the next song and the next instrument
// change.

const RATE = 48000;
const manifests = new Map();
const buffers = new Map();

function manifestOf(id) {
  if (!manifests.has(id)) {
    const url = `${import.meta.env.BASE_URL}instruments/${id}/manifest.json`;
    manifests.set(
      id,
      fetch(url).then((r) => {
        if (!r.ok) throw new Error(`${url}: ${r.status}`);
        return r.json();
      }),
    );
  }
  return manifests.get(id);
}

/**
 * The sample that plays a note: the nearest recorded key (shifted to the note's pitch), and of its
 * velocity layers the one nearest how hard the note is played.
 */
export function pickSample(samples, pitch, velocity) {
  let best = null;
  for (const s of samples) {
    const score = Math.abs(s.pitch - pitch) * 10 + Math.abs(s.layer - velocity);
    if (!best || score < best.score) best = { sample: s, score };
  }
  return best.sample;
}

/** A sample's audio, and where its sound starts (the encoder adds a little silence before it). */
function bufferOf(id, file) {
  const url = `${import.meta.env.BASE_URL}instruments/${id}/${file}`;
  if (!buffers.has(url)) {
    const loading = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`${url}: ${r.status}`);
        return r.arrayBuffer();
      })
      .then((data) => new OfflineAudioContext(2, 1, RATE).decodeAudioData(data))
      .then((buffer) => {
        const first = buffer.getChannelData(0);
        let peak = 0;
        for (let i = 0; i < first.length; i++) peak = Math.max(peak, Math.abs(first[i]));
        let start = 0;
        while (start < first.length && Math.abs(first[start]) < peak * 0.005) start++;
        return { buffer, offset: Math.max(0, start - RATE * 0.002) / RATE };
      });
    loading.catch(() => buffers.delete(url)); // a failed fetch is tried again next time
    buffers.set(url, loading);
  }
  return buffers.get(url);
}

/** A voice for `instrument`, with the samples `notes` need fetched. `onProgress(0–1)` as they arrive. */
export async function sampledVoice(instrument, notes, onProgress = () => {}) {
  const { gain, samples } = await manifestOf(instrument.id);
  const chosen = new Map(notes.map((n) => [`${n.pitch}:${n.velocity}`, n])); // one pick per pitch and loudness
  const picks = new Map();
  for (const [key, n] of chosen) picks.set(key, pickSample(samples, n.pitch, n.velocity));
  const files = [...new Set([...picks.values()].map((s) => s.file))];
  let done = 0;
  const loaded = new Map(
    await Promise.all(
      files.map((file) =>
        bufferOf(instrument.id, file).then((b) => {
          onProgress(++done / files.length);
          return [file, b];
        }),
      ),
    ),
  );
  const release = instrument.release;
  return {
    tail: release,
    connect(ctx, output) {
      return (note, start, end) => {
        const sample = picks.get(`${note.pitch}:${note.velocity}`);
        const { buffer, offset } = loaded.get(sample.file);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = 2 ** ((note.pitch - sample.pitch) / 12);
        const level = ctx.createGain();
        // Within a layer, softer or harder than it was recorded plays a little quieter or louder.
        const loudness = gain * Math.min(1.4, Math.max(0.5, (note.velocity / sample.layer) ** 0.7));
        level.gain.setValueAtTime(loudness, start);
        level.gain.setTargetAtTime(0, end, release / 4);
        source.connect(level).connect(output);
        source.start(start, offset);
        source.stop(end + release);
      };
    },
  };
}
