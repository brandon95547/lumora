# 7. Notes from scores and MIDI, not recordings

Date: 2026-11-27

Replaces the **Notes** part of [ADR 1](0001-browser-only-pipeline.md). The rest of ADR 1 stands.

## Context

Lumora found the notes in a recording with Basic Pitch. A recording can't say which hand plays a
note, and Basic Pitch's guesses (overtones, missed notes) made the lights wrong in places. The hands
now show in every style (a two-color palette's two colors, the two fires), so they have to be right.

## Decision

- **Songs come in as MIDI or MusicXML.** Recordings are no longer read. Basic Pitch, TensorFlow.js
  and the transcription worker are gone, and with them "Notes to find". The song plays through the
  built-in piano voice, so the sound and the lights come from the same notes.
- **MusicXML** (`src/features/song/musicxml.js`) is read with the browser's own XML parser. A
  compressed `.mxl` is opened by a small zip reader (`zip.js`) that uses `DecompressionStream`, so
  no library is added. A part on two staves is the piano: staff 1 is the right hand, staff 2 the
  left. When a score has one, its other parts are left out. Two one-staff parts are taken as the
  two hands. Repeats and endings are played out; D.C., D.S. and codas are not (they play straight
  through). Tempo comes from `<sound tempo>`, or else the metronome mark, or else 120.
- **MIDI** keeps its tracks. Tracks named for a hand ("RH", "Left", "Treble") give it; otherwise
  exactly two tracks are a piano's two staves, the higher the right hand. A single-track file is
  split by channel by the MIDI library first.
- **A note's hand is optional** in the note shape. `assignHands` keeps every hand the file gave and
  works out only the rest, following both hands through the song as before. `prepareScene` works the
  hands out once per song, and every style reads `note.hand`. The staff still places notes by middle
  C, because which staff a circle sits on is a clef rule, not a hand.
- **MuseScore's own `.mscz`** isn't read: MuseScore exports MusicXML, and so does every notation app.

## Consequences

- The transcription worker (271 KB gzipped) and the model are gone from the build. The MusicXML
  reader loads on demand like the MIDI reader.
- A live performance can't be animated until it is a MIDI file or a score.
