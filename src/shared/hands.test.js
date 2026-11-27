import { describe, expect, it } from 'vitest';
import { assignHands } from './hands.js';

const note = (pitch, start) => ({ pitch, start, end: start + 0.4, velocity: 0.8 });

describe('assignHands', () => {
  it('splits a bass line from a melody', () => {
    const notes = [note(40, 0), note(76, 0), note(43, 0.5), note(79, 0.5), note(45, 1), note(81, 1)];
    expect(assignHands(notes)).toEqual(['left', 'right', 'left', 'right', 'left', 'right']);
  });

  it('keeps the left hand when it climbs above middle C', () => {
    const notes = [];
    for (let i = 0; i < 8; i++) notes.push(note(52 + i, i * 0.5), note(79, i * 0.5));
    const hands = assignHands(notes.sort((a, b) => a.start - b.start || a.pitch - b.pitch));
    const climbing = notes.map((n, k) => [n.pitch, hands[k]]).filter(([p]) => p !== 79);
    expect(climbing.every(([, h]) => h === 'left')).toBe(true); // 52 up to 59, then 60–ish stays left
  });

  it('keeps the right hand when it dips below middle C', () => {
    const notes = [];
    for (let i = 0; i < 8; i++) notes.push(note(36, i * 0.5), note(66 - i, i * 0.5));
    const hands = assignHands(notes.sort((a, b) => a.start - b.start || a.pitch - b.pitch));
    const falling = notes.map((n, k) => [n.pitch, hands[k]]).filter(([p]) => p !== 36);
    expect(falling.every(([, h]) => h === 'right')).toBe(true);
  });

  it('divides a wide chord between the hands', () => {
    const notes = [note(36, 0), note(40, 0), note(43, 0), note(72, 0), note(76, 0)];
    expect(assignHands(notes)).toEqual(['left', 'left', 'left', 'right', 'right']);
  });

  it('gives a lone melody to the right hand', () => {
    const notes = [70, 72, 74, 72, 70, 67].map((p, i) => note(p, i * 0.4));
    expect(new Set(assignHands(notes))).toEqual(new Set(['right']));
  });

  it('keeps the hands the file gave, and follows them for the notes it didn’t', () => {
    // The file puts a melody below middle C in the right hand; the last two notes have no hand.
    const notes = [];
    for (let i = 0; i < 6; i++) {
      notes.push({ ...note(36, i * 0.5), hand: 'left' }, { ...note(57 - (i % 2), i * 0.5), hand: 'right' });
    }
    notes.push(note(36, 3), note(56, 3));
    const hands = assignHands(notes);
    expect(hands.slice(0, 12)).toEqual(notes.slice(0, 12).map((n) => n.hand));
    expect(hands.slice(12)).toEqual(['left', 'right']);
  });
});
