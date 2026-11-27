import { describe, expect, it } from 'vitest';
import { normalizeNotes } from '../../notes.js';
import { prepareScene } from '../scene.js';
import { cometAt, PLANETS, planetAngle, systemOf } from './system.js';

// Thirty seconds: a left-hand bass line and a right-hand melody, a fast run at 12 s, chords at 20 s.
const notes = [];
for (let t = 0; t < 30; t += 1) notes.push({ pitch: 36 + (t % 12), start: t, end: t + 0.8, velocity: 0.7 });
for (let t = 0.5; t < 30; t += 0.5)
  notes.push({ pitch: 72 + (Math.round(t * 3) % 12), start: t, end: t + 0.4, velocity: 0.8 });
for (let i = 0; i < 8; i++) notes.push({ pitch: 84 + i, start: 12 + i * 0.1, end: 12.1 + i * 0.1, velocity: 0.9 });
for (const pitch of [74, 81, 89]) notes.push({ pitch, start: 20.25, end: 21, velocity: 0.8 });
const scene = prepareScene(normalizeNotes(notes), { width: 1080, height: 1920 });
const index = (id) => PLANETS.findIndex((p) => p.id === id);

describe('which planet plays a note', () => {
  const { planetOf } = systemOf(scene);

  it('gives the right hand the rocky planets and the left hand the giants', () => {
    for (const n of scene.items) expect(PLANETS[planetOf[n.index]].hand).toBe(n.hand);
  });

  it('puts higher notes nearer the sun', () => {
    const highest = scene.items.filter((n) => n.hand === 'right').sort((a, b) => b.pitch - a.pitch)[0];
    const lowest = scene.items.filter((n) => n.hand === 'left').sort((a, b) => a.pitch - b.pitch)[0];
    expect(planetOf[highest.index]).toBe(index('mercury'));
    expect(planetOf[lowest.index]).toBe(index('neptune'));
  });

  it('uses all four planets of each hand', () => {
    expect(systemOf(scene).starts.every((s) => s.length > 0)).toBe(true);
  });
});

describe('orbits', () => {
  it('step a planet forward on each of its notes, smoothly', () => {
    const k = index('neptune');
    const first = systemOf(scene).starts[k][0];
    const drift = 0.5 / PLANETS[k].orbit ** 1.5; // radians a second between notes
    const before = planetAngle(scene, k, first - 0.01);
    expect(planetAngle(scene, k, first + 0.5) - before).toBeGreaterThan(drift * 4);
    expect(planetAngle(scene, k, first + 0.01) - before).toBeLessThan(0.01);
  });

  it('are the same every time a moment is drawn', () => {
    expect(planetAngle(scene, 2, 7.3)).toBe(planetAngle(scene, 2, 7.3));
  });
});

describe('alignments and comets', () => {
  it('lines up the planets of a chord', () => {
    expect(systemOf(scene).alignments.some((a) => Math.abs(a.start - 20.25) < 0.01 && a.planets.length >= 2)).toBe(
      true,
    );
  });

  it('sends a comet on a fast right-hand run', () => {
    const { comets } = systemOf(scene);
    expect(comets.length).toBe(1);
    expect(comets[0].start).toBeGreaterThanOrEqual(10.5);
    expect(comets[0].start).toBeLessThanOrEqual(12);
    expect(cometAt(comets[0], comets[0].start + 2)).not.toBeNull();
    expect(cometAt(comets[0], comets[0].start + 10)).toBeNull();
  });
});
