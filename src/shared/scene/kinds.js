// The kinds of scene (Staff, Piano, Fire) and their animations. Every animation knows its kind, which
// draws its stage; the Look panel picks a kind, then one of its animations.
import { fireKind } from './fire/index.js';
import { pianoKind } from './piano/index.js';
import { staffKind } from './staff/index.js';

export const KINDS = [staffKind, pianoKind, fireKind].map((source) => {
  const kind = { ...source };
  kind.animations = source.animations.map((animation) => ({ ...animation, kind }));
  return kind;
});

export const ANIMATIONS = KINDS.flatMap((kind) => kind.animations);

export const animationById = (id) => ANIMATIONS.find((a) => a.id === id) ?? ANIMATIONS[0];

export const kindById = (id) => KINDS.find((k) => k.id === id) ?? KINDS[0];

/**
 * The camera choices for an animation: its own (Marble Walk's floor angles) or its kind's. A rig has
 * an `id` (a kind's rig is the kind itself), `angles`, `defaultAngle`, `turnRange`, `tiltRange` and
 * `zoomRange`.
 */
export const rigOf = (kind, animation) => animation?.rig ?? kind;

/** The starting camera for an animation (its own angle if it has one, else its rig's), drift on. */
export const defaultCamera = (kind, animation = kind.animations[0]) => {
  const rig = rigOf(kind, animation);
  const id = animation.defaultAngle ?? rig.defaultAngle;
  const { turn, tilt, zoom } = rig.angles.find((a) => a.id === id);
  return { turn, tilt, zoom, drift: true };
};

/** The angle a camera matches, or null once it has been turned by hand. */
export function angleOf(rig, camera) {
  return rig.angles.find((a) => a.turn === camera.turn && a.tilt === camera.tilt)?.id ?? null;
}
