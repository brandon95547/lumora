import { describe, expect, it } from 'vitest';
import { normalizeNotes } from '../../notes.js';
import { prepareScene } from '../scene.js';
import { ballAt, bouncePath } from './bounce.js';

const scene = prepareScene(
  normalizeNotes([
    { pitch: 72, start: 1, end: 1.4, hand: 'right' },
    { pitch: 76, start: 1, end: 1.4, hand: 'right' },
    { pitch: 48, start: 1, end: 2, hand: 'left' },
    { pitch: 74, start: 1.5, end: 2, hand: 'right' },
    { pitch: 79, start: 5, end: 6, hand: 'right' },
  ]),
  { width: 1080, height: 1920 },
);
const { layout } = scene;
const right = bouncePath(scene, 'right');
const yOf = (pitch) => scene.items.find((n) => n.pitch === pitch).y;

describe('bouncePath', () => {
  it('lands once per chord, on the right hand’s top note', () => {
    expect(right.map((l) => [l.time, l.note.pitch])).toEqual([
      [1, 76],
      [1.5, 74],
      [5, 79],
    ]);
  });

  it('follows only its own hand', () => {
    expect(bouncePath(scene, 'left').map((l) => l.note.pitch)).toEqual([48]);
  });
});

describe('ballAt', () => {
  it('is on the note, on the floor, at the moment it sounds', () => {
    const ball = ballAt(right, 1.5, layout);
    expect(ball.height).toBeCloseTo(0);
    expect(ball.y).toBeCloseTo(yOf(74));
  });

  it('is in the air between notes, crossing the staff', () => {
    const ball = ballAt(right, 1.25, layout);
    expect(ball.height).toBeGreaterThan(layout.space);
    expect(ball.y).toBeCloseTo((yOf(76) + yOf(74)) / 2);
    expect(ball.note.pitch).toBe(74);
  });

  it('waits on its note through a long rest, then hops', () => {
    expect(ballAt(right, 3, layout)).toMatchObject({ height: 0, y: yOf(74) });
    expect(ballAt(right, 4.6, layout).height).toBeGreaterThan(0);
  });

  it('falls onto the first note and rests after the last', () => {
    expect(ballAt(right, 0.5, layout).height).toBeGreaterThan(0);
    expect(ballAt(right, 9, layout)).toMatchObject({ height: 0, y: yOf(79) });
  });

  it('is absent for a hand with no notes', () => {
    expect(ballAt([], 1, layout)).toBeNull();
  });
});
