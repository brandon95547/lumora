import { describe, expect, it } from 'vitest';
import { fillPolygon, mirrored, perspective, placed, segment } from './view.js';

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

  it('places a thing turned and moved in the world, seen from where the camera really is', () => {
    const turned = placed(view, Math.PI / 2, [100, 0, 50]);
    expect(turned.toWorld(10, 5, 0)).toEqual([100 + 10 * Math.cos(Math.PI / 2), 5, 50 + 10]);
    expect(turned.project(0, 0, 0)).toEqual(view.project(100, 0, 50));
    const back = turned.toWorld(...turned.eye);
    view.eye.forEach((v, i) => expect(back[i]).toBeCloseTo(v));
  });

  it('fills the part of a polygon in front of the camera, cutting it there', () => {
    const calls = [];
    const ctx = new Proxy(
      {},
      { get: (_, k) => (k === 'lineTo' || k === 'moveTo' ? (x, y) => calls.push([x, y]) : () => {}), set: () => true },
    );
    const [ex, , ez] = view.eye;
    const far = [-ex, 0, -ez];
    const behind = [ex * 1.5, 0, ez * 1.5];
    const points = fillPolygon(
      ctx,
      view,
      [far, [far[0] + 50, 0, far[2]], [behind[0] + 50, 0, behind[2]], behind],
      '#000',
    );
    expect(points).not.toBeNull();
    expect(points.every((p) => p)).toBe(true);
  });

  it('mirrors across a floor or an upright panel', () => {
    expect(mirrored(view, 'y', 300, 0.3).project(10, 100, 0)).toEqual(view.project(10, 500, 0));
    expect(mirrored(view, 'z', 50, 0.3).project(10, 0, 20)).toEqual(view.project(10, 0, 80));
  });
});
