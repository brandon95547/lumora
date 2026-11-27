// A song's piano: all 88 keys, which are down at time t, where the music sits along them, and the
// cameras that look at it.
import { notesBetween } from '../scene.js';
import { aim, perspective } from '../view.js';
import { CASE } from './grand.js';
import { HIGHEST, KEY, keysBetween, LOWEST, rangeFor, whiteIndex } from './keyboard.js';

const models = new WeakMap();

/** The keyboard and the part of it the song uses, worked out once per scene. */
export function pianoOf(scene) {
  let model = models.get(scene);
  if (model) return model;
  const { layout } = scene;
  const { keys, whites } = keysBetween(LOWEST, HIGHEST);
  const byPitch = new Map(keys.map((k) => [k.pitch, k]));
  // The span the song plays (at least three octaves in 9:16, five in 16:9): what the overhead
  // 2D shot frames, and where a close camera rests.
  const range = rangeFor(scene.items, layout.portrait ? 22 : 36, 51);
  const low = whiteIndex(range.low);
  const span = { center: (low + whiteIndex(range.high) + 1) / 2, whites: whiteIndex(range.high) - low + 1 };
  model = {
    keys,
    whites,
    byPitch,
    span,
    flatFit: (layout.width * (layout.portrait ? 0.96 : 0.94)) / span.whites, // pixels per white key, overhead
    centers: scene.items.map((n) => {
      const k = byPitch.get(n.pitch);
      return k ? (k.x0 + k.x1) / 2 : span.center;
    }),
  };
  models.set(scene, model);
  return model;
}

const DOWN = 0.03; // seconds for a key to go down
const UP = 0.08; // and to come back up

/** How far a note holds its key down at t, 0–1. */
export function pressOf(note, t) {
  if (t < note.start) return 0;
  const reach = Math.min(1, (Math.min(t, note.end) - note.start) / DOWN);
  return t <= note.end ? reach : reach * Math.max(0, 1 - (t - note.end) / UP);
}

/** Pitch → { amount, note } for every key that is down at t. */
export function keysDown(scene, t) {
  const down = new Map();
  for (const note of notesBetween(scene, t - UP, t)) {
    const amount = pressOf(note, t);
    if (amount > 0 && amount > (down.get(note.pitch)?.amount ?? 0)) down.set(note.pitch, { amount, note });
  }
  return down;
}

const FOLLOW_SECONDS = 2.2; // how far either side of now the camera looks to decide where to be

/**
 * Where along the keys a camera `framed` white keys wide centers at t: a smooth average of the
 * notes around now, so it glides with the music rather than jumping, and never shows past the
 * ends of the keyboard.
 */
export function followX(scene, t, framed) {
  const model = pianoOf(scene);
  if (framed >= model.whites) return model.whites / 2;
  let sum = model.span.center;
  let weight = 1; // a light pull to the song's middle keeps it steady through rests
  for (const note of notesBetween(scene, t - FOLLOW_SECONDS, t + FOLLOW_SECONDS)) {
    const w = Math.max(0, 1 - Math.abs(note.start - t) / FOLLOW_SECONDS) ** 2 * 4;
    sum += w * model.centers[note.index];
    weight += w;
  }
  const half = framed / 2;
  return Math.min(model.whites - half, Math.max(half, sum / weight));
}

/** Where the falling notes run, behind the keys: from the key backs to `length` further back. */
export function runwayOf(scene) {
  const { layout } = scene;
  const model = pianoOf(scene);
  const keyFront = layout.height * (layout.portrait ? 0.82 : 0.9);
  const top = layout.height * (layout.portrait ? 0.1 : 0.04);
  return { keyFront, length: (keyFront - top) / model.flatFit - KEY.length, seconds: layout.portrait ? 2.6 : 2.2 };
}

const DEG = Math.PI / 180;
const mix = (a, b, k) => a + (b - a) * k;

/**
 * The camera on the piano. With no camera (2D) it looks straight down at the keys the song uses,
 * like an overhead lesson shot. In 3D, `zoom` 1 frames the whole instrument across; closer in,
 * the camera turns its attention from the piano to the keys and follows the music along them.
 * `falling` keeps the keys low in the frame, leaving room for the notes coming in.
 */
export function pianoView(scene, camera, t, falling) {
  const { layout } = scene;
  const model = pianoOf(scene);
  const runway = falling ? runwayOf(scene) : null;
  const keysY = falling
    ? runway.keyFront - KEY.length * model.flatFit
    : layout.height * (layout.portrait ? 0.56 : 0.58);
  const keysZ = falling ? KEY.length : KEY.length * 0.45;
  if (!camera) {
    return perspective({
      pivot: [model.span.center, 0, keysZ],
      anchor: [layout.width / 2, keysY],
      distance: model.span.whites * 12, // far and long: nearly flat
      zoom: model.flatFit,
      yaw: 0,
      pitch: 90 * DEG,
      fogFrom: 3,
      fogTo: 6,
    });
  }
  const { yaw, pitch } = aim(camera, t);
  // A phone frame is narrow: the same angle comes 30% closer so the piano fills it.
  const zoom = camera.zoom * (layout.portrait ? 1.3 : 1);
  const framed = CASE.width / zoom;
  const close = falling ? 1 : Math.max(0, Math.min(1, (camera.zoom - 0.8) / 0.6));
  const x = mix(CASE.centerX, followX(scene, t, framed), close);
  return perspective({
    pivot: [x, 0, mix(CASE.centerZ, keysZ, close)],
    // Turned, the keyboard end swings toward the camera; wide shots shift over to keep it in frame.
    anchor: [
      layout.width * (0.5 + mix(-0.2 * Math.sin(yaw), 0, close)),
      mix(layout.height * (layout.portrait ? 0.58 : 0.62), keysY, close),
    ],
    // Close shots stand near (strong perspective); wide ones stand back so the whole piano fits.
    distance: Math.max(30, framed * mix(2.4, 1.3, close)),
    zoom: ((layout.width * 0.92) / CASE.width) * zoom,
    yaw,
    pitch,
    fogFrom: 2.2,
    fogTo: 5,
  });
}
