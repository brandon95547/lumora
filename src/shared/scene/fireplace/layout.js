// Where things stand in the fireplace room, in the keyboard's world units (one white key's width,
// about 2.35 cm). y runs downward with the key tops at 0 and the floor below them; z runs from the
// player toward the back wall, where the fireplace is. The keyboard stands turned toward the fire.
import { noise } from '../envelope.js';
import { isBlack, KEY } from '../piano/keyboard.js';

export const FLOOR = 31; // key tops stand about 73 cm off the floor
export const WALL_Z = 92;
export const FIRE_X = 34; // the fireplace's middle
export const OPENING = { half: 21, top: 0 }; // the firebox opening: 42 wide, up from the floor to y = 0
export const BREAST = { half: 34, front: WALL_Z - 6 }; // the chimney breast standing out from the wall
export const MANTEL = { half: 41, top: -9, bottom: -6, front: WALL_Z - 11 };
export const HEARTH = { half: 44, front: WALL_Z - 22 };

// The keyboard: turned 22° so its treble end sits nearer the fire, its middle about here.
export const KEYBOARD_ANGLE = (22 * Math.PI) / 180;
const MIDDLE = [6, 0, 16];
const HALF = 26; // half of the 52 white keys

export const KEYBOARD_ORIGIN = [
  MIDDLE[0] - HALF * Math.cos(KEYBOARD_ANGLE),
  0,
  MIDDLE[2] - HALF * Math.sin(KEYBOARD_ANGLE),
];

/** A point on the keyboard (its own x along the keys, z back from the key fronts) in the room. */
export function keyboardToRoom(x, y, z) {
  const [c, s] = [Math.cos(KEYBOARD_ANGLE), Math.sin(KEYBOARD_ANGLE)];
  const [ox, oy, oz] = KEYBOARD_ORIGIN;
  return [ox + x * c - z * s, oy + y, oz + x * s + z * c];
}

/** Where a fireball lands on a key: just above the middle of its top, in the room. */
export function landingOf(model, pitch) {
  const key = model.byPitch.get(pitch);
  const x = key ? (key.x0 + key.x1) / 2 : HALF;
  const black = isBlack(pitch);
  return keyboardToRoom(x, black ? -KEY.blackHeight - 0.3 : -0.3, black ? KEY.length - 2 : KEY.length * 0.45);
}

/** Where fireball `seed` leaves the fire: somewhere across the burning logs, low in the firebox. */
export function launchOf(seed) {
  return [FIRE_X + (noise(seed, 21) - 0.5) * 22, FLOOR - 7 - 4 * noise(seed, 22), WALL_Z - 3];
}
