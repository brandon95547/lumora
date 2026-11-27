// Staff: the song lights up a grand staff, flat or seen in 3D on a reflective floor.
import { drawAmbient } from '../ambient.js';
import { mirrored } from '../view.js';
import { constellation } from './constellation.js';
import { glowLane } from './glowLane.js';
import { ribbon } from './ribbon.js';
import { ripple } from './ripple.js';
import { depthBackdrop } from '../backdrop.js';
import { drawFloor, drawHorizon, drawStaff, flatBackdrop } from './stage.js';
import { cameraView, flatView, STAFF_ANGLES } from './view.js';

function render(ctx, scene, t, animation, palette, camera) {
  const { layout } = scene;
  const centerY = (layout.grandTop + layout.grandBottom) / 2;
  if (!camera) {
    ctx.drawImage(flatBackdrop(layout, palette, animation.motion), 0, 0);
    drawAmbient(ctx, scene, t, palette, layout.width / 2, centerY);
    animation.draw(ctx, scene, t, palette, flatView(layout, animation.motion));
    return;
  }
  // 3D: the floor, the reflection of everything above it, then the staff and notes.
  const view = cameraView(layout, camera, t, animation.motion);
  const floorY = layout.grandBottom + layout.space * 2;
  ctx.drawImage(depthBackdrop(layout, palette), 0, 0);
  drawHorizon(ctx, view, layout, palette, floorY);
  drawAmbient(ctx, scene, t, palette, layout.width / 2, centerY);
  if (view.eye[1] < floorY) {
    drawFloor(ctx, view, layout, palette, floorY, t, animation.motion);
    const reflection = mirrored(view, 'y', floorY, palette.blend === 'lighter' ? 0.24 : 0.14);
    drawStaff(ctx, reflection, layout, palette);
    animation.draw(ctx, scene, t, palette, reflection);
  }
  drawStaff(ctx, view, layout, palette);
  animation.draw(ctx, scene, t, palette, view);
}

export const staffKind = {
  id: 'staff',
  name: 'Staff',
  description: 'Notes light up on a grand staff.',
  animations: [glowLane, ripple, constellation, ribbon],
  angles: STAFF_ANGLES,
  defaultAngle: 'angled',
  turnRange: [-70, 70],
  tiltRange: [-10, 35],
  render,
};
