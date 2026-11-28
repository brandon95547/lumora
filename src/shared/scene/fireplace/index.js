// Fireplace: a keyboard stands at an angle to the fireplace in a warm room, and the song's notes are
// ember fireballs leaping out of the fire onto its keys (Embers). In 3D the camera stands behind the
// player looking toward the fire; in 2D it looks straight down, the fire at the top of the frame.
import { energyAt } from '../energy.js';
import { pianoOf, keysDown } from '../piano/model.js';
import { drawInstrument } from '../piano/instrument.js';
import { aim, perspective, placed } from '../view.js';
import { drawEmbers } from './embers.js';
import { drawFire, drawFirelight, flickerAt } from './fire.js';
import { KEYBOARD_ANGLE, KEYBOARD_ORIGIN, WALL_Z } from './layout.js';
import { drawConsole, drawRoom } from './room.js';

const DEG = Math.PI / 180;
const FRAME = 92; // world units across the frame at the pivot, at zoom 1

/** Ready-made camera angles. Turn swings around the room; tilt raises the camera. */
const FIREPLACE_ANGLES = [
  { id: 'player', label: 'Player', turn: 8, tilt: 20, zoom: 1 },
  { id: 'hearth', label: 'Hearth', turn: 32, tilt: 12, zoom: 0.85 },
  { id: 'keys', label: 'Keys', turn: -12, tilt: 40, zoom: 1.7 },
  { id: 'room', label: 'Room', turn: -28, tilt: 15, zoom: 0.6 },
];

export function fireplaceView(layout, camera, t) {
  const fit = Math.min(layout.width, layout.height * (layout.portrait ? 0.85 : 1.25)) * 0.92;
  if (!camera) {
    // From above: the keyboard near the bottom, the fire at the top.
    const scale = Math.min((layout.width * 0.94) / 86, (layout.height * 0.8) / (WALL_Z + 16));
    return perspective({
      pivot: [7, 0, WALL_Z / 2 - 4],
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
    pivot: [10, 0, 40],
    anchor: [layout.width / 2, layout.height * (layout.portrait ? 0.6 : 0.62)],
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
    ctx.fillStyle = '#0a0503';
    ctx.fillRect(0, 0, layout.width, layout.height);
    const opening = drawRoom(ctx, view, keyboard, layout, heat);
    drawFire(ctx, view, t, heat, opening);
    drawConsole(ctx, keyboard, model);
    drawInstrument(ctx, keyboard, model, keysDown(scene, t), palette, { tint: 0.55, light: 0.6, lightAtBack: true });
    drawFirelight(ctx, view, layout, heat);
    drawEmbers(ctx, view, scene, model, t, palette, heat);
  },
};

function render(ctx, scene, t, animation, palette, camera) {
  animation.draw(ctx, scene, t, palette, fireplaceView(scene.layout, camera, t));
}

export const fireplaceKind = {
  id: 'fireplace',
  name: 'Fireplace',
  description: 'A keyboard by the fire, its notes ember fireballs.',
  animations: [embers],
  angles: FIREPLACE_ANGLES,
  defaultAngle: 'player',
  turnRange: [-60, 60],
  tiltRange: [4, 70],
  zoomRange: [0.5, 2.6],
  render,
};
