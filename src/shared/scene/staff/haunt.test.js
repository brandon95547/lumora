import { describe, expect, it } from 'vitest';
import { normalizeNotes } from '../../notes.js';
import { prepareScene } from '../scene.js';
import { ghostAt, ghostsOf, heatAt, heatSwells } from './haunt.js';

// A minute of music that swells and fades in waves, louder each time.
const notes = [];
for (let t = 0.5; t < 60; t += 0.18) {
  const wave = Math.abs(Math.sin(t / 6));
  if (wave > 0.3) notes.push({ pitch: 60 + (Math.round(t * 7) % 12), start: t, end: t + 0.3, velocity: wave });
}
const scene = prepareScene(normalizeNotes(notes), { width: 1080, height: 1920 });

describe('heat', () => {
  it('swells now and then, never two close together', () => {
    const swells = heatSwells(scene);
    expect(swells.length).toBeGreaterThan(1);
    for (let i = 1; i < swells.length; i++) expect(swells[i].peak - swells[i - 1].peak).toBeGreaterThanOrEqual(8);
  });

  it('is full at a swell’s peak and gone between swells', () => {
    const [first] = heatSwells(scene);
    expect(heatAt(scene, first.peak)).toBeCloseTo(first.strength);
    expect(heatAt(scene, first.peak - 3)).toBe(0);
  });
});

describe('ghosts', () => {
  const ghosts = ghostsOf(scene);

  it('come more often as the song goes on', () => {
    const half = scene.duration / 2;
    const early = ghosts.filter((g) => g.start < half).length;
    const late = ghosts.filter((g) => g.start >= half).length;
    expect(late).toBeGreaterThan(early);
  });

  it('cross the stage from one side to the other, fading in and out', () => {
    const g = ghosts[0];
    const from = ghostAt(g, g.start + 0.01, scene.layout);
    const to = ghostAt(g, g.start + g.duration - 0.01, scene.layout);
    expect(Math.sign(to.y - from.y)).toBe(g.dir);
    expect(Math.abs(to.y - from.y)).toBeGreaterThan(scene.layout.width);
    expect(from.clear).toBeLessThan(0.2);
    expect(ghostAt(g, g.start + g.duration / 2, scene.layout).clear).toBe(1);
    expect(ghostAt(g, g.start - 1, scene.layout)).toBeNull();
  });
});
