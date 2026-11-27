# 1. Everything runs in the browser

Date: 2026-11-26

The **Notes** part is replaced by [ADR 7](0007-notes-from-scores-not-recordings.md): songs now come
in as MIDI or MusicXML, not recordings.

## Context

Lumora turns a piano recording into an animated staff and a video file. Three jobs are heavy:
finding the notes in the audio, drawing the animation, and encoding the video. Each could run on a
server (Python transcription, FFmpeg) or in the browser.

## Decision

All three run in the browser, so the app is static files with no server, no uploads and no cost
per video.

- **Notes:** Spotify's Basic Pitch model (Apache-2.0) on TensorFlow.js, in a Web Worker. Its raw
  output is kept, so changing "Notes to find" re-reads it without running the model again. A MIDI
  file can be dropped instead, or beside the recording, for exact notes.
- **Drawing:** one pure function, `renderFrame(ctx, scene, { t, style, palette, title })`. A frame
  depends only on its time, so the preview, the scrubber and the export always match, and styles
  have no state to keep in step.
- **Video:** frames are rendered offscreen and encoded with WebCodecs through Mediabunny into MP4
  (H.264 + AAC where the browser has them), faster than real time. Not a screen recording, so
  frames never drop.
- **Music glyphs:** clefs, brace and accidentals are path data taken from the Bravura font
  (SIL OFL) by `scripts/build-glyphs.mjs`. No font file is loaded and every machine draws the same
  shapes, in the preview and in the video.

## Size

The first screen is 82 KB of gzipped JS. The exporter (60 KB) and MIDI reader (9 KB) load the first
time they are used. The transcription worker is 271 KB gzipped, almost all TensorFlow.js, plus the
model (8 KB JSON, 725 KB weights). It is the one chunk over the 100 KB on-demand limit: it is a
single tool that cannot be split, it runs off the main thread, and it loads only when a recording
is dropped. `scripts/check-budgets.mjs` gives the worker its own 320 KB limit and alarms on 10 KB of
growth anywhere.

## Consequences

- Transcription quality is Basic Pitch's: good on solo piano, weaker on dense or noisy mixes.
  Overtones can show up as extra notes; "Notes to find: Fewer" removes most of them.
- Export needs WebCodecs (Chrome, Edge, Safari 26+, recent Firefox). Other browsers get a plain
  message.
- A long song is held in memory while it is encoded (about 2 MB per 10 s at 1080p).
