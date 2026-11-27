// The song being animated: its notes, where they came from, and the instrument that plays them.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { normalizeNotes } from '../../shared/notes.js';
import { kindOf, titleFromFile } from './decode.js';
import { DEMO_TITLE, demoNotes } from './demo.js';
import { instrumentById, voiceFor } from './instruments.js';
import { synthesize } from './synth.js';

const EMPTY = {
  status: 'loading', // loading | reading | voicing (fetching the instrument, then making the sound) | ready | error
  title: '',
  audio: null,
  notes: [],
  notesFrom: null, // 'demo' | 'midi' | 'score'
  step: null, // while voicing: 'instrument' (fetching its samples) or 'sound' (rendering)
  progress: 0, // 0–1 through the step
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

const FIRST_INSTRUMENT = instrumentById(null).id;
const INSTRUMENT_FAILED = 'The instrument’s sounds could not be loaded. Check the connection and try again.';

export function useSong() {
  const [song, setSong] = useState(EMPTY);
  const load = useRef(0); // the latest load wins; older ones stop updating state
  const songRef = useRef(song);
  useLayoutEffect(() => {
    songRef.current = song;
  });

  // A plain sentence for the person, the detail for the console.
  const fail = useCallback((id, message, error) => {
    console.error(error);
    const said = error?.instrument ? INSTRUMENT_FAILED : message;
    if (load.current === id) setSong((s) => ({ ...s, status: 'error', error: said }));
  }, []);

  const [instrumentId, setInstrumentId] = useState(FIRST_INSTRUMENT);
  const instrument = useRef(FIRST_INSTRUMENT); // read by play(), which runs outside render

  /** Plays notes on the chosen instrument: fetches what it needs, then renders the sound. */
  const play = useCallback(async (id, raw, title, notesFrom) => {
    const notes = normalizeNotes(raw);
    if (!notes.length) throw new Error('no notes');
    const progress = (step) => (p) => {
      if (load.current === id) setSong((s) => ({ ...s, status: 'voicing', step, progress: p }));
    };
    progress('instrument')(0);
    const voice = await voiceFor(instrument.current, notes, progress('instrument')).catch((cause) => {
      throw Object.assign(new Error('the instrument could not be loaded', { cause }), { instrument: true });
    });
    progress('sound')(0);
    const audio = await synthesize(notes, voice, progress('sound'));
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

  /** Plays the current song again on another instrument. */
  const setInstrument = useCallback(
    async (next) => {
      instrument.current = next;
      setInstrumentId(next);
      const current = songRef.current;
      if (!current.notes.length) return;
      const id = ++load.current;
      try {
        await play(id, current.notes, current.title, current.notesFrom);
      } catch (error) {
        fail(id, INSTRUMENT_FAILED, error);
      }
    },
    [play, fail],
  );

  return { song, loadFiles, instrumentId, setInstrument };
}
