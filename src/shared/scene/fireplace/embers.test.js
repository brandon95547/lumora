import { describe, expect, it } from 'vitest';
import { normalizeNotes } from '../../notes.js';
import { pianoOf } from '../piano/model.js';
import { prepareScene } from '../scene.js';
import { emberAt, FLIGHT } from './embers.js';
import { FIRE_X, KEYBOARD_ORIGIN, keyboardToWorld, landingOf, launchOf, OPENING, WALL_Z } from './layout.js';

const scene = prepareScene(
  normalizeNotes([
    { pitch: 40, start: 1, end: 2, velocity: 0.7 },
    { pitch: 76, start: 1, end: 2, velocity: 0.7 },
  ]),
  { width: 1080, height: 1920 },
);
const model = pianoOf(scene);

describe('the scene', () => {
  it('stands the keyboard turned toward the fire, low keys at its left', () => {
    expect(keyboardToWorld(0, 0, 0)).toEqual(KEYBOARD_ORIGIN);
    const low = landingOf(model, 40);
    const high = landingOf(model, 76);
    expect(low[0]).toBeLessThan(high[0]);
    expect(high[2]).toBeGreaterThan(low[2]); // the treble end sits nearer the fire
  });

  it('centers the keyboard on the fireplace', () => {
    expect(keyboardToWorld(26, 0, 0)[0]).toBeCloseTo(FIRE_X);
  });

  it('starts every fireball inside the firebox', () => {
    for (let seed = 0; seed < 20; seed++) {
      const [x, y, z] = launchOf(seed);
      expect(Math.abs(x - FIRE_X)).toBeLessThan(OPENING.half);
      expect(y).toBeGreaterThan(OPENING.top);
      expect(z).toBeLessThan(WALL_Z);
    }
  });
});

describe('fireballs', () => {
  const from = launchOf(3);
  const to = landingOf(model, 76);

  it('leave the fire FLIGHT seconds early and land on the key exactly as the note sounds', () => {
    expect(emberAt(from, to, 1, 1 - FLIGHT, 3)).toEqual(from);
    emberAt(from, to, 1, 1, 3).forEach((v, i) => expect(v).toBeCloseTo(to[i]));
  });

  it('arc high on the way', () => {
    const middle = emberAt(from, to, 1, 1 - FLIGHT / 2, 3);
    expect(middle[1]).toBeLessThan(Math.min(from[1], to[1]) - 5); // y runs downward
  });
});
