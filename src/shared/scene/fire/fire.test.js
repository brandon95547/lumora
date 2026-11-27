import { describe, expect, it } from 'vitest';
import { prepareScene } from '../scene.js';
import { energyAt } from '../energy.js';
import { ballAt, followAt, landingBefore, runOf } from './path.js';

const notes = [
  { pitch: 60, start: 1, end: 1.4, velocity: 0.8 },
  { pitch: 64, start: 1.03, end: 1.4, velocity: 0.6 }, // same chord as the first
  { pitch: 72, start: 2, end: 2.5, velocity: 1 },
  { pitch: 55, start: 3, end: 3.5, velocity: 0.7 },
];
const scene = prepareScene(notes, { width: 1920, height: 1080 }, 4);

describe('the run', () => {
  const run = runOf(scene);

  it('lands once per chord, moving forward each time', () => {
    expect(run.landings.map((l) => l.time)).toEqual([1, 2, 3]);
    expect(run.landings[1].x).toBeGreaterThan(run.landings[0].x);
    expect(run.landings[2].x).toBeGreaterThan(run.landings[1].x);
  });

  it('puts higher notes on higher ledges', () => {
    expect(run.landings[1].y).toBeLessThan(run.landings[2].y); // y grows downward
  });

  it('is on each ledge exactly when its notes sound, and in the air between', () => {
    for (const l of run.landings) expect(ballAt(run, l.time)).toEqual([l.x, l.y, l.z]);
    const between = ballAt(run, 1.5);
    expect(between[1]).toBeLessThan(Math.min(run.landings[0].y, run.landings[1].y));
  });

  it('drops in from above before the first note', () => {
    expect(ballAt(run, 0.5)[1]).toBeLessThan(run.landings[0].y);
    expect(landingBefore(run, 0.5)).toBe(-1);
  });

  it('gives the camera a smooth aim, the same each time', () => {
    expect(followAt([run], 2.2)).toEqual(followAt([run], 2.2));
  });
});

describe('two hands', () => {
  const right = runOf(scene, 'right');
  const left = runOf(scene, 'left');

  it('gives each hand only its own notes', () => {
    expect(right.landings.map((l) => l.time)).toEqual([1, 2]);
    expect(left.landings.map((l) => l.time)).toEqual([3]);
  });

  it('keeps the hands in separate lanes, the right above the left', () => {
    expect(Math.max(...right.landings.map((l) => l.y))).toBeLessThan(Math.min(...left.landings.map((l) => l.y)));
  });

  it('moves both hands forward on the same timeline as the whole run', () => {
    const all = runOf(scene);
    expect(right.landings[1].x).toBe(all.landings[1].x);
    expect(left.landings[0].x).toBe(all.landings[2].x);
  });

  it('has no ball for a hand that never plays', () => {
    const solo = prepareScene([{ pitch: 72, start: 1, end: 2, velocity: 1 }], { width: 1920, height: 1080 }, 2);
    expect(ballAt(runOf(solo, 'left'), 1)).toBeNull();
    expect(followAt([runOf(solo, 'right'), runOf(solo, 'left')], 1)).toEqual(followAt([runOf(solo, 'right')], 1));
  });
});

describe('energy', () => {
  it('stays between 0 and 1 and is hotter while playing than before', () => {
    for (let t = 0; t <= 4; t += 0.25) {
      expect(energyAt(scene, t)).toBeGreaterThanOrEqual(0);
      expect(energyAt(scene, t)).toBeLessThanOrEqual(1);
    }
    expect(energyAt(scene, 2.2)).toBeGreaterThan(energyAt(scene, 0.5));
  });

  it('burns hotter late in a song than early for the same playing', () => {
    const even = Array.from({ length: 40 }, (_, i) => ({
      pitch: 60,
      start: i * 0.5,
      end: i * 0.5 + 0.3,
      velocity: 0.8,
    }));
    const steady = prepareScene(even, { width: 1920, height: 1080 }, 20);
    expect(energyAt(steady, 18)).toBeGreaterThan(energyAt(steady, 3));
  });
});
