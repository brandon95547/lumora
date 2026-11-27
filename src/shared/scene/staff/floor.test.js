import { describe, expect, it } from 'vitest';
import { layoutFor } from './layout.js';
import { floorView } from './floor.js';

const layout = layoutFor({ width: 1080, height: 1920 });
const middle = (layout.grandTop + layout.grandBottom) / 2;
const behind = { turn: 90, tilt: 30, zoom: 1, drift: false };

describe('floorView', () => {
  const view = floorView(layout, behind, 10);

  it('runs the music still to come away into the distance', () => {
    const near = view.project(layout.playheadX, middle);
    const far = view.project(layout.playheadX + 2000, middle);
    expect(far.s).toBeLessThan(near.s);
    expect(far.y).toBeLessThan(near.y);
  });

  it('puts the treble staff on the right and the bass on the left, seen from behind', () => {
    expect(view.project(layout.playheadX, layout.trebleTop).x).toBeGreaterThan(layout.width / 2);
    expect(view.project(layout.playheadX, layout.bassTop + layout.space * 4).x).toBeLessThan(layout.width / 2);
  });

  it('lifts things off the floor with negative z', () => {
    expect(view.project(layout.playheadX, middle, -100).y).toBeLessThan(view.project(layout.playheadX, middle).y);
  });

  it('shows the clefs only while the song’s start is in view', () => {
    expect(floorView(layout, behind, 0).clefs).toBe(true);
    expect(view.clefs).toBe(false);
  });
});
