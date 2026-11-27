// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { presetsFor } from './presets.js';

describe('presetsFor', () => {
  beforeEach(() => localStorage.clear());

  it('reads the saved angles of one rig', () => {
    localStorage.setItem(
      'lumora:camera-presets',
      JSON.stringify({ 'staff-floor': [{ name: 'High', turn: 74, tilt: 40, zoom: 1 }], piano: [] }),
    );
    expect(presetsFor('staff-floor')).toEqual([{ name: 'High', turn: 74, tilt: 40, zoom: 1 }]);
    expect(presetsFor('fire')).toEqual([]);
  });

  it('skips anything stored that isn’t an angle, and survives a damaged store', () => {
    localStorage.setItem(
      'lumora:camera-presets',
      JSON.stringify({ x: [{ name: 'ok', turn: 1, tilt: 2, zoom: 1 }, { name: 'bad', turn: 'a' }, null] }),
    );
    expect(presetsFor('x').map((p) => p.name)).toEqual(['ok']);
    localStorage.setItem('lumora:camera-presets', '{not json');
    expect(presetsFor('x')).toEqual([]);
  });
});
