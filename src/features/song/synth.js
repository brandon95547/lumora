// A soft, piano-like voice for songs that arrive without audio (a MIDI file, the demo).
const RATE = 48000;
const TAIL = 1.5;

export async function synthesize(notes) {
  const length = notes.reduce((m, n) => Math.max(m, n.end), 0) + TAIL;
  const ctx = new OfflineAudioContext(2, Math.ceil(length * RATE), RATE);
  const master = ctx.createDynamicsCompressor();
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 4200;
  tone.connect(master);
  master.connect(ctx.destination);

  for (const n of notes) {
    const freq = 440 * 2 ** ((n.pitch - 69) / 12);
    const peak = 0.12 + 0.18 * n.velocity;
    const decay = 0.35 + (108 - n.pitch) / 90; // low notes ring longer
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, n.start);
    gain.gain.linearRampToValueAtTime(peak, n.start + 0.006);
    gain.gain.setTargetAtTime(peak * 0.25, n.start + 0.006, decay);
    gain.gain.setTargetAtTime(0, n.end, 0.09);
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
      osc.start(n.start);
      osc.stop(n.end + 0.6);
    }
  }
  return ctx.startRendering();
}
