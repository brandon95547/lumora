import { describe, expect, it } from 'vitest';
import { handsOfTracks } from './midi.js';

const track = (name, pitches) => ({ name, notes: pitches.map((pitch) => ({ pitch })) });

describe('handsOfTracks', () => {
  it('goes by the tracks’ names', () => {
    expect(handsOfTracks([track('Piano LH', [70]), track('Piano RH', [40]), track('Strings', [60])])).toEqual([
      'left',
      'right',
      null,
    ]);
  });

  it('takes two tracks as a piano’s staves, the higher the right hand', () => {
    expect(handsOfTracks([track('Track 1', [48, 52]), track('Track 2', [72, 76])])).toEqual(['left', 'right']);
  });

  it('has no hands for one track, or for many unnamed ones', () => {
    expect(handsOfTracks([track('Piano', [48, 72])])).toEqual([null]);
    expect(handsOfTracks([track('a', [48]), track('b', [60]), track('c', [72])])).toEqual([null, null, null]);
  });
});
