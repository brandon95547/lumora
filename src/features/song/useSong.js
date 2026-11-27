// The song being animated: its audio, its notes, and where the notes came from.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { normalizeNotes } from '../../shared/notes.js';
import { decodeAudio, kindOf, modelInput, titleFromFile } from './decode.js';
import { DEMO_TITLE, demoNotes } from './demo.js';
import { sensitivityById } from './sensitivity.js';
import { synthesize } from './synth.js';
import { retune, transcribe } from './transcribe.js';

const EMPTY = {
  status: 'loading', // loading | decoding | transcribing | ready | error
  title: '',
  audio: null,
  audioFrom: null, // 'file' | 'synth'
  notes: [],
  notesFrom: null, // 'demo' | 'audio' | 'midi'
  progress: 0,
  slow: false, // the note finder is on the processor, not the graphics card
  error: '',
};

const AUDIO_FAILURES = {
  open: 'This browser couldn’t open that file as audio. It may be damaged or in an unusual format; try saving it as MP3 or WAV.',
  prepare:
    'The recording opened but couldn’t be prepared for listening. It may be too long for this browser; try a shorter file.',
  listen: 'The note finder stopped in this browser. Try Chrome or Edge, or drop in a MIDI file of the song.',
};

export function useSong() {
  const [song, setSong] = useState(EMPTY);
  const [sensitivity, setSensitivityId] = useState('balanced');
  const load = useRef(0); // the latest load wins; older ones stop updating state
  const songRef = useRef(song);
  useLayoutEffect(() => {
    songRef.current = song;
  });

  // A plain sentence for the person, the detail for the console.
  const fail = useCallback((id, message, error) => {
    console.error(error);
    if (load.current === id) setSong((s) => ({ ...s, status: 'error', error: message }));
  }, []);

  useEffect(() => {
    const id = ++load.current;
    const notes = normalizeNotes(demoNotes());
    synthesize(notes).then(
      (audio) => {
        if (load.current !== id) return;
        setSong({ ...EMPTY, status: 'ready', title: DEMO_TITLE, audio, audioFrom: 'synth', notes, notesFrom: 'demo' });
      },
      (error) => fail(id, 'The demo could not be played in this browser.', error),
    );
  }, [fail]);

  const loadFiles = useCallback(
    async (files) => {
      const list = [...files];
      const audioFile = list.find((f) => kindOf(f) === 'audio');
      const midiFile = list.find((f) => kindOf(f) === 'midi');
      if (!audioFile && !midiFile) {
        setSong((s) => ({ ...s, status: 'error', error: 'Drop an audio file (MP3, WAV, M4A…) or a MIDI file.' }));
        return;
      }
      const id = ++load.current;
      const current = songRef.current;

      if (midiFile) {
        try {
          setSong((s) => ({ ...s, status: 'decoding', error: '' }));
          const { readMidi } = await import('./midi.js');
          const notes = normalizeNotes(await readMidi(midiFile));
          if (!notes.length) throw new Error('no notes');
          // Keep a recording already loaded (or one dropped alongside); otherwise play the notes.
          const keepAudio = !audioFile && current.audioFrom === 'file';
          const audio = audioFile ? await decodeAudio(audioFile) : keepAudio ? current.audio : await synthesize(notes);
          if (load.current !== id) return;
          setSong({
            ...EMPTY,
            status: 'ready',
            title: keepAudio ? current.title : titleFromFile((audioFile ?? midiFile).name),
            audio,
            audioFrom: audioFile || keepAudio ? 'file' : 'synth',
            notes,
            notesFrom: 'midi',
          });
        } catch (error) {
          fail(id, 'That MIDI file could not be read, or it has no notes.', error);
        }
        return;
      }

      // Which step failed decides what to tell the person.
      let step = 'open';
      try {
        setSong((s) => ({ ...s, status: 'decoding', error: '', progress: 0 }));
        const audio = await decodeAudio(audioFile);
        step = 'prepare';
        const samples = await modelInput(audio);
        step = 'listen';
        if (load.current !== id) return;
        setSong((s) => ({ ...s, status: 'transcribing', progress: 0 }));
        const raw = await transcribe(samples, sensitivityById(sensitivity), (progress, slow) => {
          if (load.current === id) setSong((s) => ({ ...s, progress, slow }));
        });
        if (load.current !== id) return;
        setSong({
          ...EMPTY,
          status: 'ready',
          title: titleFromFile(audioFile.name),
          audio,
          audioFrom: 'file',
          notes: normalizeNotes(raw),
          notesFrom: 'audio',
        });
      } catch (error) {
        fail(id, AUDIO_FAILURES[step], error);
      }
    },
    [sensitivity, fail],
  );

  const setSensitivity = useCallback(
    async (next) => {
      setSensitivityId(next);
      if (songRef.current.notesFrom !== 'audio') return;
      const id = ++load.current;
      try {
        const notes = normalizeNotes(await retune(sensitivityById(next)));
        if (load.current === id) setSong((s) => ({ ...s, notes }));
      } catch (error) {
        fail(id, 'The notes could not be found again with that setting.', error);
      }
    },
    [fail],
  );

  return { song, sensitivity, loadFiles, setSensitivity };
}
