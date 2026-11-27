// Live: a grand piano as if filmed in concert — lid up, keys going down under the music, a hint of
// colored light on each one played, and soft stage lights out of focus behind.
import { drawAmbient } from '../ambient.js';
import { noise } from '../envelope.js';
import { glowSprite } from '../sprites.js';
import { CASE, drawGrand } from './grand.js';
import { drawInstrument } from './instrument.js';
import { keysDown } from './model.js';

const LIGHTS = 14;

/** Out-of-focus stage lights drifting slowly in the dark behind the piano. */
function drawBokeh(ctx, layout, palette, t) {
  ctx.globalCompositeOperation = palette.blend;
  for (let i = 0; i < LIGHTS; i++) {
    const x = layout.width * (noise(i, 1) + 0.04 * Math.sin(t * 0.07 + i));
    const y = layout.height * (0.08 + 0.42 * noise(i, 2)) + 18 * Math.sin(t * 0.05 + i * 2);
    const size = layout.width * (0.08 + 0.16 * noise(i, 3));
    const twinkle = 0.75 + 0.25 * Math.sin(t * (0.3 + noise(i, 4)) + i);
    ctx.globalAlpha = (palette.blend === 'lighter' ? 0.16 : 0.08) * twinkle;
    ctx.drawImage(glowSprite(palette.lit[i % palette.lit.length]), x - size / 2, y - size / 2, size, size);
  }
  ctx.globalCompositeOperation = 'source-over';
}

export const live = {
  id: 'piano-live',
  name: 'Live',
  description: 'A grand piano playing itself, as if filmed in concert.',
  falling: false,
  draw(ctx, scene, t, palette, view, model) {
    const { layout } = scene;
    drawBokeh(ctx, layout, palette, t);
    drawAmbient(ctx, scene, t, palette, layout.width / 2, layout.height * 0.55);
    const down = keysDown(scene, t);
    drawGrand(ctx, view, palette, () =>
      drawInstrument(ctx, view, model, down, palette, {
        fallboard: true,
        fallboardTop: CASE.rimTop,
        tint: 0.22,
        light: 0.55,
      }),
    );
  },
};
