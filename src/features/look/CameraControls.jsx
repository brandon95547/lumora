// Where the 3D camera stands: one of the kind's ready-made angles, or turned, tilted and moved in by hand.
import { angleOf } from '../../shared/scene/kinds.js';
import { Choice } from '../../shared/ui/Choice.jsx';
import { Slider } from '../../shared/ui/Slider.jsx';
import { Switch } from '../../shared/ui/Switch.jsx';

const degrees = (v) => `${v}°`;

export function CameraControls({ kind, camera, onChange }) {
  const set = (key) => (value) => onChange({ ...camera, [key]: value });
  const [turnMin, turnMax] = kind.turnRange;
  const [tiltMin, tiltMax] = kind.tiltRange;
  const [near, far] = kind.zoomRange;
  const third = (far - near) / 3;
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-3.5">
      <Choice
        label="Angle"
        options={kind.angles}
        value={angleOf(kind, camera)}
        onChange={(id) => {
          const { turn, tilt, zoom } = kind.angles.find((a) => a.id === id);
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
    </div>
  );
}
