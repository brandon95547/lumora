// Fireplace: a keyboard on a stand before a raised fireplace, on a stage of dark marble glass adrift
// in a galaxy, and the song's notes are ember fireballs leaping out of the fire onto its keys
// (Embers). In 3D the camera looks over the keys to the fire; in 2D it looks straight down, the fire
// at the top of the frame.
import { energyAt } from '../energy.js';
import { pianoOf, keysDown } from '../piano/model.js';
import { drawInstrument } from '../piano/instrument.js';
import { aim, perspective, placed } from '../view.js';
import { drawEmberReflections, drawEmbers } from './embers.js';
import { drawFire, drawFireGlow, drawFirelight, flickerAt } from './fire.js';
import { FLOOR, KEYBOARD_ANGLE, KEYBOARD_ORIGIN } from './layout.js';
import { drawFireplace, drawStage, drawStand } from './hearth.js';
import { drawSpace } from './space.js';

const DEG = Math.PI / 180;
const FRAME = 72; // world units across the frame at the pivot, at zoom 1

/** Ready-made camera angles. Turn swings around the fireplace; tilt raises the camera. */
const FIREPLACE_ANGLES = [
  { id: 'player', label: 'Player', turn: 6, tilt: 26, zoom: 1 },
  { id: 'keys', label: 'Keys', turn: -6, tilt: 42, zoom: 1.7 },
  { id: 'hearth', label: 'Hearth', turn: -24, tilt: 16, zoom: 1.1 },
  { id: 'wide', label: 'Wide', turn: 18, tilt: 20, zoom: 0.55 },
];

export function fireplaceView(layout, camera, t) {
  const fit = Math.min(layout.width, layout.height * (layout.portrait ? 0.85 : 1.25)) * 0.92;
  if (!camera) {
    // From above: the keyboard near the bottom, the fire at the top.
    // The keyboard and the fireplace fill the frame; the stage runs on past them.
    const scale = Math.min((layout.width * 0.94) / 96, (layout.height * 0.8) / 72);
    return perspective({
      pivot: [32, 0, 70],
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
    pivot: [26, 0, 62],
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
    const opening = drawFireplace(ctx, view, layout, heat);
    drawFire(ctx, view, t, heat, opening);
    drawStand(ctx, keyboard, model);
    drawInstrument(ctx, keyboard, model, down, palette, keys);
    drawFirelight(ctx, view, layout, heat);
    drawEmbers(ctx, view, scene, model, t, palette, heat);
  },
};

function render(ctx, scene, t, animation, palette, camera) {
  drawSpace(ctx, scene.layout, palette, t, camera?.turn ?? 0);
  animation.draw(ctx, scene, t, palette, fireplaceView(scene.layout, camera, t));
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
  zoomRange: [0.5, 2.6],
  render,
};
