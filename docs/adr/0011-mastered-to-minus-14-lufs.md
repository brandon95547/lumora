# 11. Every song mastered to −14 LUFS, peaks under −1 dBTP

Date: 2026-11-27

## Context

Songs were scaled so their loudest sample peaked at 0.9. Loudness is not peak level: a gentle piano
piece came out far quieter than other videos, and the platforms judge loudness in LUFS. TikTok,
Instagram Reels and YouTube play at about −14 LUFS integrated; they turn louder uploads down, so a
quiet one stays quiet. Peaks need room under 0 dB (−1 dBTP) so the platform's own encoder doesn't
distort them.

## Decision

- **`src/features/song/master.js`**, run on every rendered song before it plays or is exported:
  - Integrated loudness per ITU-R BS.1770-4: K-weighting (its 48 kHz coefficients), 400 ms blocks
    every 100 ms, the −70 LUFS absolute gate and the −10 LU relative gate (EBU R128).
  - One gain to −14 LUFS, then a stereo-linked look-ahead limiter (5 ms ahead, about 80 ms release)
    with its ceiling half a dB under −1 dB, leaving room between samples.
  - True peak read 4× between samples (cubic interpolation); if it still passes −1 dBTP, the whole
    song is trimmed under it.
- The Song panel shows the measured loudness and peak. The video's AAC audio carries it: the demo's
  exported MP4 measured −14.00 LUFS.
- No dependency: about 150 lines, tested against BS.1770's reference (a full-scale 1 kHz tone in
  both channels reads 0 LUFS).

## Consequences

- Mastering a five-minute song takes about 1.8 s on the main thread; the panel says "Mastering the
  sound" meanwhile.
- A very quiet, very dynamic piece is raised a lot and its loudest attacks are limited.
