import { describe, expect, it } from 'vitest';
import { pickSample } from './sampler.js';

const samples = [
  { file: 'a', pitch: 57, layer: 0.25 },
  { file: 'b', pitch: 57, layer: 0.75 },
  { file: 'c', pitch: 60, layer: 0.25 },
  { file: 'd', pitch: 60, layer: 0.75 },
];

describe('pickSample', () => {
  it('takes the nearest recorded key, then the layer nearest the note’s loudness', () => {
    expect(pickSample(samples, 61, 0.8).file).toBe('d');
    expect(pickSample(samples, 59, 0.3).file).toBe('c');
    expect(pickSample(samples, 56, 0.6).file).toBe('b');
  });
});
