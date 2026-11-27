import { describe, expect, it } from 'vitest';
import { estimateKey, ledgerLines, placePitch, spell } from './pitch.js';

describe('spell', () => {
  it('spells black keys as sharps or flats', () => {
    expect(spell(61)).toEqual({ letter: 0, accidental: 1, octave: 4 });
    expect(spell(61, true)).toEqual({ letter: 1, accidental: -1, octave: 4 });
  });
});

describe('placePitch', () => {
  it('puts E4 on the treble bottom line and F5 on its top line', () => {
    expect(placePitch(64)).toMatchObject({ clef: 'treble', offset: 0 });
    expect(placePitch(77)).toMatchObject({ clef: 'treble', offset: 8 });
  });

  it('puts middle C on the first ledger line below the treble staff', () => {
    expect(placePitch(60)).toMatchObject({ clef: 'treble', offset: -2 });
  });

  it('reads pitches under middle C on the bass staff', () => {
    expect(placePitch(43)).toMatchObject({ clef: 'bass', offset: 0 }); // G2
    expect(placePitch(57)).toMatchObject({ clef: 'bass', offset: 8 }); // A3
    expect(placePitch(59)).toMatchObject({ clef: 'bass', offset: 9 }); // B3, the space above the staff
  });
});

describe('ledgerLines', () => {
  it('draws none inside the staff and one per line outside it', () => {
    expect(ledgerLines(4)).toEqual([]);
    expect(ledgerLines(-2)).toEqual([-2]);
    expect(ledgerLines(-5)).toEqual([-2, -4]);
    expect(ledgerLines(12)).toEqual([10, 12]);
  });
});

describe('estimateKey', () => {
  const scale = (pitches) => pitches.map((pitch, i) => ({ pitch, start: i, end: i + 1 }));

  it('finds C major from its scale and spells with sharps', () => {
    expect(estimateKey(scale([60, 62, 64, 65, 67, 69, 71, 72, 60, 67]))).toMatchObject({
      tonic: 0,
      mode: 'major',
      preferFlats: false,
    });
  });

  it('spells E-flat major with flats', () => {
    expect(estimateKey(scale([63, 65, 67, 68, 70, 72, 74, 75, 63, 70])).preferFlats).toBe(true);
  });
});
