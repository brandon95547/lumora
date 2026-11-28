// Where things are, in the keyboard's world units (one white key's width, about 2.35 cm). y runs
// downward with the key tops at 0; z runs from the camera out into space. The keyboard floats at the
// origin facing the camera; the galaxy the stars come from is far out beyond it (spiral.js).
import { isBlack, KEY } from '../piano/keyboard.js';

const HALF = 26; // half of the 52 white keys
export const KEYBOARD_ORIGIN = [-HALF, 0, 0]; // the lowest key's front corner

/** A point on the keyboard (its own x along the keys, z back from the key fronts) in the world. */
export const keyboardToWorld = (x, y, z) => [KEYBOARD_ORIGIN[0] + x, y, z];

/** Where a star lands on a key: just above the middle of its top, in the world. */
export function landingOf(model, pitch) {
  const key = model.byPitch.get(pitch);
  const x = key ? (key.x0 + key.x1) / 2 : HALF;
  const black = isBlack(pitch);
  return keyboardToWorld(x, black ? -KEY.blackHeight - 0.3 : -0.3, black ? KEY.length - 2 : KEY.length * 0.45);
}
