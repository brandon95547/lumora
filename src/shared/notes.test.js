import { describe, expect, it } from 'vitest';
import { firstStartingAt, normalizeNotes } from './notes.js';

describe('normalizeNotes', () => {
  it('sorts by start, keeps piano range and gives every note some length', () => {
    const notes = normalizeNotes([
      { pitch: 64, start: 1, end: 1, velocity: 2 },
      { pitch: 10, start: 0, end: 1 },
      { pitch: 60.2, start: 0.5, end: 0.9 },
    ]);
    expect(notes.map((n) => n.pitch)).toEqual([60, 64]);
    expect(notes[1].end).toBeGreaterThan(notes[1].start);
    expect(notes[1].velocity).toBe(1);
    expect(notes[0].velocity).toBe(0.8);
  });
});

describe('firstStartingAt', () => {
  const notes = [0, 1, 1, 2, 5].map((start) => ({ start }));
  it('finds the first note at or after a time', () => {
    expect(firstStartingAt(notes, 1)).toBe(1);
    expect(firstStartingAt(notes, 1.5)).toBe(3);
    expect(firstStartingAt(notes, 9)).toBe(5);
    expect(firstStartingAt(notes, -1)).toBe(0);
  });
});
