// The one screen: the preview on one side, the song, look and video panels on the other.
import { useCallback, useMemo, useState } from 'react';
import { ExportPanel } from './features/export/ExportPanel.jsx';
import { LookPanel } from './features/look/LookPanel.jsx';
import { Player } from './features/player/Player.jsx';
import { SongPanel } from './features/song/SongPanel.jsx';
import { useSong } from './features/song/useSong.js';
import { formatById } from './shared/scene/formats.js';
import { paletteById } from './shared/scene/palettes.js';
import { renderFrame } from './shared/scene/render.js';
import { prepareScene } from './shared/scene/scene.js';
import { styleById } from './shared/scene/styles/index.js';
import { DEFAULT_CAMERA } from './shared/scene/view.js';

const START_LOOK = {
  styleId: 'glow-lane',
  paletteId: 'midnight',
  formatId: 'portrait',
  view: '2d',
  camera: DEFAULT_CAMERA,
};

export function App() {
  const { song, sensitivity, loadFiles, setSensitivity } = useSong();
  const [style, setStyle] = useState(START_LOOK);
  // A new song brings its own title; an edit holds until the next song.
  const [titleEdit, setTitleEdit] = useState({ song: null, value: '' });
  const title = titleEdit.song === song.title ? titleEdit.value : song.title;
  const look = useMemo(() => ({ ...style, title }), [style, title]);
  const setLook = useCallback(
    ({ title: next, ...rest }) => {
      setStyle(rest);
      if (next !== title) setTitleEdit({ song: song.title, value: next });
    },
    [title, song.title],
  );

  const format = formatById(look.formatId);
  const scene = useMemo(() => prepareScene(song.notes, format, song.audio?.duration), [song.notes, song.audio, format]);
  const frameLook = useMemo(
    () => ({
      style: styleById(look.styleId),
      palette: paletteById(look.paletteId),
      title: look.title,
      camera: look.view === '3d' ? look.camera : null,
    }),
    [look],
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
          sensitivity={sensitivity}
          onFiles={loadFiles}
          onSensitivity={setSensitivity}
        />
        <LookPanel look={look} scene={scene} onChange={setLook} />
        <ExportPanel scene={scene} audio={song.audio} look={frameLook} format={format} disabled={!ready} />
      </aside>
    </div>
  );
}
