import { describe, expect, it } from 'vitest';
import { kindOf, titleFromFile } from './decode.js';

describe('kindOf', () => {
  it('tells audio from MIDI by name or type', () => {
    expect(kindOf({ name: 'song.mp3', type: '' })).toBe('audio');
    expect(kindOf({ name: 'take', type: 'audio/wav' })).toBe('audio');
    expect(kindOf({ name: 'song.MID', type: '' })).toBe('midi');
    expect(kindOf({ name: 'notes.txt', type: 'text/plain' })).toBeNull();
  });
});

describe('titleFromFile', () => {
  it('turns a file name into a title', () => {
    expect(titleFromFile('river_flows-in_you.mp3')).toBe('river flows in you');
  });
});
