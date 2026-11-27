# Lumora

Drop in a piano song and watch it light up a musical staff: every note glows on its line or space
as it plays. Pick an animation style and a color scheme, then make an MP4 in 9:16 (TikTok, Reels,
Shorts) or 16:9 (YouTube).

Everything happens in your browser. Nothing is uploaded.

## Run it

```bash
npm install
npm run dev
```

Then open <http://localhost:5180>. A short demo is loaded so you can try every style at once.

## Use it

1. **Song.** Drop an MP3, WAV or M4A. Lumora listens for the notes (a few seconds per minute of
   music). If it finds too many or too few, change **Notes to find**. For exact notes, drop a MIDI
   file too, with the recording or after it. A MIDI file on its own plays with a built-in piano
   voice.
2. **Look.** Choose a style, **Staff** or **Piano**, and one of its animations. Then **2D** or
   **3D**: in 3D, pick a camera angle and fine-tune it with Turn, Tilt and Distance; a gentle drift
   keeps the camera alive. Then choose colors, the video's shape and its title.
3. **Video.** Choose 30 or 60 fps and press **Make the video**. It renders faster than real time;
   then download the MP4.

Space plays and pauses the preview.

### Styles and animations

**Staff:** the song lights up a grand staff. In 3D the staff stands on a reflective floor whose
grid moves with the music, and lit notes become glass balls sending up beams of light. Angles:
Front, Angled, Low, Lane.

| Animation     | What it does                                                      |
| ------------- | ----------------------------------------------------------------- |
| Glow Lane     | Notes glide toward a playhead and flare as they sound.            |
| Ripple Pages  | A page of notes waits on the staff; each one ripples as it plays. |
| Constellation | Played notes turn to stars and join into constellations.          |
| Ribbon        | Every note draws a ribbon of light as long as it is held.         |

**Piano:** a grand piano plays the song. In Live it is the whole instrument: a lacquered case
with its curved side, the lid propped open, the gold plate and strings inside, music desk, legs and
pedals, on a lit stage. Its 88 keys are solid and tip down when played. In 2D the camera looks
straight down at the keys the song uses, like a lesson video; in 3D it films from an angle:
Concert (the whole piano, from the audience), Side, Player or Overhead. Distance runs from the whole
instrument to close on the keys; close in, the camera follows the music along the keyboard.

| Animation     | What it does                                               |
| ------------- | ---------------------------------------------------------- |
| Live          | A grand piano playing itself, as if filmed in concert.     |
| Falling Notes | Bars of light run to the keys and press them as they land. |

## Check it

```bash
npm run check
```

That runs ESLint, Prettier, the tests, the build and the size budgets, as CI does on every push.
After a change that makes the app bigger on purpose, run `node scripts/check-budgets.mjs --update`
and say why in the commit.

## How it is put together

| Path                        | What it is                                                              |
| --------------------------- | ----------------------------------------------------------------------- |
| `src/App.jsx`               | The one screen: preview, and the Song, Look and Video panels.           |
| `src/features/song/`        | Reading files, finding notes (Basic Pitch in a worker), MIDI, demo.     |
| `src/features/look/`        | Style, color, shape and title choices.                                  |
| `src/features/player/`      | The live preview and its transport.                                     |
| `src/features/export/`      | Rendering and encoding the MP4 (loaded when first used).                |
| `src/shared/scene/`         | What every scene shares: views and the camera, palettes, `renderFrame`. |
| `src/shared/scene/kinds.js` | The styles (Staff, Piano) and their animations.                         |
| `src/shared/scene/staff/`   | The staff: pitch math, layout, glyphs, its animations.                  |
| `src/shared/scene/piano/`   | The piano: keyboard geometry, the instrument, its animations.           |
| `src/shared/ui/`            | Buttons, choices, panels, icons.                                        |
| `scripts/build-glyphs.mjs`  | Writes `src/shared/scene/staff/glyphs.js` from the Bravura font.        |
| `scripts/check-budgets.mjs` | Size budgets, checked in CI against `budgets.json`.                     |
| `docs/adr/`                 | Decisions and why.                                                      |

Features import only `src/shared/`, never each other; ESLint enforces it.

**A new animation** is one file in its style's folder (`src/shared/scene/staff/` or `piano/`),
listed in that folder's `index.js`. A staff animation has `id`, `name`, `description`, `motion`
(`'scroll'` or `'page'`) and `draw(ctx, scene, t, palette, view)`, and draws only with the helpers
in `staff/common.js`; a piano animation has `falling` and `draw(ctx, scene, t, palette, view, model)`
and draws the instrument with `piano/instrument.js`. Both work in 2D and 3D because every helper
projects through the view. Keep it a pure function of `t`.

**A new style** is a folder beside `staff/` and `piano/` whose `index.js` gives its animations,
camera angles and `render`, added to `kinds.js`.

**A new color scheme** is one entry in `src/shared/scene/palettes.js`.

## Credits

- Note finding: [Basic Pitch](https://github.com/spotify/basic-pitch-ts) by Spotify (Apache-2.0).
- Music glyphs: [Bravura](https://github.com/steinbergmedia/bravura) by Steinberg (SIL OFL 1.1).
- Video encoding: [Mediabunny](https://mediabunny.dev) (MPL-2.0).
- Icons: [Lucide](https://lucide.dev) shapes (ISC).
