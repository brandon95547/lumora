// Where things stand, in the keyboard's world units (one white key's width, about 2.35 cm). y runs
// downward with the key tops at 0; z runs from the camera toward the fireplace. Everything stands on
// a stage of dark marble glass: the keyboard on its floor, and behind it the fireplace raised on a
// dais, so its fire shows over the keys. The keyboard faces the camera, turned a little, and stands
// a little left of the fire, so the fireballs fly toward the player and land on the keys head-on.
import { noise } from '../envelope.js';
import { isBlack, KEY } from '../piano/keyboard.js';

export const FLOOR = 31; // the stage's floor: key tops stand about 73 cm above it
export const DAIS = 12; // how high the fireplace is raised
export const HEARTH_Y = FLOOR - DAIS; // the fire's floor, the dais top
export const WALL_Z = 92; // the fireplace's back
export const FIRE_X = 34; // the fireplace's middle
export const OPENING = { half: 21, top: HEARTH_Y - 31 }; // the firebox opening: 42 wide, 31 high
export const BREAST = { half: 34, front: WALL_Z - 6 }; // the stone surround
export const MANTEL = { half: 41, top: HEARTH_Y - 40, bottom: HEARTH_Y - 37, front: WALL_Z - 11 };
export const STAGE = { x: [-34, 102], z: [22, WALL_Z + 8] }; // the marble floor
export const DAIS_SPAN = { x: [FIRE_X - 48, FIRE_X + 48], z: [WALL_Z - 24, WALL_Z + 6] };

// The keyboard: its left end (the lowest key) here, turned 4° so its treble end sits a little
// further back, left of the fire's middle.
export const KEYBOARD_ANGLE = (4 * Math.PI) / 180;
export const KEYBOARD_ORIGIN = [-5.2, 0, 45.7];
const HALF = 26; // half of the 52 white keys

/** A point on the keyboard (its own x along the keys, z back from the key fronts) in the world. */
export function keyboardToWorld(x, y, z) {
  const [c, s] = [Math.cos(KEYBOARD_ANGLE), Math.sin(KEYBOARD_ANGLE)];
  const [ox, oy, oz] = KEYBOARD_ORIGIN;
  return [ox + x * c - z * s, oy + y, oz + x * s + z * c];
}

/** Where a fireball lands on a key: just above the middle of its top, in the world. */
export function landingOf(model, pitch) {
  const key = model.byPitch.get(pitch);
  const x = key ? (key.x0 + key.x1) / 2 : HALF;
  const black = isBlack(pitch);
  return keyboardToWorld(x, black ? -KEY.blackHeight - 0.3 : -0.3, black ? KEY.length - 2 : KEY.length * 0.45);
}

/** Where fireball `seed` leaves the fire: somewhere across the burning logs, low in the firebox. */
export function launchOf(seed) {
  return [FIRE_X + (noise(seed, 21) - 0.5) * 22, HEARTH_Y - 7 - 4 * noise(seed, 22), WALL_Z - 3];
}
