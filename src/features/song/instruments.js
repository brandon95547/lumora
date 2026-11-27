// The instruments a song can be played on. Sampled ones are fetched the first time they are used.
import { sampledVoice } from './sampler.js';
import { softVoice } from './soft-voice.js';

export const INSTRUMENTS = [
  {
    id: 'grand',
    label: 'Grand Piano',
    sampled: true,
    release: 0.35,
    credit: 'Salamander Grand Piano by Alexander Holm (CC BY 3.0)',
  },
  {
    id: 'upright',
    label: 'Upright Piano',
    sampled: true,
    release: 0.4,
    credit: 'Upright Piano KW by FreePats (CC0)',
  },
  {
    id: 'rhodes',
    label: 'Rhodes Electric Piano',
    sampled: true,
    release: 0.3,
    credit: 'jRhodes3d by Jeff Learman (CC BY 4.0)',
  },
  { id: 'soft', label: 'Soft Synth', sampled: false, credit: 'Made in the browser; nothing to download' },
];

export const instrumentById = (id) => INSTRUMENTS.find((i) => i.id === id) ?? INSTRUMENTS[0];

/** The voice that plays `notes` on an instrument, its samples fetched (`onProgress` 0–1). */
export function voiceFor(id, notes, onProgress) {
  const instrument = instrumentById(id);
  return instrument.sampled ? sampledVoice(instrument, notes, onProgress) : Promise.resolve(softVoice);
}
