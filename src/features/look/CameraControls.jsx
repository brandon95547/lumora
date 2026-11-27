// Where the 3D camera stands: a ready-made angle, or turned, tilted and moved in by hand.
import { ANGLES, angleOf, TILT_RANGE, TURN_RANGE } from '../../shared/scene/view.js';
import { Choice } from '../../shared/ui/Choice.jsx';
import { Slider } from '../../shared/ui/Slider.jsx';
import { Switch } from '../../shared/ui/Switch.jsx';

const degrees = (v) => `${v}°`;

export function CameraControls({ camera, onChange }) {
  const set = (key) => (value) => onChange({ ...camera, [key]: value });
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-3.5">
      <Choice
        label="Angle"
        options={ANGLES}
        value={angleOf(camera)}
        onChange={(id) => {
          const { turn, tilt, zoom } = ANGLES.find((a) => a.id === id);
          onChange({ ...camera, turn, tilt, zoom });
        }}
      />
      <Slider
        label="Turn"
        value={camera.turn}
        min={TURN_RANGE[0]}
        max={TURN_RANGE[1]}
        onChange={set('turn')}
        format={degrees}
      />
      <Slider
        label="Tilt"
        value={camera.tilt}
        min={TILT_RANGE[0]}
        max={TILT_RANGE[1]}
        onChange={set('tilt')}
        format={degrees}
      />
      <Slider
        label="Distance"
        value={camera.zoom}
        min={0.6}
        max={1.4}
        step={0.02}
        onChange={set('zoom')}
        format={(v) => (v >= 1 ? 'Close' : v <= 0.75 ? 'Far' : 'Middle')}
      />
      <Switch label="Gentle camera drift" checked={camera.drift} onChange={set('drift')} />
    </div>
  );
}
