import { describe, expect, it } from 'vitest';
import { integratedLoudness, limit, truePeak } from './master.js';

const RATE = 48000;
const sine = (amplitude, seconds = 5, freq = 997) =>
  Float32Array.from({ length: RATE * seconds }, (_, i) => amplitude * Math.sin((2 * Math.PI * freq * i) / RATE));

describe('integratedLoudness', () => {
  it('reads a full-scale 1 kHz tone in both channels as about 0 LUFS (BS.1770’s reference)', () => {
    expect(integratedLoudness([sine(1), sine(1)])).toBeCloseTo(0, 0);
  });

  it('follows the level: 20 dB down reads 20 LU less', () => {
    expect(integratedLoudness([sine(0.1), sine(0.1)])).toBeCloseTo(-20, 0);
  });

  it('leaves silence out (the gates)', () => {
    const half = sine(0.1, 10);
    half.fill(0, RATE * 5);
    expect(integratedLoudness([half, half])).toBeCloseTo(-20, 0);
  });
});

describe('limit', () => {
  it('keeps every sample under the ceiling and leaves quiet passages alone', () => {
    const loud = sine(0.2, 2);
    for (let i = RATE; i < RATE + 200; i++) loud[i] = 1.5; // a sudden spike
    const copy = loud.slice();
    limit([loud, loud.slice()], 0.8);
    expect(Math.max(...loud.map(Math.abs))).toBeLessThanOrEqual(0.8 + 1e-6);
    expect(loud[RATE / 2]).toBeCloseTo(copy[RATE / 2], 5); // half a second before the spike
    expect(loud[RATE + 50]).toBeGreaterThan(0); // turned down, never turned over
  });
});

describe('truePeak', () => {
  it('finds a peak that falls between samples', () => {
    // A tone at a quarter of the sample rate, phased so every sample misses its crests.
    const d = Float32Array.from({ length: 4800 }, (_, i) => Math.sin((Math.PI / 2) * i + Math.PI / 4));
    expect(truePeak([d])).toBeGreaterThan(20 * Math.log10(Math.SQRT1_2) + 1);
  });
});
