import { describe, expect, it } from 'vitest';
import { normalizeNotes } from '../../notes.js';
import { pianoOf } from '../piano/model.js';
import { prepareScene } from '../scene.js';
import { keyboardToWorld, landingOf, starOf } from './layout.js';
import { FLIGHT, shootingStarAt } from './stars.js';

const scene = prepareScene(
  normalizeNotes([
    { pitch: 40, start: 2, end: 3, velocity: 0.7 },
    { pitch: 76, start: 2, end: 3, velocity: 0.7 },
  ]),
  { width: 1080, height: 1920 },
);
const model = pianoOf(scene);

describe('the keyboard and the sky', () => {
  it('floats the keyboard centered at the origin, low keys at its left', () => {
    expect(keyboardToWorld(26, 0, 0)[0]).toBe(0);
    expect(landingOf(model, 40)[0]).toBeLessThan(landingOf(model, 76)[0]);
  });

  it('puts each note’s star far out in the sky, low notes to the left', () => {
    const low = starOf(30, 1);
    const high = starOf(100, 1);
    expect(low[0]).toBeLessThan(high[0]);
    for (const star of [low, high]) {
      expect(star[1]).toBeLessThan(-30); // above the keys (y runs downward)
      expect(star[2]).toBeGreaterThan(200); // far out
    }
  });
});

describe('a shooting star', () => {
  const from = starOf(76, 1);
  const to = landingOf(model, 76);

  it('leaves its place in the sky FLIGHT seconds early and lands on its key as the note sounds', () => {
    expect(shootingStarAt(from, to, 2, 2 - FLIGHT)).toEqual(from);
    shootingStarAt(from, to, 2, 2).forEach((v, i) => expect(v).toBeCloseTo(to[i]));
  });

  it('comes in faster as it falls', () => {
    const early = shootingStarAt(from, to, 2, 2 - FLIGHT * 0.75);
    const late = shootingStarAt(from, to, 2, 2 - FLIGHT * 0.25);
    const [first, second] = [
      Math.hypot(...early.map((v, i) => v - from[i])),
      Math.hypot(...late.map((v, i) => v - to[i])),
    ];
    expect(first).toBeLessThan(second); // less ground covered in the first quarter than is left in the last
  });
});
