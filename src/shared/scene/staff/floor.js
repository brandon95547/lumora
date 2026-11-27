// The staff laid on a polished marble floor, running on ahead like a road. The floor's tiles travel
// with the music, so the ground, the staff and the notes all move together under the camera.
// The staff keeps its own coordinates (x along the staff, y across it, z toward the viewer, which
// here is up off the floor); the floor view turns them onto the ground, so every staff helper
// draws on the floor unchanged.
import { depthBackdrop, paintBackground } from '../backdrop.js';
import { drawAmbient } from '../ambient.js';
import { noise } from '../envelope.js';
import { mixColors } from '../sprites.js';
import { aim, fillPolygon, mirrored, perspective, strokeWorld } from '../view.js';
import { drawHorizon, drawStaff } from './stage.js';
import { flatView } from './view.js';

/** Ready-made angles on the floor. Turn 90 looks straight down the staff, 0 across it. */
export const FLOOR_RIG = {
  id: 'staff-floor',
  angles: [
    { id: 'walk', label: 'Walk', turn: 74, tilt: 22, zoom: 1 },
    { id: 'behind', label: 'Behind', turn: 90, tilt: 30, zoom: 0.9 },
    { id: 'beside', label: 'Beside', turn: 30, tilt: 26, zoom: 0.85 },
    { id: 'overhead', label: 'Overhead', turn: 60, tilt: 58, zoom: 0.8 },
  ],
  defaultAngle: 'walk',
  turnRange: [-90, 90],
  tiltRange: [6, 70],
  zoomRange: [0.6, 1.6],
};

const AHEAD = 14; // seconds of staff ahead of the playhead
const BEHIND = 3;

/** The floor's staff: from where the song begins (its clefs pass by as it starts) or from just behind the camera. */
function bounds(layout, t) {
  const pps = layout.pixelsPerSecond;
  const start = layout.playheadX - t * pps - layout.space * 7;
  const behind = layout.playheadX - pps * BEHIND;
  return {
    staffLeft: Math.max(start, behind),
    clefs: start >= behind,
    noteLeft: layout.playheadX - pps * (BEHIND - 0.3), // played notes stay lit as they pass under the camera
    noteRight: layout.playheadX + pps * AHEAD,
  };
}

const fadeOf = (b, space) => (x) =>
  Math.max(0, Math.min(1, (x - b.noteLeft) / (space * 2.5), (b.noteRight - x) / (space * 12)));

/** A camera over the floor. The staff's middle line runs along the floor through the playhead. */
export function floorView(layout, camera, t) {
  const b = bounds(layout, t);
  const middle = (layout.grandTop + layout.grandBottom) / 2;
  const toFloor = (x, y, z = 0) => [x, z, y - middle];
  const { yaw, pitch } = aim(camera, t);
  const base = perspective({
    pivot: [layout.playheadX + layout.pixelsPerSecond * 0.6, 0, 0],
    anchor: [layout.width / 2, layout.height * (layout.portrait ? 0.6 : 0.58)],
    distance: 0.78 * Math.max(layout.width, layout.height * 0.7),
    zoom: camera.zoom,
    yaw,
    pitch,
    fogFrom: 1.2,
    fogTo: 3.6,
  });
  const [ex, ey, ez] = base.eye;
  return {
    ...base,
    ...b,
    project: (x, y, z) => base.project(...toFloor(x, y, z)),
    depthOf: (x, y, z) => base.depthOf(...toFloor(x, y, z)),
    eye: [ex, ez + middle, ey],
    rise: (x, y, h) => [x, y, -h], // straight up off the floor
    fade: fadeOf(b, layout.space),
  };
}

/** The 2D floor: looked at from straight above, the staff where the flat staff is. */
export function floorFlatView(layout) {
  const view = flatView(layout, 'scroll');
  return { ...view, fade: fadeOf(view, layout.space) };
}

