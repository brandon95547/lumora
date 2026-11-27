// A song's piano: which keys are shown, how big a key is on screen, which keys are down at time t,
// and the cameras that look at it.
import { notesBetween } from '../scene.js';
import { aim, perspective } from '../view.js';
import { KEY, keysBetween, rangeFor } from './keyboard.js';

const models = new WeakMap();

/** The keys to show for a scene, worked out once. */
export function pianoOf(scene) {
  let model = models.get(scene);
  if (model) return model;
  const { layout } = scene;
  // The camera frames what the song plays: at least three octaves in 9:16, five in 16:9.
  const range = layout.portrait ? rangeFor(scene.items, 22, 30) : rangeFor(scene.items, 36, 51);
  const { keys, whites } = keysBetween(range.low, range.high);
  // In 9:16 the camera stays close, about two octaves wide, and follows the music along the keys.
  const framed = layout.portrait ? Math.min(whites, 15) : whites;
  const byPitch = new Map(keys.map((k) => [k.pitch, k]));
  model = {
    keys,
    whites,
    byPitch,
    framed,
    fit: (layout.width * (layout.portrait ? 0.96 : 0.94)) / framed, // pixels per white key, head on
    centers: scene.items.map((n) => {
      const k = byPitch.get(n.pitch);
      return k ? (k.x0 + k.x1) / 2 : whites / 2;
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

const DEG = Math.PI / 180;
const FOLLOW_SECONDS = 2.2; // how far either side of now the camera looks to decide where to be

/**
 * Where along the keys the camera centers at t: a smooth average of the notes around now, so it
 * glides with the music rather than jumping, and never shows past the ends of the keyboard.
 */
export function followX(scene, t) {
  const model = pianoOf(scene);
  if (model.framed >= model.whites) return model.whites / 2;
  let sum = model.whites / 2;
  let weight = 1; // a light pull to the middle keeps it steady through rests
  const around = notesBetween(scene, t - FOLLOW_SECONDS, t + FOLLOW_SECONDS);
  for (const note of around) {
    const w = Math.max(0, 1 - Math.abs(note.start - t) / FOLLOW_SECONDS) ** 2 * 4;
    sum += w * model.centers[note.index];
    weight += w;
  }
  const half = model.framed / 2;
  return Math.min(model.whites - half, Math.max(half, sum / weight));
}

/** Where the falling notes run, behind the keys: from the key backs to `runway` further back. */
export function runwayOf(scene) {
  const { layout } = scene;
  const model = pianoOf(scene);
  const keyFront = layout.height * (layout.portrait ? 0.82 : 0.9);
  const top = layout.height * (layout.portrait ? 0.1 : 0.04);
  return { keyFront, length: (keyFront - top) / model.fit - KEY.length, seconds: layout.portrait ? 2.6 : 2.2 };
}

/**
 * The camera on the piano. With no camera (2D) it looks straight down, like an overhead tutorial
 * shot. `falling` frames the keys low, leaving room above for the notes coming in.
 */
export function pianoView(scene, camera, t, falling) {
  const { layout } = scene;
  const model = pianoOf(scene);
  const runway = falling ? runwayOf(scene) : null;
  const x = followX(scene, t);
  const pivot = falling ? [x, 0, KEY.length] : [x, 0, KEY.length * 0.45];
  const anchorY = falling ? runway.keyFront - KEY.length * model.fit : layout.height * (layout.portrait ? 0.56 : 0.58);
  if (!camera) {
    return perspective({
      pivot,
      anchor: [layout.width / 2, anchorY],
      distance: model.framed * 12, // far and long: nearly flat
      zoom: model.fit,
      yaw: 0,
      pitch: 90 * DEG,
      fogFrom: 3,
      fogTo: 6,
    });
  }
  const { yaw, pitch } = aim(camera, t);
  return perspective({
    pivot,
    anchor: [layout.width / 2, anchorY + (falling ? 0 : layout.height * 0.02)],
    distance: model.framed * 1.25,
    zoom: model.fit * camera.zoom,
    yaw,
    pitch,
    fogFrom: 2.2,
    fogTo: 5,
  });
}
