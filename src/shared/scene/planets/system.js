// The solar system a song plays. Pitch is distance from the sun: the right hand plays the four rocky
// planets (its highest notes on Mercury, nearest the sun), the left hand the four giants (its lowest
// on Neptune, farthest out), and the asteroid belt between them is where the hands meet. A planet
// moves along its orbit with the music: a slow drift of its own, and a step forward for every note
// it plays. Everything is worked out once per song, so any frame can be drawn on its own.
//
// World units: the sun sits at the origin and the planets orbit in the plane y = 0 (y is down).
import { noise } from '../envelope.js';

export const SUN = 1.35;
export const BELT = [6.3, 7.4];
export const OUTER = 16; // just past Neptune's orbit: what the camera frames

export const PLANETS = [
  { id: 'mercury', hand: 'right', orbit: 2.6, size: 0.26 },
  { id: 'venus', hand: 'right', orbit: 3.5, size: 0.4 },
  { id: 'earth', hand: 'right', orbit: 4.45, size: 0.42, moons: [{ orbit: 0.8, size: 0.1, period: 5 }] },
  { id: 'mars', hand: 'right', orbit: 5.4, size: 0.32 },
  {
    id: 'jupiter',
    hand: 'left',
    orbit: 8.6,
    size: 0.95,
    moons: [
      { orbit: 1.3, size: 0.09, period: 3 },
      { orbit: 1.55, size: 0.08, period: 5 },
      { orbit: 1.85, size: 0.11, period: 8 },
      { orbit: 2.15, size: 0.1, period: 13 },
    ],
  },
  { id: 'saturn', hand: 'left', orbit: 10.9, size: 0.8, rings: true },
  { id: 'uranus', hand: 'left', orbit: 13.1, size: 0.52 },
  { id: 'neptune', hand: 'left', orbit: 15.2, size: 0.5 },
];

const PUSH = 0.35; // seconds a note's step along the orbit takes
const CHORD = 0.035; // onsets this close are one chord
const COMET_RUN = 6; // right-hand notes within COMET_WINDOW that call a comet
const COMET_WINDOW = 1.2;
const COMET_GAP = 10; // seconds at least between comets
export const COMET_LIFE = 4;

const systems = new WeakMap();

/** The three pitches that split a hand's notes evenly over its four planets. */
function bandsOf(pitches) {
  const sorted = [...pitches].sort((a, b) => a - b);
  return [0.25, 0.5, 0.75].map((q) => sorted[Math.floor(q * (sorted.length - 1))] ?? 60);
}

/** Which planet each note plays (by its index), when each planet is played, and the song's chords. */
export function systemOf(scene) {
  if (systems.has(scene)) return systems.get(scene);
  const planetOf = new Int8Array(scene.items.length);
  const starts = PLANETS.map(() => []);
  for (const hand of ['right', 'left']) {
    const notes = scene.items.filter((n) => n.hand === hand);
    const bands = bandsOf(notes.map((n) => n.pitch));
    const group = PLANETS.flatMap((p, k) => (p.hand === hand ? [k] : [])); // nearest the sun first
    for (const n of notes) {
      const band = bands.filter((b) => n.pitch > b).length; // 0 lowest … 3 highest
      // Higher notes sit nearer the sun.
      const k = group[3 - band];
      planetOf[n.index] = k;
      starts[k].push(n.start);
    }
  }
  const system = {
    planetOf,
    starts,
    phase: PLANETS.map((_, k) => noise(k, 41) * Math.PI * 2),
    alignments: alignmentsOf(scene, planetOf),
    comets: cometsOf(scene),
  };
  systems.set(scene, system);
  return system;
}

/** The song's chords of three notes or more over two planets or more: the planets line up. */
function alignmentsOf(scene, planetOf) {
  const out = [];
  const { items } = scene;
  for (let i = 0; i < items.length;) {
    let j = i + 1;
    while (j < items.length && items[j].start - items[i].start < CHORD) j++;
    const planets = [...new Set(items.slice(i, j).map((n) => planetOf[n.index]))].sort((a, b) => a - b);
    if (j - i >= 3 && planets.length >= 2) out.push({ start: items[i].start, planets });
    i = j;
  }
  return out;
}

/** A comet flies through on a fast right-hand run, never two within COMET_GAP seconds. */
function cometsOf(scene) {
  const right = scene.items.filter((n) => n.hand === 'right').map((n) => n.start);
  const comets = [];
  let last = -Infinity;
  for (let i = 0, j = 0; i < right.length; i++) {
    while (right[i] - right[j] > COMET_WINDOW) j++;
    if (i - j + 1 >= COMET_RUN && right[i] - last >= COMET_GAP && right[j] >= 2) {
      comets.push({ start: right[j], seed: comets.length });
      last = right[i];
    }
  }
  return comets;
}

/** How many of the sorted `times` are at or before t. */
function countUpTo(times, t) {
  let lo = 0;
  let hi = times.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (times[mid] <= t) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** Where planet k is along its orbit at t, in radians: its drift plus an eased step per note. */
export function planetAngle(scene, k, t) {
  const { starts, phase } = systemOf(scene);
  const { orbit } = PLANETS[k];
  const drift = 0.5 / orbit ** 1.5; // nearer the sun, faster, as Kepler has it
  const step = 0.24 / Math.sqrt(orbit);
  const times = starts[k];
  const done = countUpTo(times, t - PUSH);
  let moving = 0;
  for (let i = done; i < times.length && times[i] <= t; i++) moving += 1 - (1 - (t - times[i]) / PUSH) ** 3;
  return phase[k] + drift * t + step * (done + moving);
}

/** Planet k's place in the world at t. */
export function planetAt(scene, k, t) {
  const a = planetAngle(scene, k, t);
  const r = PLANETS[k].orbit;
  return [Math.cos(a) * r, 0, Math.sin(a) * r];
}

/** Where a comet is at t (null when it isn't in the sky), and how clearly it shows. */
export function cometAt(comet, t) {
  const u = (t - comet.start) / COMET_LIFE;
  if (u < 0 || u > 1) return null;
  const a = noise(comet.seed, 51) * Math.PI * 2; // which way it travels
  const miss = 3.5 + 5 * noise(comet.seed, 52); // how close it passes the sun
  const along = (u - 0.5) * OUTER * 2.6;
  return {
    x: -Math.sin(a) * miss + Math.cos(a) * along,
    y: -(0.8 + 1.6 * noise(comet.seed, 53)),
    z: Math.cos(a) * miss + Math.sin(a) * along,
    clear: Math.min(1, u / 0.12, (1 - u) / 0.15),
  };
}
