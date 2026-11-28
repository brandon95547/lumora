import { describe, expect, it } from 'vitest';
import { normalizeNotes } from '../../notes.js';
import { pianoOf } from '../piano/model.js';
import { prepareScene } from '../scene.js';
import { galaxyView } from './index.js';
import { landingOf } from './layout.js';

// A low passage at the start, a high one later, both clear of the keyboard's ends (where the camera
// stops rather than look past the keys).
const notes = [];
for (let t = 0; t < 6; t += 0.25)
  notes.push({ pitch: 45 + (Math.round(t * 4) % 5), start: t, end: t + 0.2, velocity: 0.7 });
for (let t = 12; t < 18; t += 0.25)
  notes.push({ pitch: 84 + (Math.round(t * 4) % 5), start: t, end: t + 0.2, velocity: 0.7 });
const scene = prepareScene(normalizeNotes(notes), { width: 1080, height: 1920 });
const model = pianoOf(scene);
const close = { turn: 0, tilt: 26, zoom: 3, drift: false };
const offCenter = (camera, t, pitch) =>
  Math.abs(galaxyView(scene, camera, t).project(...landingOf(model, pitch)).x - 540);

describe('following the keys', () => {
  it('keeps the keys being played in the middle of a close camera', () => {
    const follow = { ...close, follow: true };
    expect(offCenter(follow, 3, 47)).toBeLessThan(offCenter(close, 3, 47));
    expect(offCenter(follow, 15, 86)).toBeLessThan(offCenter(close, 15, 86));
    expect(offCenter(follow, 3, 47)).toBeLessThan(150);
  });

  it('stays put when following is off', () => {
    expect(galaxyView(scene, close, 3).project(0, 0, 0)).toEqual(galaxyView(scene, close, 15).project(0, 0, 0));
  });
});
