# Lumora

Drop in a piano song (a MIDI file or a MusicXML score) and watch it light up a musical staff: every note glows on its line or space
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

1. **Song.** Drop a MIDI file (`.mid`, `.midi`, `.kar`) or a MusicXML score (`.musicxml`, `.mxl`,
   `.xml`). Every notation app exports MusicXML: in MuseScore it is File → Export → MusicXML. The
   song plays with a built-in piano voice, so the lights and the sound always match. Recordings
   (MP3, WAV…) aren't read.

   A score's piano staves say which hand plays each note: the upper staff the right hand, the lower
   the left. A score with a piano and other parts (a vocal line) is read for the piano alone.
   Repeats and first and second endings play as written; D.C., D.S. and codas play straight
   through. A MIDI file says the hands when its tracks are named for them ("RH", "Left") or it has
   exactly two tracks, the higher one the right hand. The Song panel says where the hands came
   from.

   **Instrument** picks what plays it: Grand Piano, Upright Piano, Rhodes Electric Piano (recordings
   of real instruments, fetched the first time a song needs them) or the Soft Synth (made in the
   browser).

   Every song is **mastered** for the video platforms: raised or lowered to **−14 LUFS** integrated
   loudness (ITU-R BS.1770, EBU R128 gating; what TikTok, Reels and YouTube play at) with a
   look-ahead limiter keeping peaks under **−1 dBTP**. The Song panel shows the result, and the
   video carries it.

2. **Look.** Choose a style, **Staff**, **Piano** or **Fire**, and one of its animations. Then **2D** or
   **3D**: in 3D, pick a camera angle and fine-tune it with Turn, Tilt and Distance; a gentle drift
   keeps the camera alive. **Save this angle** keeps the camera as it is under a name, in this
   browser, beside the ready-made angles. Then choose colors, the video's shape and its title: the title sits at the top in a **Title
   font** (Grenze Gotisch, Fraktur, Pirata One, New Rocker or Clean) and **Title size**.
3. **Video.** Choose 30 or 60 fps and press **Make the video**. It renders faster than real time;
   then download the MP4.

Space plays and pauses the preview.

### Styles and animations

**Staff:** the song lights up a grand staff.

