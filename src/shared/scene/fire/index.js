// Fire: the music as fire. Fireball Run bounces a ball of flame from note to note, side-on in 2D or
// through space in 3D.
import { depthBackdrop } from '../backdrop.js';
import { runOf } from './path.js';
import { fireballRun } from './run.js';
import { fireView } from './stage.js';

const FIRE_ANGLES = [
  { id: 'chase', label: 'Chase', turn: 62, tilt: 16, zoom: 1.15 },
  { id: 'side', label: 'Side', turn: 0, tilt: 8, zoom: 1 },
  { id: 'high', label: 'High', turn: 30, tilt: 42, zoom: 0.85 },
  { id: 'low', label: 'Low', turn: 24, tilt: -8, zoom: 1.05 },
];

function render(ctx, scene, t, animation, palette, camera) {
  ctx.drawImage(depthBackdrop(scene.layout, palette), 0, 0);
  const run = runOf(scene);
  animation.draw(ctx, scene, t, palette, fireView(scene, run, camera, t), run);
}

export const fireKind = {
  id: 'fire',
  name: 'Fire',
  description: 'The music as fire.',
  animations: [fireballRun],
  angles: FIRE_ANGLES,
  defaultAngle: 'chase',
  turnRange: [-80, 80],
  tiltRange: [-15, 60],
  zoomRange: [0.6, 1.8],
  render,
};
