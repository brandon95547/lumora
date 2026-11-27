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
2. **Look.** Choose an animation, then **2D** or **3D**. In 3D, pick a camera angle (Front, Angled,
   Low or Lane) and fine-tune it with Turn, Tilt and Distance; a gentle drift keeps the camera
   alive. Then choose colors, the video's shape and its title.
3. **Video.** Choose 30 or 60 fps and press **Make the video**. It renders faster than real time;
   then download the MP4.

Space plays and pauses the preview.

### Animations

| Style         | What it does                                                      |
| ------------- | ----------------------------------------------------------------- |
| Glow Lane     | Notes glide toward a playhead and flare as they sound.            |
| Ripple Pages  | A page of notes waits on the staff; each one ripples as it plays. |
| Constellation | Played notes turn to stars and join into constellations.          |
| Ribbon        | Every note draws a ribbon of light as long as it is held.         |

## Check it

```bash
npm run check
```

That runs ESLint, Prettier, the tests, the build and the size budgets, as CI does on every push.
After a change that makes the app bigger on purpose, run `node scripts/check-budgets.mjs --update`
and say why in the commit.

## How it is put together

| Path                        | What it is                                                          |
| --------------------------- | ------------------------------------------------------------------- |
| `src/App.jsx`               | The one screen: preview, and the Song, Look and Video panels.       |
| `src/features/song/`        | Reading files, finding notes (Basic Pitch in a worker), MIDI, demo. |
| `src/features/look/`        | Style, color, shape and title choices.                              |
| `src/features/player/`      | The live preview and its transport.                                 |
| `src/features/export/`      | Rendering and encoding the MP4 (loaded when first used).            |
| `src/shared/scene/`         | The animation: staff math, layout, palettes, styles, `renderFrame`. |
| `src/shared/ui/`            | Buttons, choices, panels, icons.                                    |
| `scripts/build-glyphs.mjs`  | Writes `src/shared/scene/glyphs.js` from the Bravura font.          |
| `scripts/check-budgets.mjs` | Size budgets, checked in CI against `budgets.json`.                 |
| `docs/adr/`                 | Decisions and why.                                                  |

Features import only `src/shared/`, never each other; ESLint enforces it.

**A new animation style** is one file in `src/shared/scene/styles/` with `id`, `name`,
`description`, `motion` (`'scroll'` or `'page'`) and `draw(ctx, scene, t, palette, view)`, added to
`styles/index.js`. Draw only with the helpers in `styles/common.js` (they project through the view,
so the style works in 2D and 3D), use the envelopes in `envelope.js`, and keep it a pure function
of `t`.

**A new color scheme** is one entry in `src/shared/scene/palettes.js`.

## Credits

- Note finding: [Basic Pitch](https://github.com/spotify/basic-pitch-ts) by Spotify (Apache-2.0).
- Music glyphs: [Bravura](https://github.com/steinbergmedia/bravura) by Steinberg (SIL OFL 1.1).
- Video encoding: [Mediabunny](https://mediabunny.dev) (MPL-2.0).
- Icons: [Lucide](https://lucide.dev) shapes (ISC).
