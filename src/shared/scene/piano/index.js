// Piano: bars of light fall onto a grand piano's keys (Falling Notes), straight down from above (2D)
// or filmed from an angle (3D).
import { depthBackdrop } from '../backdrop.js';
import { falling } from './falling.js';
import { pianoOf, pianoView } from './model.js';

/** Ready-made camera angles around the keyboard. */
// Distance: 1 frames a grand piano's width of keys; higher comes in closer.
const PIANO_ANGLES = [
  { id: 'side', label: 'Side', turn: -30, tilt: 34, zoom: 1.5 },
  { id: 'player', label: 'Player', turn: 0, tilt: 38, zoom: 2.4 },
  { id: 'overhead', label: 'Overhead', turn: 0, tilt: 72, zoom: 1.9 },
];

function render(ctx, scene, t, animation, palette, camera, flatZoom) {
  ctx.drawImage(depthBackdrop(scene.layout, palette), 0, 0);
  const view = pianoView(scene, camera, t, flatZoom);
  animation.draw(ctx, scene, t, palette, view, pianoOf(scene));
}

export const pianoKind = {
  id: 'piano',
  name: 'Piano',
  description: 'A grand piano’s keys play the song.',
  animations: [falling],
  angles: PIANO_ANGLES,
  defaultAngle: 'player',
  turnRange: [-60, 60],
  tiltRange: [4, 85],
  zoomRange: [0.7, 3.6],
  flatZoomRange: [1, 4],
  render,
};
