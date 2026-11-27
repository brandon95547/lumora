// Fire: the music as fire. Fireball Run bounces a ball of flame from note to note; Two Hands gives
// each hand its own. Side-on in 2D, through space in 3D.
import { depthBackdrop } from '../backdrop.js';
import { runOf } from './path.js';
import { fireballRun, twoHands } from './run.js';
import { fireView } from './stage.js';

const FIRE_ANGLES = [
  { id: 'chase', label: 'Chase', turn: 62, tilt: 16, zoom: 1.15 },
  { id: 'side', label: 'Side', turn: 0, tilt: 8, zoom: 1 },
  { id: 'high', label: 'High', turn: 30, tilt: 42, zoom: 0.85 },
  { id: 'low', label: 'Low', turn: 24, tilt: -8, zoom: 1.05 },
];

function render(ctx, scene, t, animation, palette, camera) {
  ctx.drawImage(depthBackdrop(scene.layout, palette), 0, 0);
  const runs = animation.hands.map((hand) => runOf(scene, hand));
  animation.draw(ctx, scene, t, palette, fireView(scene, runs, camera, t), runs);
}

export const fireKind = {
  id: 'fire',
  name: 'Fire',
  description: 'The music as fire.',
  animations: [fireballRun, twoHands],
  angles: FIRE_ANGLES,
  defaultAngle: 'chase',
  turnRange: [-80, 80],
  tiltRange: [-15, 60],
  zoomRange: [0.6, 1.8],
  render,
};
