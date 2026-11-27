// How the video looks: the style (Staff or Piano) and its animation, 2D or 3D (and the camera),
// colors, shape and title.
import { FORMATS } from '../../shared/scene/formats.js';
import { PALETTES } from '../../shared/scene/palettes.js';
import { TITLE_FONTS, TITLE_SIZES } from '../../shared/scene/titles.js';
import { animationById, defaultCamera, KINDS, rigOf } from '../../shared/scene/kinds.js';
import { Choice } from '../../shared/ui/Choice.jsx';
import { Panel } from '../../shared/ui/Panel.jsx';
import { CameraControls } from './CameraControls.jsx';
import { AnimationThumb } from './AnimationThumb.jsx';

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
  const current = animationById(look.animationId);
  const { kind } = current;
  const rig = rigOf(kind, current);
  const camera = look.view === '3d' ? look.camera : null;
  // Each card shows its animation through the camera it would get.
  const thumbCamera = (animation) =>
    camera && (rigOf(kind, animation) === rig ? camera : defaultCamera(kind, animation));
  // A new style starts on its first animation, with its own camera.
  const setKind = (id) => {
    const next = KINDS.find((k) => k.id === id);
    onChange({ ...look, animationId: next.animations[0].id, camera: defaultCamera(next) });
  };
  return (
    <Panel title="Look">
      <Choice
        label="Style"
        options={KINDS.map((k) => ({ id: k.id, label: k.name }))}
        value={kind.id}
        onChange={setKind}
      />
      <Choice
        label="Animation"
        variant="cards"
        options={kind.animations}
        value={look.animationId}
        onChange={(id) => {
          // An animation with its own best angle (Gothic looks down the nave), or its own set of
          // angles (Marble Walk's floor), starts there; otherwise the camera stays where it is.
          const next = animationById(id);
          const fresh = next.defaultAngle || rigOf(kind, next) !== rig;
          onChange({ ...look, animationId: id, camera: fresh ? defaultCamera(kind, next) : look.camera });
        }}
        render={(animation) => (
          <>
            <AnimationThumb
              animation={animation}
              scene={scene}
              paletteId={look.paletteId}
              camera={thumbCamera(animation)}
            />
            <span className="block px-3 pt-2 text-sm font-semibold">{animation.name}</span>
            <span className="block px-3 pb-3 text-caption text-faint">{animation.description}</span>
          </>
        )}
      />
      <Choice label="View" options={VIEWS} value={look.view} onChange={set('view')} />
      {camera && <CameraControls rig={rig} camera={camera} onChange={set('camera')} />}
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
  );
}
