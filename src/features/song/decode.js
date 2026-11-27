// Reading the dropped files: audio into an AudioBuffer, and the mono 22.05 kHz copy the note model reads.

export const MODEL_RATE = 22050;
const PLAYBACK_RATE = 48000;

const AUDIO_EXT = /\.(mp3|wav|m4a|aac|ogg|oga|flac|webm|aiff?)$/i;
const MIDI_EXT = /\.(mid|midi)$/i;

/** 'audio', 'midi' or null for a dropped file. */
export function kindOf(file) {
  if (MIDI_EXT.test(file.name) || /midi/.test(file.type)) return 'midi';
  if (AUDIO_EXT.test(file.name) || file.type.startsWith('audio/')) return 'audio';
  return null;
}

/** "my_song-final.mp3" → "my song final". */
export function titleFromFile(name) {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function decodeAudio(file) {
  const data = await file.arrayBuffer();
  return new OfflineAudioContext(2, 1, PLAYBACK_RATE).decodeAudioData(data);
}

/** Mixes down to mono and resamples to the rate the note model was trained on. */
export async function modelInput(buffer) {
  const ctx = new OfflineAudioContext(1, Math.ceil(buffer.duration * MODEL_RATE), MODEL_RATE);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start();
  const rendered = await ctx.startRendering();
  return rendered.getChannelData(0);
}
