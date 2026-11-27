import { describe, expect, it } from 'vitest';
import { layoutFor } from './layout.js';
import { flatView } from './view.js';

const layout = layoutFor({ width: 1920, height: 1080 });

describe('flatView', () => {
  it('leaves the 2D picture as laid out', () => {
    expect(flatView(layout).project(300, 400)).toEqual({ x: 300, y: 400, s: 1, fog: 1 });
  });
});
