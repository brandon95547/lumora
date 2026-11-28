import { describe, expect, it } from 'vitest';
import { normalizeNotes } from '../../notes.js';
import { pianoOf } from '../piano/model.js';
import { prepareScene } from '../scene.js';
import { galaxyAt, galaxyView } from './index.js';
import { keyboardToWorld, landingOf } from './layout.js';
import { starOf } from './spiral.js';
import { FLIGHT, shootingStarAt } from './stars.js';

const scene = prepareScene(
  normalizeNotes([
    { pitch: 40, start: 2, end: 3, velocity: 0.7 },
    { pitch: 76, start: 2, end: 3, velocity: 0.7 },
  ]),
  { width: 1080, height: 1920 },
);
const model = pianoOf(scene);
const camera = { turn: 0, tilt: 30, zoom: 1.2, drift: false };
const [left, right] = scene.items;

describe('the galaxy', () => {
  it('hangs high in the frame whatever the angle', () => {
    for (const angle of [camera, { ...camera, turn: -35, tilt: 16 }, { ...camera, tilt: 6, zoom: 0.55 }, null]) {
      const p = galaxyView(scene, angle, 0).project(...galaxyAt(scene, angle, 0).center);
      expect(p.y).toBeLessThan(1920 * 0.35);
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(1080);
    }
  });

  it('holds each hand’s stars, on its own arm, far out beyond the keyboard', () => {
    const galaxy = galaxyAt(scene, camera, 0);
    for (const n of [left, right]) {
      const star = starOf(galaxy, n, 0);
      expect(Math.hypot(...star.map((v, i) => v - galaxy.center[i]))).toBeLessThanOrEqual(galaxy.radius * 1.01);
      expect(star[2]).toBeGreaterThan(200);
    }
    expect(starOf(galaxy, left, 0)).not.toEqual(starOf(galaxy, right, 0));
  });

  it('floats the keyboard centered at the origin, low keys at its left', () => {
    expect(keyboardToWorld(26, 0, 0)[0]).toBe(0);
    expect(landingOf(model, 40)[0]).toBeLessThan(landingOf(model, 76)[0]);
  });
});

describe('a shooting star', () => {
  const from = starOf(galaxyAt(scene, camera, 2 - FLIGHT), right, 2 - FLIGHT);
  const to = landingOf(model, 76);

  it('leaves the galaxy FLIGHT seconds early and lands on its key as the note sounds', () => {
    expect(shootingStarAt(from, to, 2, 2 - FLIGHT)).toEqual(from);
    shootingStarAt(from, to, 2, 2).forEach((v, i) => expect(v).toBeCloseTo(to[i]));
  });

  it('comes in faster as it falls', () => {
    const early = shootingStarAt(from, to, 2, 2 - FLIGHT * 0.75);
    const late = shootingStarAt(from, to, 2, 2 - FLIGHT * 0.25);
    const travelled = Math.hypot(...early.map((v, i) => v - from[i]));
    const left = Math.hypot(...late.map((v, i) => v - to[i]));
    expect(travelled).toBeLessThan(left);
  });
});
