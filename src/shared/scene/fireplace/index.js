// Fireplace: a keyboard on a stand before a raised fireplace, on a stage of dark marble glass adrift
// in a galaxy, and the song's notes are ember fireballs leaping out of the fire onto its keys
// (Embers). In 3D the camera looks over the keys to the fire; in 2D it looks straight down, the fire
// at the top of the frame.
import { energyAt } from '../energy.js';
import { followX, keysDown, pianoOf } from '../piano/model.js';
import { drawInstrument } from '../piano/instrument.js';
import { aim, perspective, placed } from '../view.js';
import { drawEmberReflections, drawEmbers } from './embers.js';
import { drawFire, drawFireGlow, drawFirelight, flickerAt } from './fire.js';
import { FIRE_X, FLOOR, KEYBOARD_ANGLE, KEYBOARD_ORIGIN, keyboardToWorld } from './layout.js';
import { drawFireplace, drawStage, drawStand } from './hearth.js';
import { drawSpace } from './space.js';

const DEG = Math.PI / 180;
const FRAME = 84; // world units across the frame at the pivot, at zoom 1

/** Ready-made camera angles. Turn swings around the fireplace; tilt raises the camera. */
const FIREPLACE_ANGLES = [
  { id: 'player', label: 'Player', turn: -30, tilt: 20, zoom: 1 }, // from the side, the flight shows
  { id: 'front', label: 'Front', turn: 0, tilt: 24, zoom: 1 },
  { id: 'keys', label: 'Keys', turn: -14, tilt: 38, zoom: 1.7 },
  { id: 'wide', label: 'Wide', turn: 20, tilt: 22, zoom: 0.6 },
];

/**
 * Where the camera looks: between the keys and the fire, centered on the fireplace, or, with
 * `camera.follow`, moved along the keyboard to where the music is being played, so a close camera
 * keeps the played keys in frame. It glides there (`followX` averages the notes around t).
 */
function pivotOf(scene, camera, t) {
  const resting = [FIRE_X, 0, 48];
  if (!camera.follow) return resting;
  const framed = FRAME / camera.zoom; // world units across the frame at the pivot: about that many white keys
  const middle = keyboardToWorld(26, 0, 0);
  const played = keyboardToWorld(followX(scene, t, framed), 0, 0);
  return [resting[0] + played[0] - middle[0], 0, resting[2] + played[2] - middle[2]];
}

export function fireplaceView(scene, camera, t) {
  const { layout } = scene;
  const fit = Math.min(layout.width, layout.height * (layout.portrait ? 0.85 : 1.25)) * 0.92;
  if (!camera) {
    // From above: the keyboard near the bottom, the fire at the top.
    // The keyboard and the fireplace fill the frame; the stage runs on past them.
    const scale = Math.min((layout.width * 0.94) / 96, (layout.height * 0.8) / 92);
    return perspective({
      pivot: [FIRE_X, 0, 56],
      anchor: [layout.width / 2, layout.height * 0.55],
      distance: 4000,
      zoom: scale,
      yaw: 0,
      pitch: 90 * DEG,
      fogFrom: 3,
      fogTo: 6,
    });
  }
  const { yaw, pitch } = aim(camera, t);
  return perspective({
    pivot: pivotOf(scene, camera, t),
    anchor: [layout.width / 2, layout.height * (layout.portrait ? 0.5 : 0.52)],
    distance: (FRAME * 1.6) / Math.sqrt(camera.zoom),
    zoom: (fit / FRAME) * camera.zoom,
    yaw,
    pitch,
    fogFrom: 3,
    fogTo: 6,
  });
}

export const embers = {
  id: 'fireplace-embers',
  name: 'Embers',
  description:
    'Ember fireballs leap out of the fire and land on the keys as the notes sound, each hand in its own color; the fire grows as the song builds.',
  draw(ctx, scene, t, palette, view) {
    const { layout } = scene;
    const model = pianoOf(scene);
    const heat = flickerAt(t, energyAt(scene, t));
    const keyboard = placed(view, KEYBOARD_ANGLE, KEYBOARD_ORIGIN);
    const down = keysDown(scene, t);
    const keys = { tint: 0.55, light: 0.6, lightAtBack: true };
    drawStage(ctx, view, (mirror, y) => {
      drawFireGlow(ctx, mirror, heat);
      if (y === FLOOR) {
        const mirroredKeyboard = placed(mirror, KEYBOARD_ANGLE, KEYBOARD_ORIGIN);
        drawStand(ctx, mirroredKeyboard, model);
        drawInstrument(ctx, mirroredKeyboard, model, down, palette, keys);
      }
      drawEmberReflections(ctx, mirror, scene, model, t, palette);
    });
    const opening = drawFireplace(ctx, view, heat);
    drawFire(ctx, view, t, heat, opening);
    drawStand(ctx, keyboard, model);
    drawInstrument(ctx, keyboard, model, down, palette, keys);
    drawFirelight(ctx, view, layout, heat);
    drawEmbers(ctx, view, scene, model, t, palette, heat);
  },
};

function render(ctx, scene, t, animation, palette, camera) {
  drawSpace(ctx, scene.layout, palette, t, camera?.turn ?? 0);
  animation.draw(ctx, scene, t, palette, fireplaceView(scene, camera, t));
}

export const fireplaceKind = {
  id: 'fireplace',
  name: 'Fireplace',
  description: 'A keyboard by a fireplace in space, its notes ember fireballs.',
  animations: [embers],
  angles: FIREPLACE_ANGLES,
  defaultAngle: 'player',
  turnRange: [-60, 60],
  tiltRange: [4, 70],
  zoomRange: [0.5, 4],
  follows: true, // the camera can follow the keys being played
  render,
};