In **Marble Walk** (the first animation, and where Lumora opens) the staff lies on a dark,
polished marble floor and runs on ahead like a road. A glass ball for each hand hops along it,
landing on every note as it sounds (a chord is one landing, on the right hand's top note or the left
hand's bottom note), with its shadow and reflection on the floor below. The floor's tiles, the
staff and the lit notes travel toward the camera with the music, so the balls seem to walk across
the floor. The clefs pass by as the song begins. As the song goes on, translucent ghosts fly across the stage,
more often as it builds; and at its most energetic moments (never two within 8 seconds) the floor
heats up with an ember glow and a faint mist rises off it. Its own angles: Walk, Behind, Beside,
Overhead.
In 2D you look straight down at the floor.

In the other animations the staff stands upright in 3D on a reflective floor whose grid moves with
the music, and lit notes become glass balls sending up beams of light. Angles: Front, Angled, Low,
Lane.

| Animation     | What it does                                                       |
| ------------- | ------------------------------------------------------------------ |
| Marble Walk   | Balls hop along a marble floor; ghosts fly by, the floor heats up. |
| Glow Lane     | Notes glide toward a playhead and flare as they sound.             |
| Ripple Pages  | A page of notes waits on the staff; each one ripples as it plays.  |
| Constellation | Played notes turn to stars and join into constellations.           |
| Ribbon        | Every note draws a ribbon of light as long as it is held.          |

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

**Fire:** the music as fire. In Fireball Run a ball of flame bounces from ledge to ledge, landing
exactly on every note (a chord or a quick run is one landing; higher notes sit on higher ledges).
Each landing throws up a pillar of flame and sparks and leaves the stone glowing like lava. The
fire follows the music's energy, cooling in quiet passages and growing across the song, so the
finale burns hottest: bigger flames, a longer trail, more embers, a hotter sky. 2D follows it
side-on; in 3D the run winds through space: Chase, Side, High, Low. Ember gives classic fire;
Midnight burns blue, Aurora green.

**Which hand plays a note** comes from the file when it says (a score's staff, a MIDI track).
Otherwise it is worked out from the music (`src/shared/hands.js`), not from a fixed line at middle
C: each hand's position is followed through the song, and every chord is divided between the hands
by how close each note is to where that hand has just been, how far a hand can stretch and how many
notes it can hold. A left hand that climbs above middle C stays the left hand. The hands decide the
two colors of a two-color palette in every style, and the two fires in Two Hands and Gothic.

In **Gothic** the camera looks down a cathedral nave (the Nave angle). The left hand's crimson
hellfire runs down the left aisle and the right hand's teal soulfire down the right, each placed
across its aisle by pitch, lower notes further out. The fire is the only warm light on the stone;
candles kindle as it passes, the rose window burns brighter with the music, and the mightiest
landings call down lightning and scatter bats.

| Animation    | What it does                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| Fireball Run | A fireball bounces on every note, and burns brighter as the song builds.                                |
| Two Hands    | The right hand's fireball burns teal-blue, the left hand's in the palette's fire, each in its own lane. |
| Gothic       | Teal and crimson fire race down a moonlit cathedral nave, each hand on its own side.                    |

## Check it

```bash
npm run check
```

That runs ESLint, Prettier, the tests, the build and the size budgets, as CI does on every push.
After a change that makes the app bigger on purpose, run `node scripts/check-budgets.mjs --update`
and say why in the commit.

## How it is put together

| Path                            | What it is                                                              |
| ------------------------------- | ----------------------------------------------------------------------- |
| `src/App.jsx`                   | The one screen: preview, and the Song, Look and Video panels.           |
| `src/features/song/`            | Reading MIDI and MusicXML (each loaded when first used), demo, synth.   |
| `src/features/look/`            | Style, color, shape and title choices.                                  |
| `src/features/player/`          | The live preview and its transport.                                     |
| `src/features/export/`          | Rendering and encoding the MP4 (loaded when first used).                |
| `src/shared/scene/`             | What every scene shares: views and the camera, palettes, `renderFrame`. |
| `src/shared/scene/kinds.js`     | The styles (Staff, Piano) and their animations.                         |
| `src/shared/scene/staff/`       | The staff: pitch math, layout, glyphs, its animations.                  |
| `src/shared/scene/piano/`       | The piano: keyboard geometry, the instrument, its animations.           |
| `src/shared/ui/`                | Buttons, choices, panels, icons.                                        |
| `scripts/build-instruments.mjs` | Builds `public/instruments/<id>/` from a sample library (macOS).        |
| `scripts/build-glyphs.mjs`      | Writes `src/shared/scene/staff/glyphs.js` from the Bravura font.        |
| `scripts/check-budgets.mjs`     | Size budgets, checked in CI against `budgets.json`.                     |
| `docs/adr/`                     | Decisions and why.                                                      |

Features import only `src/shared/`, never each other; ESLint enforces it.

An animation with `stage: 'floor'` is drawn on the marble floor (`staff/floor.js`) and gives a
`drawRaised` for what shows in the polish. An animation may carry its own camera `rig` (angles and
slider ranges), as Marble Walk does; otherwise it uses its style's.

**A new animation** is one file in its style's folder (`src/shared/scene/staff/`, `piano/` or `fire/`),
listed in that folder's `index.js`. A staff animation has `id`, `name`, `description`, `motion`
(`'scroll'` or `'page'`) and `draw(ctx, scene, t, palette, view)`, and draws only with the helpers
in `staff/common.js`; a piano animation has `falling` and `draw(ctx, scene, t, palette, view, model)`
and draws the instrument with `piano/instrument.js`. Both work in 2D and 3D because every helper
projects through the view. Keep it a pure function of `t`.

**A new style** is a folder beside `staff/` and `piano/` whose `index.js` gives its animations,
camera angles and `render`, added to `kinds.js`.

**A new color scheme** is one entry in `src/shared/scene/palettes.js`.

## Credits

- Grand Piano: [Salamander Grand Piano](https://github.com/sfzinstruments/SalamanderGrandPiano) by
  Alexander Holm (CC BY 3.0).
- Upright Piano: [Upright Piano KW](https://freepats.zenvoid.org/Piano/acoustic-grand-piano.html) by
  FreePats (CC0).
- Title fonts (SIL Open Font License, each license beside its file in `src/shared/scene/fonts/`):
  Grenze Gotisch (subset to Latin), UnifrakturMaguntia, Pirata One, New Rocker.
- Rhodes Electric Piano: [jRhodes3d](https://github.com/sfzinstruments/jlearman.jRhodes3d) by Jeff
  Learman (CC BY 4.0).

- Music glyphs: [Bravura](https://github.com/steinbergmedia/bravura) by Steinberg (SIL OFL 1.1).
- Video encoding: [Mediabunny](https://mediabunny.dev) (MPL-2.0).
- Icons: [Lucide](https://lucide.dev) shapes (ISC).
