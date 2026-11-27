// Planets: the song plays the solar system. The right hand plays the rocky planets near the sun, the
// left hand the giants beyond the asteroid belt (see system.js).
import { cachedLayer, paintBackground } from '../backdrop.js';
import { noise } from '../envelope.js';
import { glowSprite, withAlpha } from '../sprites.js';
import { solarSystem } from './orrery.js';
import { PLANET_ANGLES, planetView } from './view.js';

const STARS = 420;
const TWINKLES = 40;

/** Deep space, painted once per format and palette: the palette's sky, a faint Milky Way and stars. */
function starfield(layout, palette) {
  const { width: w, height: h } = layout;
  return cachedLayer(`planets:${w}x${h}:${palette.id}`, layout, (ctx) => {
    paintBackground(ctx, layout, palette);
    for (let i = 0; i < 26; i++) {
      const k = i / 25;
      const size = Math.max(w, h) * (0.25 + 0.2 * noise(i, 3));
      ctx.globalAlpha = 0.025 + 0.035 * noise(i, 4);
      ctx.drawImage(
        glowSprite(palette.ink),
        w * (-0.1 + 1.2 * k) - size / 2,
        h * (0.85 - 0.7 * k) - size / 2,
        size,
        size,
      );
    }
    ctx.fillStyle = palette.ink;
    for (let i = 0; i < STARS; i++) {
      ctx.globalAlpha = 0.2 + 0.6 * noise(i, 7);
      const r = 0.6 + 1.6 * noise(i, 8) ** 3;
      ctx.beginPath();
      ctx.arc(noise(i, 5) * w, noise(i, 6) * h, r, 0, Math.PI * 2);
      ctx.fill();
    }
    const r = Math.hypot(w, h) / 2;
    const v = ctx.createRadialGradient(w / 2, h / 2, r * 0.45, w / 2, h / 2, r);
    v.addColorStop(0, 'rgba(0, 0, 0, 0)');
    v.addColorStop(1, palette.blend === 'lighter' ? 'rgba(0, 0, 0, 0.55)' : 'rgba(60, 40, 20, 0.18)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
  });
}

/** A few brighter stars that twinkle and shift a little as the camera turns. */
function drawTwinkles(ctx, layout, palette, t, yaw) {
  const { width: w, height: h } = layout;
  const shift = (yaw / (Math.PI * 2)) * w;
  ctx.globalCompositeOperation = palette.blend;
  for (let i = 0; i < TWINKLES; i++) {
    const x = (((noise(i, 11) * w * 1.4 - shift) % (w * 1.4)) + w * 1.4) % (w * 1.4);
    const size = 10 + 14 * noise(i, 13);
    ctx.globalAlpha = 0.25 + 0.35 * Math.sin(t * (1 + 2 * noise(i, 14)) + i) ** 2;
    ctx.drawImage(glowSprite(withAlpha(palette.ink, 0.9)), x - size / 2, noise(i, 12) * h - size / 2, size, size);
  }
  ctx.globalCompositeOperation = 'source-over';
}

function render(ctx, scene, t, animation, palette, camera, flatZoom) {
  const { layout } = scene;
  ctx.drawImage(starfield(layout, palette), 0, 0);
  drawTwinkles(ctx, layout, palette, t, camera ? (camera.turn * Math.PI) / 180 : 0);
  animation.draw(ctx, scene, t, palette, planetView(layout, camera, t, flatZoom));
}

export const planetsKind = {
  id: 'planets',
  name: 'Planets',
  description: 'The song plays the solar system.',
  animations: [solarSystem],
  angles: PLANET_ANGLES,
  defaultAngle: 'orbit',
  turnRange: [-180, 180],
  tiltRange: [4, 89],
  zoomRange: [0.6, 3],
  flatZoomRange: [1, 3],
  render,
};
