// Piano: the song played on a grand piano's keys, straight down from above (2D) or filmed from an
// angle (3D).
import { depthBackdrop } from '../backdrop.js';
import { falling } from './falling.js';
import { live } from './live.js';
import { pianoOf, pianoView } from './model.js';

/** Ready-made camera angles around the keyboard. */
// Distance: 1 frames the whole instrument across; higher comes in close on the keys.
const PIANO_ANGLES = [
  { id: 'concert', label: 'Concert', turn: -36, tilt: 14, zoom: 0.56 },
  { id: 'side', label: 'Side', turn: -30, tilt: 34, zoom: 1.5 },
  { id: 'player', label: 'Player', turn: 0, tilt: 38, zoom: 2.4 },
  { id: 'overhead', label: 'Overhead', turn: 0, tilt: 72, zoom: 1.9 },
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
  defaultAngle: 'concert',
  turnRange: [-60, 60],
  tiltRange: [4, 85],
  zoomRange: [0.7, 3.6],
  render,
};
