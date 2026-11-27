import { describe, expect, it } from 'vitest';
import { kindOf, titleFromFile } from './decode.js';

describe('kindOf', () => {
  it('tells MIDI, scores and recordings apart by name or type', () => {
    expect(kindOf({ name: 'song.MID', type: '' })).toBe('midi');
    expect(kindOf({ name: 'song.kar', type: '' })).toBe('midi');
    expect(kindOf({ name: 'song.mxl', type: '' })).toBe('score');
    expect(kindOf({ name: 'song.musicxml', type: '' })).toBe('score');
    expect(kindOf({ name: 'song', type: 'application/vnd.recordare.musicxml+xml' })).toBe('score');
    expect(kindOf({ name: 'song.mp3', type: '' })).toBe('audio');
    expect(kindOf({ name: 'take', type: 'audio/wav' })).toBe('audio');
    expect(kindOf({ name: 'notes.txt', type: 'text/plain' })).toBeNull();
  });
});

describe('titleFromFile', () => {
  it('turns a file name into a title', () => {
    expect(titleFromFile('river_flows-in_you.musicxml')).toBe('river flows in you');
  });
});
