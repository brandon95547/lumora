import { describe, expect, it } from 'vitest';
import { burst, held, noise } from './envelope.js';

const note = { start: 1, end: 2, velocity: 1 };

describe('envelope', () => {
  it('is dark before the onset and brightest at it', () => {
    expect(burst(note, 0.9)).toBe(0);
    expect(burst(note, 1)).toBe(1);
    expect(burst(note, 1.5)).toBeLessThan(0.1);
  });

  it('holds while the note sounds, then fades', () => {
    expect(held(note, 0.5)).toBe(0);
    expect(held(note, 1.5)).toBe(1);
    expect(held(note, 2.5)).toBeLessThan(0.3);
  });

  it('gives the same noise for the same seed', () => {
    expect(noise(3, 1)).toBe(noise(3, 1));
    expect(noise(3, 1)).not.toBe(noise(3, 2));
  });
});
