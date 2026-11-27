import { describe, expect, it } from 'vitest';
import { normalizeNotes } from '../../notes.js';
import { prepareScene } from '../scene.js';
import { beamAt, beamsOf, fireAt } from './blaze.js';

// A minute of melody with a three-note chord every second.
const notes = [];
for (let t = 0.5; t < 60; t += 0.25) {
  notes.push({ pitch: 72 + (Math.round(t * 4) % 7), start: t, end: t + 0.2, velocity: 0.7, hand: 'right' });
  if (Number.isInteger(t))
    for (const p of [60, 64, 67]) notes.push({ pitch: p, start: t, end: t + 0.5, velocity: 0.8, hand: 'right' });
}
const scene = prepareScene(normalizeNotes(notes), { width: 1080, height: 1920 });

describe('fireAt', () => {
  it('is out early on, catches partway through and burns by the end', () => {
    expect(fireAt(scene, scene.duration * 0.1)).toBe(0);
    const middle = fireAt(scene, scene.duration * 0.5);
    expect(middle).toBeGreaterThan(0);
    expect(fireAt(scene, scene.duration * 0.9)).toBeGreaterThan(middle);
  });
});

describe('beams', () => {
  const beams = beamsOf(scene, 'right');

  it('come on big chords, now and then rather than on every one', () => {
    expect(beams.length).toBeGreaterThan(5);
    expect(beams.length).toBeLessThan(30); // a chord every second, a beam every 3 s or more
    for (let i = 1; i < beams.length; i++) expect(beams[i] - beams[i - 1]).toBeGreaterThanOrEqual(3);
  });

  it('flash on the chord and fade', () => {
    const [first] = beams;
    expect(beamAt(beams, first - 0.1)).toBe(0);
    expect(beamAt(beams, first + 0.05)).toBeGreaterThan(0.8);
    expect(beamAt(beams, first + 1)).toBeLessThan(0.2);
  });

  it('has none for a hand with no big chords', () => {
    expect(beamsOf(scene, 'left')).toEqual([]);
  });
});
