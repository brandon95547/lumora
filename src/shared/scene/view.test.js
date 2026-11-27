import { describe, expect, it } from 'vitest';
import { layoutFor } from './layout.js';
import { cameraView, flatView, mirrored, segment } from './view.js';

const layout = layoutFor({ width: 1920, height: 1080 });
const camera = { turn: 34, tilt: 12, zoom: 1, drift: false };

describe('flatView', () => {
  it('leaves the 2D picture as laid out', () => {
    expect(flatView(layout).project(300, 400)).toEqual({ x: 300, y: 400, s: 1, fog: 1 });
  });
});

describe('cameraView', () => {
  const view = cameraView(layout, camera, 0);

  it('sends music still to come into the distance', () => {
    const now = view.project(layout.playheadX + 10, 500);
    const later = view.project(layout.playheadX + 1500, 500);
    expect(later.s).toBeLessThan(now.s);
    expect(later.fog).toBeLessThanOrEqual(now.fog);
  });

  it('keeps higher notes above lower ones', () => {
    expect(view.project(layout.playheadX, 300).y).toBeLessThan(view.project(layout.playheadX, 600).y);
  });

  it('drops points behind the camera, and cuts segments there', () => {
    const behind = layout.playheadX - 20000;
    expect(view.project(behind, 500)).toBeNull();
    const cut = segment(view, [behind, 500, 0], [layout.playheadX, 500, 0]);
    expect(cut[0]).not.toBeNull();
    expect(cut[1]).not.toBeNull();
  });

  it('mirrors below the floor for reflections', () => {
    const floor = 900;
    const reflection = mirrored(view, floor, 0.3);
    expect(reflection.project(layout.playheadX, 700)).toEqual(view.project(layout.playheadX, 1100));
    expect(reflection.opacity).toBeCloseTo(0.3);
  });

  it('draws the same frame for the same time', () => {
    const drifting = { ...camera, drift: true };
    expect(cameraView(layout, drifting, 4).project(800, 500)).toEqual(
      cameraView(layout, drifting, 4).project(800, 500),
    );
  });
});
