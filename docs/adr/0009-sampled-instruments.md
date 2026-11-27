# 9. Sampled instruments

Date: 2026-11-27

## Context

Songs played through a few oscillators (the Soft Synth). A choice of instruments was wanted, keyboards
first, at high quality, which means recordings of real instruments.

## Decision

- **Three free sample libraries**, chosen for quality and a license that lets a public site serve them:
  - Grand Piano: Salamander Grand Piano V3 (Yamaha C5) by Alexander Holm, CC BY 3.0.
  - Upright Piano: Upright Piano KW (Kawai) from FreePats, CC0.
  - Rhodes Electric Piano: jRhodes3d (1977 Rhodes Mark I) by Jeff Learman, samples CC BY 4.0. An
    older note called them non-commercial; the repository's LICENSE now says CC BY 4.0, and music
    made with them is CC0.

  The Soft Synth stays as the fourth choice, with nothing to download. Each library's license and
  the changes made are in `public/instruments/<id>/LICENSE.txt`; the app shows the credit under the
  Instrument menu.

- **Built once, served as files.** `scripts/build-instruments.mjs` decodes each source sample with
  macOS's `afconvert`, cuts it from its first sound to where it has died 60 dB (or a cap, 8–9 s),
  fades the end, and encodes AAC at 128 kbps in `.m4a`, which every browser decodes. Files are named
  by content hash. The Grand keeps 4 of Salamander's 16 velocity layers (11 MB in all), the Upright
  its 2 (2.7 MB), the Rhodes its 5 (7 MB). The sources are not kept in the repo.
- **A song fetches only what it plays.** Each note picks the nearest recorded key (shifted to pitch)
  and the layer nearest its velocity (`pickSample`); only those files are fetched, and they are kept
  for later songs. The demo fetches 20.
- **Rendering is unchanged in shape.** The section renderer in `synth.js` now takes a voice; the
  Soft Synth and the sampled voice are two voices. Each finished song is scaled to peak at 0.9, so
  nothing clips and every instrument plays at the same level.

## Consequences

- Rebuilding an instrument needs macOS and the source library downloaded (URLs in its LICENSE.txt).
- The repository grows by about 21 MB of audio.
- Sustain pedal and release samples are not used: a note ends at its written length plus a short release.
