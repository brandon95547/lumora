// The song being animated: its notes, where they came from, and the piano voice that plays them.
import { useCallback, useEffect, useRef, useState } from 'react';
import { normalizeNotes } from '../../shared/notes.js';
import { kindOf, titleFromFile } from './decode.js';
import { DEMO_TITLE, demoNotes } from './demo.js';
import { synthesize } from './synth.js';

const EMPTY = {
  status: 'loading', // loading | reading | voicing (making the piano sound) | ready | error
  title: '',
  audio: null,
  notes: [],
  notesFrom: null, // 'demo' | 'midi' | 'score'
  progress: 0, // 0–1 while voicing
  error: '',
};

// Each kind of file is read by its own module, loaded the first time one is dropped.
const READERS = {
  midi: () => import('./midi.js').then((m) => m.readMidi),
  score: () => import('./musicxml.js').then((m) => m.readMusicXml),
};
const UNREADABLE = {
  midi: 'That MIDI file could not be read, or it has no notes.',
  score: 'That score could not be read, or it has no notes. Export it from your notation app as MusicXML.',
};

export function useSong() {
  const [song, setSong] = useState(EMPTY);
  const load = useRef(0); // the latest load wins; older ones stop updating state

  // A plain sentence for the person, the detail for the console.
  const fail = useCallback((id, message, error) => {
    console.error(error);
    if (load.current === id) setSong((s) => ({ ...s, status: 'error', error: message }));
  }, []);

  const play = useCallback(async (id, raw, title, notesFrom) => {
    const notes = normalizeNotes(raw);
    if (!notes.length) throw new Error('no notes');
    if (load.current === id) setSong((s) => ({ ...s, status: 'voicing', progress: 0 }));
    const audio = await synthesize(notes, (progress) => {
      if (load.current === id) setSong((s) => ({ ...s, progress }));
    });
    if (load.current === id) setSong({ ...EMPTY, status: 'ready', title, audio, notes, notesFrom });
  }, []);

  useEffect(() => {
    const id = ++load.current;
    play(id, demoNotes(), DEMO_TITLE, 'demo').catch((error) =>
      fail(id, 'The demo could not be played in this browser.', error),
    );
  }, [play, fail]);

  const loadFiles = useCallback(
    async (files) => {
      const list = [...files];
      const file = list.find((f) => READERS[kindOf(f)]);
      if (!file) {
        const recording = list.some((f) => kindOf(f) === 'audio');
        setSong((s) => ({
          ...s,
          status: 'error',
          error: recording
            ? 'Lumora reads the notes from a MIDI file or a MusicXML score, not from a recording.'
            : 'Drop a MIDI file or a MusicXML score (.mid, .musicxml, .mxl).',
        }));
        return;
      }
      const id = ++load.current;
      const kind = kindOf(file);
      setSong((s) => ({ ...s, status: 'reading', error: '' }));
      try {
        const read = await READERS[kind]();
        await play(id, await read(file), titleFromFile(file.name), kind);
      } catch (error) {
        fail(id, UNREADABLE[kind], error);
      }
    },
    [play, fail],
  );

  return { song, loadFiles };
}
