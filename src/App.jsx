// The one screen: the preview on one side, the song, look and video panels on the other.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExportPanel } from './features/export/ExportPanel.jsx';
import { LookPanel } from './features/look/LookPanel.jsx';
import { Player } from './features/player/Player.jsx';
import { SongPanel } from './features/song/SongPanel.jsx';
import { useSong } from './features/song/useSong.js';
import { formatById } from './shared/scene/formats.js';
import { paletteById } from './shared/scene/palettes.js';
import { renderFrame } from './shared/scene/render.js';
import { prepareScene } from './shared/scene/scene.js';
import { CLEAN_FONT, loadTitleFont, titleFontById, titleSizeById } from './shared/scene/titles.js';
import { animationById, defaultCamera, KINDS } from './shared/scene/kinds.js';

const START_LOOK = {
  animationId: KINDS[0].animations[0].id,
  paletteId: 'midnight',
  formatId: 'portrait',
  view: '3d', // the first animation, Marble Walk, is meant to be seen on its floor
  titleFontId: 'grenze',
  titleSizeId: 'large',
  camera: defaultCamera(KINDS[0]),
};

export function App() {
  const { song, loadFiles, instrumentId, setInstrument } = useSong();
  const [choices, setChoices] = useState(START_LOOK);
  // A new song brings its own title; an edit holds until the next song.
  const [titleEdit, setTitleEdit] = useState({ song: null, value: '' });
  const title = titleEdit.song === song.title ? titleEdit.value : song.title;
  const look = useMemo(() => ({ ...choices, title }), [choices, title]);
  const setLook = useCallback(
    ({ title: next, ...rest }) => {
      setChoices(rest);
      if (next !== title) setTitleEdit({ song: song.title, value: next });
    },
    [title, song.title],
  );

  // The title's face is drawn once its file has arrived; the clean face stands in until then, so
  // the preview and the video never draw a face the canvas doesn't have.
  const [loadedFont, setLoadedFont] = useState(CLEAN_FONT);
  useEffect(() => {
    let current = true;
    loadTitleFont(titleFontById(look.titleFontId)).then(
      (font) => current && setLoadedFont(font),
      (error) => console.error(error),
    );
    return () => {
      current = false;
    };
  }, [look.titleFontId]);
  const titleFont = loadedFont.id === look.titleFontId ? loadedFont : CLEAN_FONT;

  const format = formatById(look.formatId);
  const scene = useMemo(() => prepareScene(song.notes, format, song.audio?.duration), [song.notes, song.audio, format]);
  const frameLook = useMemo(
    () => ({
      animation: animationById(look.animationId),
      palette: paletteById(look.paletteId),
      title: look.title,
      titleFont,
      titleScale: titleSizeById(look.titleSizeId).scale,
      camera: look.view === '3d' ? look.camera : null,
    }),
    [look, titleFont],
  );
  const draw = useCallback((ctx, t) => renderFrame(ctx, scene, { ...frameLook, t }), [scene, frameLook]);
  const ready = song.status === 'ready' && song.audio && scene.items.length > 0;

  return (
    <div className="mx-auto flex min-h-dvh max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:items-start lg:gap-8 lg:py-10">
      <main className="flex min-w-0 flex-1 flex-col gap-4 lg:sticky lg:top-10">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">Lumora</h1>
          <p className="text-muted">Watch a piano song light up the staff, and make it a video.</p>
        </header>
        <Player audio={song.audio} scene={scene} draw={draw} />
      </main>
      <aside className="flex w-full flex-col gap-4 lg:w-[26rem] lg:shrink-0">
        <SongPanel
          song={song}
          scene={scene}
          onFiles={loadFiles}
          instrumentId={instrumentId}
          onInstrument={setInstrument}
        />
        <LookPanel look={look} scene={scene} onChange={setLook} />
        <ExportPanel scene={scene} audio={song.audio} look={frameLook} format={format} disabled={!ready} />
      </aside>
    </div>
  );
}
