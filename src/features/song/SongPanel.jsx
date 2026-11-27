// Where a song comes in: one drop zone for MIDI files and MusicXML scores, and what was found in it.
import { useState } from 'react';
import { Icon } from '../../shared/ui/Icon.jsx';
import { Panel } from '../../shared/ui/Panel.jsx';
import { clock } from '../../shared/ui/time.js';

const KEY_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const SOURCE = {
  demo: 'Demo notes',
  midi: 'Notes from the MIDI file',
  score: 'Notes from the score',
};

/** Where the hands came from: all from the file, some, or all worked out from the notes. */
function handsFrom(notes) {
  const known = notes.filter((n) => n.hand).length;
  if (known === notes.length) return 'From the file';
  if (known) return 'From the file, the rest worked out from the notes';
  return 'Worked out from the notes';
}

function Status({ song }) {
  if (song.status === 'reading' || song.status === 'loading')
    return (
      <p className="text-sm text-muted" role="status">
        Reading the file…
      </p>
    );
  if (song.status === 'error')
    return (
      <p className="text-sm text-danger" role="alert">
        {song.error}
      </p>
    );
  return null;
}

export function SongPanel({ song, scene, onFiles }) {
  const [over, setOver] = useState(false);
  const busy = song.status === 'reading';

  return (
    <Panel title="Song">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          onFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors has-focus-visible:outline-2 has-focus-visible:outline-accent ${over ? 'border-accent bg-accent/10' : 'border-line-strong hover:border-accent/60'}`}
      >
        <Icon name="upload" className="size-6 text-accent" />
        <span className="font-semibold">Drop a song here, or choose a file</span>
        <span className="text-caption text-faint">
          A MIDI file, or a MusicXML score exported from MuseScore or any notation app.
        </span>
        <input
          type="file"
          multiple
          accept=".mid,.midi,.kar,.musicxml,.mxl,.xml"
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            onFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </label>

      <Status song={song} />

      {song.status === 'ready' && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-faint">Notes</dt>
          <dd>
            {scene.items.length} · {SOURCE[song.notesFrom]}
          </dd>
          <dt className="text-faint">Hands</dt>
          <dd>{handsFrom(song.notes)}</dd>
          <dt className="text-faint">Key</dt>
          <dd>
            {KEY_NAMES[scene.key.tonic]} {scene.key.mode}
          </dd>
          <dt className="text-faint">Length</dt>
          <dd>{clock(scene.duration)}</dd>
        </dl>
      )}
    </Panel>
  );
}
