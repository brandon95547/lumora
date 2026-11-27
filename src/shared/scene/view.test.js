import { describe, expect, it } from 'vitest';
import { mirrored, perspective, segment } from './view.js';

const view = perspective({
  pivot: [0, 0, 0],
  anchor: [500, 500],
  distance: 2000,
  zoom: 1,
  yaw: 0.5,
  pitch: 0.2,
});

describe('perspective', () => {
  it('draws the pivot at the anchor, at the zoom', () => {
    expect(view.project(0, 0, 0)).toMatchObject({ x: 500, y: 500, s: 1 });
  });

  it('makes things further away smaller and hazier', () => {
    const near = view.project(0, 0, -200);
    const far = view.project(0, 0, 4000);
    expect(far.s).toBeLessThan(near.s);
    expect(far.fog).toBeLessThanOrEqual(near.fog);
  });

  it('keeps higher things above lower ones', () => {
    expect(view.project(0, -100).y).toBeLessThan(view.project(0, 100).y);
  });

  it('drops points behind the camera, and cuts segments there', () => {
    const [ex, ey, ez] = view.eye;
    const behind = [ex - (0 - ex) * 0.5, ey - (0 - ey) * 0.5, ez - (0 - ez) * 0.5];
    expect(view.project(...behind)).toBeNull();
    const cut = segment(view, behind, [0, 0, 0]);
    expect(cut[0]).not.toBeNull();
    expect(cut[1]).not.toBeNull();
  });

  it('mirrors across a floor or an upright panel', () => {
    expect(mirrored(view, 'y', 300, 0.3).project(10, 100, 0)).toEqual(view.project(10, 500, 0));
    expect(mirrored(view, 'z', 50, 0.3).project(10, 0, 20)).toEqual(view.project(10, 0, 80));
  });
});
