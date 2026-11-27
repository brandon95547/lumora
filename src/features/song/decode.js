// What a dropped file is, and the title it gives the song.

const MIDI_EXT = /\.(mid|midi|kar)$/i;
const SCORE_EXT = /\.(musicxml|mxl|xml)$/i;
const AUDIO_EXT = /\.(mp3|wav|m4a|aac|ogg|oga|flac|webm|aiff?)$/i;

/** 'midi', 'score' (MusicXML), 'audio' (a recording, which Lumora doesn't read) or null. */
export function kindOf(file) {
  if (MIDI_EXT.test(file.name) || /midi/.test(file.type)) return 'midi';
  if (SCORE_EXT.test(file.name) || /musicxml/.test(file.type)) return 'score';
  if (AUDIO_EXT.test(file.name) || file.type.startsWith('audio/')) return 'audio';
  return null;
}

/** "my_song-final.mid" → "my song final". */
export function titleFromFile(name) {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
