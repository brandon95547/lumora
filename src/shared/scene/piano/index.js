// Piano: the song played on a grand piano's keys, straight down from above (2D) or filmed from an
// angle (3D).
import { depthBackdrop } from '../backdrop.js';
import { falling } from './falling.js';
import { live } from './live.js';
import { pianoOf, pianoView } from './model.js';

/** Ready-made camera angles around the keyboard. */
const PIANO_ANGLES = [
  { id: 'player', label: 'Player', turn: 0, tilt: 40, zoom: 1 },
  { id: 'side', label: 'Side', turn: 28, tilt: 30, zoom: 0.86 },
  { id: 'low', label: 'Low', turn: 16, tilt: 14, zoom: 0.95 },
  { id: 'overhead', label: 'Overhead', turn: 0, tilt: 68, zoom: 1 },
];

function render(ctx, scene, t, animation, palette, camera) {
  ctx.drawImage(depthBackdrop(scene.layout, palette), 0, 0);
  const view = pianoView(scene, camera, t, animation.falling);
  animation.draw(ctx, scene, t, palette, view, pianoOf(scene));
}

export const pianoKind = {
  id: 'piano',
  name: 'Piano',
  description: 'A grand piano’s keys play the song.',
  animations: [live, falling],
  angles: PIANO_ANGLES,
  defaultAngle: 'side',
  turnRange: [-60, 60],
  tiltRange: [8, 85],
  render,
};
