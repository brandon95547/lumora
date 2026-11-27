// Notes from a MIDI file (every track but drums). Loaded the first time a MIDI file is dropped.
import { Midi } from '@tonejs/midi';

const DRUM_CHANNEL = 9;

export async function readMidi(file) {
  const midi = new Midi(await file.arrayBuffer());
  return midi.tracks
    .filter((track) => track.channel !== DRUM_CHANNEL)
    .flatMap((track) =>
      track.notes.map((n) => ({ pitch: n.midi, start: n.time, end: n.time + n.duration, velocity: n.velocity })),
    );
}
