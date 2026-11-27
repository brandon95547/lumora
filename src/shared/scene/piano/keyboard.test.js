import { describe, expect, it } from 'vitest';
import { isBlack, keysBetween, pitchOfWhite, rangeFor, whiteIndex } from './keyboard.js';

describe('keyboard', () => {
  it('has 52 white and 36 black keys', () => {
    const { keys, whites } = keysBetween(21, 108);
    expect(whites).toBe(52);
    expect(keys.filter((k) => k.black)).toHaveLength(36);
  });

  it('counts white keys from A0', () => {
    expect(whiteIndex(21)).toBe(0);
    expect(whiteIndex(60)).toBe(23); // middle C
    expect(pitchOfWhite(23)).toBe(60);
    expect(whiteIndex(108)).toBe(51);
  });

  it('puts each black key between its white neighbors', () => {
    const { keys } = keysBetween(60, 71);
    const c = keys.find((k) => k.pitch === 60);
    const cSharp = keys.find((k) => k.pitch === 61);
    const d = keys.find((k) => k.pitch === 62);
    expect(isBlack(61)).toBe(true);
    expect(cSharp.x0).toBeGreaterThan(c.x0);
    expect(cSharp.x1).toBeLessThan(d.x1);
  });

  it('frames the part of the piano a song uses, at least the asked width', () => {
    const { low, high } = rangeFor([{ pitch: 60 }, { pitch: 64 }], 22, 30);
    expect(isBlack(low) || isBlack(high)).toBe(false);
    expect(whiteIndex(high) - whiteIndex(low) + 1).toBe(22);
    expect(low).toBeLessThan(60);
    expect(high).toBeGreaterThan(64);
  });

  it('shows the whole piano when there is room', () => {
    expect(rangeFor([{ pitch: 60 }], 22)).toEqual({ low: 21, high: 108 });
  });
});
