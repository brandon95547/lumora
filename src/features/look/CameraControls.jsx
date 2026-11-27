// Where the 3D camera stands: one of the animation's ready-made angles or one the person saved, or
// turned, tilted and moved in by hand, and saved as their own.
import { useState } from 'react';
import { angleOf } from '../../shared/scene/kinds.js';
import { Button } from '../../shared/ui/Button.jsx';
import { Choice } from '../../shared/ui/Choice.jsx';
import { Slider } from '../../shared/ui/Slider.jsx';
import { Switch } from '../../shared/ui/Switch.jsx';
import { usePresets } from './presets.js';

const degrees = (v) => `${v}°`;
const SAVED = 'saved:';

/** Naming and saving the camera as it is now. */
function SaveAngle({ onSave, onDone }) {
  const [name, setName] = useState('');
  const [failed, setFailed] = useState(false);
  const save = () => {
    if (!name.trim()) return;
    if (onSave(name.trim())) onDone();
    else setFailed(true);
  };
  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-muted">Name this angle</span>
        <input
          type="text"
          value={name}
          maxLength={40}
          autoFocus
          placeholder="My angle"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          className="h-10 rounded-lg border border-line bg-raised px-3 text-ink placeholder:text-faint focus:border-accent focus:outline-none"
        />
      </label>
      {failed && (
        <p className="text-sm text-danger" role="alert">
          This browser wouldn’t keep it (storage may be full or turned off).
        </p>
      )}
      <div className="flex gap-2">
        <Button label="Save" icon="bookmark" variant="primary" disabled={!name.trim()} onClick={save} />
        <Button label="Cancel" onClick={onDone} />
      </div>
    </div>
  );
}

export function CameraControls({ rig, camera, onChange }) {
  const [naming, setNaming] = useState(false);
  const { presets, save, remove } = usePresets(rig.id);
  const set = (key) => (value) => onChange({ ...camera, [key]: value });
  const [turnMin, turnMax] = rig.turnRange;
  const [tiltMin, tiltMax] = rig.tiltRange;
  const [near, far] = rig.zoomRange;
  const third = (far - near) / 3;
  const saved = presets.map((p) => ({ ...p, id: SAVED + p.name, label: p.name }));
  const current =
    angleOf(rig, camera) ??
    saved.find((p) => p.turn === camera.turn && p.tilt === camera.tilt && p.zoom === camera.zoom)?.id ??
    null;
  const currentSaved = current?.startsWith(SAVED) ? current.slice(SAVED.length) : null;
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-3.5">
      <Choice
        label="Angle"
        options={[...rig.angles, ...saved]}
        value={current}
        onChange={(id) => {
          const { turn, tilt, zoom } = [...rig.angles, ...saved].find((a) => a.id === id);
          onChange({ ...camera, turn, tilt, zoom });
        }}
      />
      <Slider label="Turn" value={camera.turn} min={turnMin} max={turnMax} onChange={set('turn')} format={degrees} />
      <Slider label="Tilt" value={camera.tilt} min={tiltMin} max={tiltMax} onChange={set('tilt')} format={degrees} />
      <Slider
        label="Distance"
        value={camera.zoom}
        min={near}
        max={far}
        step={0.02}
        onChange={set('zoom')}
        format={(v) => (v >= far - third ? 'Close' : v <= near + third ? 'Far' : 'Middle')}
      />
      <Switch label="Gentle camera drift" checked={camera.drift} onChange={set('drift')} />
      {naming ? (
        <SaveAngle onSave={(name) => save(name, camera)} onDone={() => setNaming(false)} />
      ) : (
        <div className="flex flex-wrap gap-2">
          {!current && <Button label="Save this angle" icon="bookmark" onClick={() => setNaming(true)} />}
          {currentSaved && (
            <Button label={`Delete “${currentSaved}”`} icon="trash" onClick={() => remove(currentSaved)} />
          )}
        </div>
      )}
    </div>
  );
}
