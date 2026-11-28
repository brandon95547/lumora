// Where things are, in the keyboard's world units (one white key's width, about 2.35 cm). y runs
// downward with the key tops at 0; z runs from the camera out into space. The keyboard floats at the
// origin facing the camera; each note's star waits far out in the sky beyond it, low notes to the
// left and high notes to the right, as on the keys.
import { noise } from '../envelope.js';
import { HIGHEST, isBlack, KEY, LOWEST } from '../piano/keyboard.js';

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

/**
 * Where note `seed`'s star waits in the sky: across a wide band from left (low) to right (high),
 * at its own height and distance.
 */
export function starOf(pitch, seed) {
  const k = (pitch - LOWEST) / (HIGHEST - LOWEST);
  return [(k - 0.5) * 300 + (noise(seed, 41) - 0.5) * 50, -(35 + 150 * noise(seed, 42)), 230 + 250 * noise(seed, 43)];
}
