import { describe, expect, it } from 'vitest';
import { layoutFor } from './layout.js';
import { cameraView, flatView } from './view.js';

const layout = layoutFor({ width: 1920, height: 1080 });

describe('flatView', () => {
  it('leaves the 2D picture as laid out', () => {
    expect(flatView(layout).project(300, 400)).toEqual({ x: 300, y: 400, s: 1, fog: 1 });
  });
});

describe('cameraView', () => {
  const camera = { turn: 34, tilt: 12, zoom: 1, drift: false };

  it('sends music still to come into the distance', () => {
    const view = cameraView(layout, camera, 0);
    expect(view.project(layout.playheadX + 1500, 500).s).toBeLessThan(view.project(layout.playheadX + 10, 500).s);
  });

  it('draws the same frame for the same time, drift and all', () => {
    const drifting = { ...camera, drift: true };
    expect(cameraView(layout, drifting, 4).project(800, 500)).toEqual(
      cameraView(layout, drifting, 4).project(800, 500),
    );
  });
});
