// How the video looks, in three sections of the side panel: Style (the kind of scene, its
// animation, 2D or 3D and the camera), Colors, and Title.
import { PALETTES, paletteById } from '../../shared/scene/palettes.js';
import { titleFontById, TITLE_FONTS, titleSizeById, TITLE_SIZES } from '../../shared/scene/titles.js';
import { animationById, defaultCamera, KINDS, rigOf } from '../../shared/scene/kinds.js';
import { Choice } from '../../shared/ui/Choice.jsx';
import { Panel } from '../../shared/ui/Panel.jsx';
import { Slider } from '../../shared/ui/Slider.jsx';
import { CameraControls } from './CameraControls.jsx';

const VIEWS = [
  { id: '2d', label: '2D' },
  { id: '3d', label: '3D' },
];

function Swatch({ palette }) {
  const dots = palette.lit.length === 12 ? palette.lit.filter((_, i) => i % 3 === 0) : palette.lit;
  return (
    <span className="flex items-center gap-3" aria-hidden="true">
      <span
        className="flex h-10 w-12 shrink-0 items-center justify-center gap-1 rounded-lg border border-line"
        style={{ background: `linear-gradient(${palette.background[0]}, ${palette.background[1]})` }}
      >
        {dots.map((c) => (
          <span key={c} className="size-2.5 rounded-full" style={{ background: c, boxShadow: `0 0 8px ${c}` }} />
        ))}
      </span>
    </span>
  );
}

export function LookPanel({ look, onChange }) {
  const set = (key) => (value) => onChange({ ...look, [key]: value });
  const current = animationById(look.animationId);
  const { kind } = current;
  const rig = rigOf(kind, current);
  const camera = look.view === '3d' ? look.camera : null;
  const palette = paletteById(look.paletteId);
  // A new style starts on its first animation, with its own camera.
  const setKind = (id) => {
    const next = KINDS.find((k) => k.id === id);
    onChange({ ...look, animationId: next.animations[0].id, camera: defaultCamera(next), flatZoom: 1 });
  };
  return (
    <>
      <Panel title="Style" summary={`${kind.name} · ${current.name} · ${look.view.toUpperCase()}`}>
        <Choice
          label="Style"
          options={KINDS.map((k) => ({ id: k.id, label: k.name }))}
          value={kind.id}
          onChange={setKind}
        />
        <div className="flex flex-col gap-1.5">
          <Choice
            label="Animation"
            variant="menu"
            options={kind.animations.map((a) => ({ id: a.id, label: a.name }))}
            value={look.animationId}
            onChange={(id) => {
              // An animation with its own best angle, or its own set of angles (Marble Walk's floor),
              // starts there; otherwise the camera stays where it is.
              const next = animationById(id);
              const fresh = next.defaultAngle || rigOf(kind, next) !== rig;
              onChange({ ...look, animationId: id, camera: fresh ? defaultCamera(kind, next) : look.camera });
            }}
          />
          <p className="text-caption text-faint">{current.description}</p>
        </div>
        <Choice label="View" options={VIEWS} value={look.view} onChange={set('view')} />
        {camera && <CameraControls rig={rig} camera={camera} onChange={set('camera')} />}
        {!camera && kind.flatZoomRange && (
          <Slider
            label="Zoom"
            value={look.flatZoom}
            min={kind.flatZoomRange[0]}
            max={kind.flatZoomRange[1]}
            step={0.05}
            onChange={set('flatZoom')}
            format={(v) => `${v.toFixed(1)}×`}
          />
        )}
      </Panel>

      <Panel title="Colors" summary={palette.name}>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Choice
              label="Colors"
              variant="menu"
              options={PALETTES.map((p) => ({ id: p.id, label: p.name }))}
              value={look.paletteId}
              onChange={set('paletteId')}
            />
          </div>
          <Swatch palette={palette} />
        </div>
      </Panel>

      <Panel
        title="Title"
        summary={
          look.title
            ? `“${look.title}” · ${titleFontById(look.titleFontId).label} · ${titleSizeById(look.titleSizeId).label}`
            : 'No title'
        }
      >
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-muted">Title on the video</span>
          <input
            type="text"
            value={look.title}
            maxLength={60}
            placeholder="Type a title, or leave it empty for none"
            onChange={(e) => set('title')(e.target.value)}
            className="h-10 rounded-lg border border-line bg-raised px-3 text-ink placeholder:text-faint focus:border-accent focus:outline-none"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Choice
            label="Title font"
            variant="menu"
            options={TITLE_FONTS}
            value={look.titleFontId}
            onChange={set('titleFontId')}
          />
          <Choice
            label="Title size"
            variant="menu"
            options={TITLE_SIZES}
            value={look.titleSizeId}
            onChange={set('titleSizeId')}
          />
        </div>
      </Panel>
    </>
  );
}
