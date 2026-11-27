// Where a song comes in: one drop zone for recordings and MIDI files, and what was found in it.
import { useState } from 'react';
import { Choice } from '../../shared/ui/Choice.jsx';
import { Icon } from '../../shared/ui/Icon.jsx';
import { Panel } from '../../shared/ui/Panel.jsx';
import { clock } from '../../shared/ui/time.js';
import { SENSITIVITY } from './sensitivity.js';

const KEY_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const SOURCE = {
  demo: 'Demo notes',
  audio: 'Notes found in the recording',
  midi: 'Notes from the MIDI file',
};

function Status({ song }) {
  if (song.status === 'decoding' || song.status === 'loading')
    return <p className="text-sm text-muted">Reading the file…</p>;
  if (song.status === 'transcribing')
    return (
      <div className="flex flex-col gap-2" role="status">
        <p className="text-sm text-muted">Listening for notes… {Math.round(song.progress * 100)}%</p>
        <div className="h-1.5 overflow-hidden rounded-full bg-raised">
          <div className="h-full origin-left bg-accent" style={{ transform: `scaleX(${song.progress})` }} />
        </div>
      </div>
    );
  if (song.status === 'error')
    return (
      <p className="text-sm text-danger" role="alert">
        {song.error}
      </p>
    );
  return null;
}

export function SongPanel({ song, scene, sensitivity, onFiles, onSensitivity }) {
  const [over, setOver] = useState(false);
  const busy = song.status === 'decoding' || song.status === 'transcribing';

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
        <span className="text-caption text-faint">MP3, WAV, M4A or MIDI. Add a MIDI file too for exact notes.</span>
        <input
          type="file"
          multiple
          accept="audio/*,.mid,.midi"
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
          <dt className="text-faint">Key</dt>
          <dd>
            {KEY_NAMES[scene.key.tonic]} {scene.key.mode}
          </dd>
          <dt className="text-faint">Length</dt>
          <dd>{clock(scene.duration)}</dd>
        </dl>
      )}

      {song.notesFrom === 'audio' && (
        <Choice label="Notes to find" options={SENSITIVITY} value={sensitivity} onChange={onSensitivity} />
      )}
    </Panel>
  );
}
