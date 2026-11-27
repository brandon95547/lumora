import { describe, expect, it } from 'vitest';
import { sectionsOf } from './synth.js';

const note = (start) => ({ pitch: 60, start, end: start + 5, velocity: 0.8 });

describe('sectionsOf', () => {
  it('puts each note in the section where it starts, long ones included, and skips empty stretches', () => {
    const sections = sectionsOf([note(0), note(2.9), note(3), note(20)]);
    expect(sections.map((s) => [s.from, s.notes.map((n) => n.start)])).toEqual([
      [0, [0, 2.9]],
      [3, [3]],
      [18, [20]],
    ]);
  });
});
