import { describe, expect, it } from 'vitest';
import { layoutFor } from '../staff/layout.js';
import { bounceAt, motePath, starOf } from './stars.js';

const layout = layoutFor({ width: 1080, height: 1920 });

describe('the keyboard in the sky', () => {
  it('runs from the lowest key at the left to the highest at the right, arching over the sun', () => {
    const low = starOf(layout, 21);
    const middle = starOf(layout, 64);
    const high = starOf(layout, 108);
    expect(low.x).toBeLessThan(middle.x);
    expect(middle.x).toBeLessThan(high.x);
    expect(middle.y).toBeLessThan(low.y); // the arch's top is above its ends
    for (const p of [low, middle, high]) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(layout.width);
    }
  });
});

describe('motes', () => {
  const from = { x: 100, y: 300 };
  const to = { x: 700, y: 1100 };

  it('leave the star and reach the planet exactly as the note sounds', () => {
    expect(motePath(from, to, 0, 3)).toEqual(from);
    const end = motePath(from, to, 1, 3);
    expect(end.x).toBeCloseTo(to.x);
    expect(end.y).toBeCloseTo(to.y);
  });

  it('glance off away from where they came', () => {
    const hit = { x: 700, y: 1100 };
    const later = bounceAt(hit, 600, 800, 0.5, 3, 200); // arrived moving right and down
    expect(later.y).toBeLessThan(hit.y); // goes back up, not on through the planet
    expect(bounceAt(hit, 600, 800, 0, 3, 200)).toEqual(hit);
  });
});
