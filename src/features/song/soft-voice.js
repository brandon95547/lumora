// The Soft Synth: a gentle piano-like tone made from oscillators. Nothing to download.
const RELEASE = 0.6;

export const softVoice = {
  tail: RELEASE,
  connect(ctx, output) {
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 4200;
    tone.connect(output);
    return (note, start, end) => {
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
    };
  },
};