/** The marble's colors for a palette: dark stone tinted by its sky, and pale veins. */
function marbleOf(palette) {
  const deep = palette.background[1];
  const dark = palette.blend === 'lighter';
  return {
    stone: mixColors(deep, dark ? '#1b1d24' : '#d9d6cf', 0.55),
    light: mixColors(deep, dark ? '#3a3d48' : '#f4f2ec', 0.55),
    vein: dark ? 'rgba(220, 225, 240, 1)' : 'rgba(90, 85, 80, 1)',
  };
}

/**
 * Marble tiles, each with its own shade and veins, fixed to the music: a tile is where the song was
 * at some moment, so it slides toward the camera as the song plays.
 */
function drawMarble(ctx, view, layout, palette, t, { from, to, across }) {
  const { space } = layout;
  const tile = space * 7;
  const gap = tile * 0.012;
  const travel = t * layout.pixelsPerSecond;
  const marble = marbleOf(palette);
  const middle = (layout.grandTop + layout.grandBottom) / 2;
  const [rowFrom, rowTo] = [Math.floor((middle - across) / tile), Math.ceil((middle + across) / tile)];
  for (let k = Math.ceil((to + travel) / tile); k >= Math.floor((from + travel) / tile); k--) {
    const x0 = k * tile - travel;
    for (let j = rowFrom; j < rowTo; j++) {
      const y0 = j * tile;
      const seed = k * 92.7 + j * 13.1;
      const shade = mixColors(marble.stone, marble.light, noise(seed, 1) * 0.6);
      fillPolygon(
        ctx,
        view,
        [
          [x0 + gap, y0 + gap, 0],
          [x0 + tile - gap, y0 + gap, 0],
          [x0 + tile - gap, y0 + tile - gap, 0],
          [x0 + gap, y0 + tile - gap, 0],
        ],
        shade,
      );
      // Two veins wandering across the tile.
      for (let v = 0; v < 2; v++) {
        let px = x0 + tile * noise(seed, 2 + v);
        let py = y0;
        const lean = (noise(seed, 4 + v) - 0.5) * tile * 0.5;
        for (let s = 1; s <= 4; s++) {
          const nx = Math.min(
            x0 + tile,
            Math.max(x0, px + lean / 4 + (noise(seed, 6 + s + v * 4) - 0.5) * tile * 0.22),
          );
          const ny = y0 + (tile * s) / 4;
          strokeWorld(
            ctx,
            view,
            [px, py, 0],
            [nx, ny, 0],
            space * 0.05,
            marble.vein,
            0.1 + 0.12 * noise(seed, 9 + v),
            1,
          );
          [px, py] = [nx, ny];
        }
      }
    }
  }
}

/** Marble Walk's scene: the floor, the reflections in its polish, the staff on it, then the animation. */
export function renderFloor(ctx, scene, t, animation, palette, camera) {
  const { layout } = scene;
  const centerY = (layout.grandTop + layout.grandBottom) / 2;
  if (!camera) {
    const view = floorFlatView(layout);
    paintBackground(ctx, layout, palette);
    drawMarble(ctx, view, layout, palette, t, { from: 0, to: layout.width, across: layout.height });
    drawAmbient(ctx, scene, t, palette, layout.width / 2, centerY);
    drawStaff(ctx, view, layout, palette);
    animation.draw(ctx, scene, t, palette, view);
    return;
  }
  const view = floorView(layout, camera, t);
  ctx.drawImage(depthBackdrop(layout, palette), 0, 0);
  drawHorizon(ctx, layout, palette, view.project(layout.playheadX + layout.pixelsPerSecond * 40, centerY));
  drawMarble(ctx, view, layout, palette, t, {
    from: view.staffLeft - layout.space * 20,
    to: view.noteRight + layout.space * 10,
    across: layout.width * 1.6,
  });
  // The polish: what rises off the floor shows in it, faintly, upside down.
  ctx.globalCompositeOperation = palette.blend;
  animation.drawRaised(ctx, scene, t, palette, mirrored(view, 'z', 0, palette.blend === 'lighter' ? 0.3 : 0.16));
  ctx.globalCompositeOperation = 'source-over';
  drawAmbient(ctx, scene, t, palette, layout.width / 2, centerY);
  drawStaff(ctx, view, layout, palette);
  animation.draw(ctx, scene, t, palette, view);
}
