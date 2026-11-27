import { describe, expect, it } from 'vitest';
import { prepareScene } from '../scene.js';
import { followX, keysDown, pianoOf, pianoView, pressOf } from './model.js';

const note = { pitch: 60, start: 1, end: 2, velocity: 1 };

describe('pressOf', () => {
  it('is up before the note, down while it sounds, and back up just after', () => {
    expect(pressOf(note, 0.9)).toBe(0);
    expect(pressOf(note, 1.5)).toBe(1);
    expect(pressOf(note, 2.04)).toBeGreaterThan(0);
    expect(pressOf(note, 2.2)).toBe(0);
  });
});

describe('piano scene', () => {
  const notes = [note, { pitch: 64, start: 1.2, end: 1.4, velocity: 0.5 }];
  const portrait = prepareScene(notes, { width: 1080, height: 1920 }, 3);
  const landscape = prepareScene(notes, { width: 1920, height: 1080 }, 3);

  it('frames what the song plays: three octaves in 9:16, five in 16:9', () => {
    expect(pianoOf(portrait).whites).toBe(22);
    expect(pianoOf(landscape).whites).toBe(36);
  });

  it('knows which keys are down', () => {
    expect([...keysDown(portrait, 1.3).keys()].sort()).toEqual([60, 64]);
    expect([...keysDown(portrait, 1.6).keys()]).toEqual([60]);
  });

  it('follows the music along the keys in 9:16, and stays inside the keyboard', () => {
    const wide = prepareScene(
      [
        { pitch: 36, start: 0, end: 1, velocity: 1 },
        { pitch: 96, start: 10, end: 11, velocity: 1 },
      ],
      { width: 1080, height: 1920 },
      12,
    );
    const model = pianoOf(wide);
    expect(model.framed).toBeLessThan(model.whites);
    expect(followX(wide, 0)).toBeLessThan(followX(wide, 10));
    expect(followX(wide, 0)).toBeGreaterThanOrEqual(model.framed / 2);
    expect(followX(wide, 10)).toBeLessThanOrEqual(model.whites - model.framed / 2);
    expect(followX(wide, 5)).toBeCloseTo(followX(wide, 5)); // same time, same place
  });

  it('looks straight down in 2D, with the keys across the frame', () => {
    const view = pianoView(portrait, null, 0, false);
    const model = pianoOf(portrait);
    const left = view.project(0, 0, 3);
    const right = view.project(model.framed, 0, 3);
    expect(right.x - left.x).toBeGreaterThan(1000);
    expect(view.project(5, 0, 0).y).toBeGreaterThan(view.project(5, 0, 6).y); // key fronts nearer the bottom
  });
});
