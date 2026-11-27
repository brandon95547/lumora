// A piano keyboard's geometry, in world units of one white-key width (W = 1).
// x runs left to right along the keys, y downward (key tops at 0), z from the key fronts (0)
// back toward the fallboard. Proportions follow a real grand: a white key is about 6.4 widths long.

export const LOWEST = 21; // A0
export const HIGHEST = 108; // C8

export const KEY = {
  length: 6.2, // white key, front to back
  gap: 0.05, // between white keys
  nose: 0.5, // height of a white key's front face
  blackWidth: 0.56,
  blackLength: 4.0,
  blackHeight: 0.42, // how far a black key stands above the whites
  whitePress: 0.3, // how far a key's front goes down when played
  blackPress: 0.26,
};

const WHITE_CLASSES = [0, 2, 4, 5, 7, 9, 11];
// Black keys sit a little off the line between their white neighbors, as on a real keyboard.
const BLACK_OFFSET = { 1: -0.1, 3: 0.1, 6: -0.13, 8: 0, 10: 0.13 };

export const isBlack = (pitch) => !WHITE_CLASSES.includes(pitch % 12);

/** Index of a white key counted from A0 (0) up. */
export function whiteIndex(pitch) {
  return Math.floor(pitch / 12) * 7 + WHITE_CLASSES.indexOf(pitch % 12) - 12;
}

/** The white key at or below a pitch. */
const whiteAtOrBelow = (pitch) => (isBlack(pitch) ? pitch - 1 : pitch);
/** The white key at or above a pitch. */
const whiteAtOrAbove = (pitch) => (isBlack(pitch) ? pitch + 1 : pitch);

/**
 * The keys to show for a song: the whole piano when there is room, or the part the song uses with
 * a margin either side, at least `minWhites` white keys wide.
 */
export function rangeFor(notes, minWhites, maxWhites = 52) {
  if (maxWhites >= 52 || !notes.length) return { low: LOWEST, high: HIGHEST };
  let lo = Math.min(...notes.map((n) => n.pitch));
  let hi = Math.max(...notes.map((n) => n.pitch));
  lo = whiteAtOrBelow(lo);
  hi = whiteAtOrAbove(hi);
  let lowW = whiteIndex(lo) - 2;
  let highW = whiteIndex(hi) + 2;
  for (let grow = 0; highW - lowW + 1 < minWhites; grow++) {
    if (grow % 2) highW++;
    else lowW--;
  }
  // Keep inside the piano, shifting rather than shrinking.
  if (lowW < 0) [lowW, highW] = [0, highW - lowW];
  if (highW > 51) [lowW, highW] = [Math.max(0, lowW - (highW - 51)), 51];
  return { low: pitchOfWhite(lowW), high: pitchOfWhite(highW) };
}

export function pitchOfWhite(index) {
  const n = index + 12;
  return Math.floor(n / 7) * 12 + WHITE_CLASSES[n % 7];
}

/** Every key from `low` to `high` (both white), with its left and right edge and length. */
export function keysBetween(low, high) {
  const first = whiteIndex(low);
  const keys = [];
  for (let pitch = low; pitch <= high; pitch++) {
    if (isBlack(pitch)) {
      const center = whiteIndex(pitch - 1) - first + 1 + BLACK_OFFSET[pitch % 12];
      keys.push({ pitch, black: true, x0: center - KEY.blackWidth / 2, x1: center + KEY.blackWidth / 2 });
    } else {
      const i = whiteIndex(pitch) - first;
      keys.push({ pitch, black: false, x0: i + KEY.gap / 2, x1: i + 1 - KEY.gap / 2 });
    }
  }
  return { keys, whites: whiteIndex(high) - first + 1 };
}
