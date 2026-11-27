// How the video looks: animation style, 2D or 3D (and the camera), colors, shape and title.
import { FORMATS } from '../../shared/scene/formats.js';
import { PALETTES } from '../../shared/scene/palettes.js';
import { STYLES } from '../../shared/scene/styles/index.js';
import { Choice } from '../../shared/ui/Choice.jsx';
import { Panel } from '../../shared/ui/Panel.jsx';
import { CameraControls } from './CameraControls.jsx';
import { StyleThumb } from './StyleThumb.jsx';

const VIEWS = [
  { id: '2d', label: '2D' },
  { id: '3d', label: '3D' },
];

function Swatch({ palette }) {
  const dots = palette.lit.length === 12 ? palette.lit.filter((_, i) => i % 3 === 0) : palette.lit;
  return (
    <span className="flex items-center gap-3 p-2.5">
      <span
        className="flex h-9 w-12 shrink-0 items-center justify-center gap-1 rounded-lg border border-line"
        style={{ background: `linear-gradient(${palette.background[0]}, ${palette.background[1]})` }}
      >
        {dots.map((c) => (
          <span key={c} className="size-2.5 rounded-full" style={{ background: c, boxShadow: `0 0 8px ${c}` }} />
        ))}
      </span>
      <span className="text-sm font-medium">{palette.name}</span>
    </span>
  );
}

export function LookPanel({ look, scene, onChange }) {
  const set = (key) => (value) => onChange({ ...look, [key]: value });
  const camera = look.view === '3d' ? look.camera : null;
  return (
    <Panel title="Look">
      <Choice
        label="Animation"
        variant="cards"
        options={STYLES}
        value={look.styleId}
        onChange={set('styleId')}
        render={(style) => (
          <>
            <StyleThumb style={style} scene={scene} paletteId={look.paletteId} camera={camera} />
            <span className="block px-3 pt-2 text-sm font-semibold">{style.name}</span>
            <span className="block px-3 pb-3 text-caption text-faint">{style.description}</span>
          </>
        )}
      />
      <Choice label="View" options={VIEWS} value={look.view} onChange={set('view')} />
      {camera && <CameraControls camera={camera} onChange={set('camera')} />}
      <Choice
        label="Colors"
        variant="cards"
        options={PALETTES}
        value={look.paletteId}
        onChange={set('paletteId')}
        render={(palette) => <Swatch palette={palette} />}
      />
      <Choice
        label="Shape"
        options={FORMATS}
        value={look.formatId}
        onChange={set('formatId')}
        render={(f) => (
          <>
            {f.label} <span className="text-faint">{f.hint}</span>
          </>
        )}
      />
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-muted">Title on the video</span>
        <input
          type="text"
          value={look.title}
          maxLength={60}
          placeholder="No title"
          onChange={(e) => set('title')(e.target.value)}
          className="h-10 rounded-lg border border-line bg-raised px-3 text-ink placeholder:text-faint focus:border-accent focus:outline-none"
        />
      </label>
    </Panel>
  );
}
