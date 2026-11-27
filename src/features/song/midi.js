// Notes from a MIDI file (every track but drums), each with its hand when the tracks say which.
// Loaded the first time a MIDI file is dropped.
import { Midi } from '@tonejs/midi';

const DRUM_CHANNEL = 9;
const RIGHT_NAME = /\b(right|rh|r\.h\.?|treble)\b/i;
const LEFT_NAME = /\b(left|lh|l\.h\.?|bass)\b/i;

const meanPitch = (notes) => notes.reduce((s, n) => s + n.pitch, 0) / notes.length;

/**
 * Which hand each track is, or null. Tracks named for their hand ("Piano RH", "Left") win; otherwise
 * a file of exactly two tracks is taken as a piano's two staves, the higher one the right hand.
 * Anything else has no hands, and they are worked out from the notes.
 */
export function handsOfTracks(tracks) {
  const named = tracks.map((t) => (RIGHT_NAME.test(t.name) ? 'right' : LEFT_NAME.test(t.name) ? 'left' : null));
  if (named.includes('right') && named.includes('left')) return named;
  if (tracks.length === 2) {
    const right = meanPitch(tracks[0].notes) >= meanPitch(tracks[1].notes) ? 0 : 1;
    return tracks.map((_, i) => (i === right ? 'right' : 'left'));
  }
  return tracks.map(() => null);
}

export async function readMidi(file) {
  const midi = new Midi(await file.arrayBuffer());
  // The library splits a single-track file by channel, so a two-channel piano is two tracks here.
  const tracks = midi.tracks
    .filter((track) => track.channel !== DRUM_CHANNEL && track.notes.length)
    .map((track) => ({
      name: track.name,
      notes: track.notes.map((n) => ({
        pitch: n.midi,
        start: n.time,
        end: n.time + n.duration,
        velocity: n.velocity,
      })),
    }));
  const hands = handsOfTracks(tracks);
  return tracks.flatMap((track, i) => track.notes.map((n) => (hands[i] ? { ...n, hand: hands[i] } : n)));
}
