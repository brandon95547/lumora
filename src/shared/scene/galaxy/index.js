// Galaxy: a keyboard floating in space, and the song's notes are stars far out in the sky that shoot
// down onto its keys (Shooting Stars). In 3D the camera stands behind the keyboard looking out into
// the galaxy, and can follow the keys being played; in 2D it looks straight down, the stars coming in
// from the top of the frame.
import { followX, keysDown, pianoOf } from '../piano/model.js';
import { drawInstrument } from '../piano/instrument.js';
import { aim, perspective, placed } from '../view.js';
import { KEYBOARD_ORIGIN, keyboardToWorld } from './layout.js';
import { drawSpace } from './space.js';
import { drawShootingStars } from './stars.js';

const DEG = Math.PI / 180;
const FRAME = 70; // world units across the frame at the keyboard, at zoom 1

/** Ready-made camera angles. Turn swings around the keyboard; tilt raises the camera. */
const GALAXY_ANGLES = [
  { id: 'player', label: 'Player', turn: 0, tilt: 30, zoom: 1.2 },
  { id: 'side', label: 'Side', turn: -35, tilt: 16, zoom: 1.1 },
  { id: 'keys', label: 'Keys', turn: -8, tilt: 32, zoom: 2.2 },
  { id: 'wide', label: 'Wide', turn: 0, tilt: 6, zoom: 0.55 },
];

/**
 * Where the camera looks: the keyboard's middle, or, with `camera.follow`, the part of it where the
 * music is being played, so a close camera keeps the played keys in frame. It glides there
 * (`followX` averages the notes around t) and stops at the keyboard's ends.
 */
function pivotOf(scene, camera, t) {
  const middle = keyboardToWorld(26, 0, 4);
  if (!camera.follow) return middle;
  return keyboardToWorld(followX(scene, t, FRAME / camera.zoom), 0, 4);
}

export function galaxyView(scene, camera, t) {
  const { layout } = scene;
  if (!camera) {
    // From above: the keyboard low in the frame, the stars coming in from the top.
    const scale = Math.min((layout.width * 0.94) / 64, (layout.height * 0.8) / 150);
    return perspective({
      pivot: [0, 0, 55],
      anchor: [layout.width / 2, layout.height * 0.55],
      distance: 6000,
      zoom: scale,
      yaw: 0,
      pitch: 90 * DEG,
      fogFrom: 3,
      fogTo: 6,
    });
  }
  const { yaw, pitch } = aim(camera, t);
  const fit = Math.min(layout.width, layout.height * (layout.portrait ? 0.85 : 1.25)) * 0.92;
  return perspective({
    pivot: pivotOf(scene, camera, t),
    // The keyboard low in the frame, the sky above it.
    anchor: [layout.width / 2, layout.height * (layout.portrait ? 0.7 : 0.72)],
    distance: (FRAME * 1.6) / Math.sqrt(camera.zoom),
    zoom: (fit / FRAME) * camera.zoom,
    yaw,
    pitch,
    fogFrom: 3,
    fogTo: 8,
  });
}

export const shootingStars = {
  id: 'galaxy-shooting-stars',
  name: 'Shooting Stars',
  description:
    'Each note is a star in the sky that shoots down and lands on its key as the note sounds, each hand in its own color.',
  draw(ctx, scene, t, palette, view) {
    const model = pianoOf(scene);
    drawInstrument(ctx, placed(view, 0, KEYBOARD_ORIGIN), model, keysDown(scene, t), palette, {
      tint: 0.55,
      light: 0.6,
      lightAtBack: true,
      base: true,
    });
    drawShootingStars(ctx, view, scene, model, t, palette);
  },
};

function render(ctx, scene, t, animation, palette, camera) {
  drawSpace(ctx, scene.layout, palette, t, camera?.turn ?? 0);
  animation.draw(ctx, scene, t, palette, galaxyView(scene, camera, t));
}

export const galaxyKind = {
  id: 'galaxy',
  name: 'Galaxy',
  description: 'A keyboard in space, its notes shooting stars.',
  animations: [shootingStars],
  angles: GALAXY_ANGLES,
  defaultAngle: 'player',
  turnRange: [-60, 60],
  tiltRange: [2, 70],
  zoomRange: [0.5, 4],
  follows: true, // the camera can follow the keys being played
  render,
};
