// Deep space around the keyboard: a dark sky, clouds of nebula in the palette's colors and stars,
// painted once per format and palette (the spiral galaxy is in the scene itself, spiral.js); then a few brighter stars that twinkle
// and drift a little as the camera turns.
import { cachedLayer } from '../backdrop.js';
import { noise } from '../envelope.js';
import { glowSprite, mixColors } from '../sprites.js';

const STARS = 650;
const TWINKLES = 36;

function paintSky(ctx, layout, palette) {
  const { width: w, height: h } = layout;
  const sky = ctx.createLinearGradient(0, 0, w * 0.3, h);
  sky.addColorStop(0, '#070414');
  sky.addColorStop(0.55, '#03020a');
  sky.addColorStop(1, '#000000');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Nebula: soft clouds along a band across the sky, in the palette's colors and deep space blues.
  const tints = [...palette.lit, '#3b2a8f', '#1d3d8f', '#7a2a6a'].map((c) => mixColors(c, '#000000', 0.35));
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 40; i++) {
    const k = noise(i, 1);
    const size = Math.max(w, h) * (0.18 + 0.32 * noise(i, 2));
    const x = w * (-0.1 + 1.2 * k);
    const y = h * (0.75 - 0.6 * k) + (noise(i, 3) - 0.5) * h * 0.3;
    ctx.globalAlpha = 0.06 + 0.1 * noise(i, 4);
    ctx.drawImage(glowSprite(tints[i % tints.length]), x - size / 2, y - size / 2, size, size);
  }

  // Stars, a few of them large.
  ctx.globalCompositeOperation = 'source-over';
  for (let i = 0; i < STARS; i++) {
    const big = noise(i, 23) ** 4;
    ctx.globalAlpha = 0.25 + 0.65 * noise(i, 22);
    ctx.fillStyle = noise(i, 24) < 0.2 ? '#ffe6c8' : '#e6ecff';
    ctx.beginPath();
    ctx.arc(noise(i, 20) * w, noise(i, 21) * h, 0.6 + 2 * big, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** The sky, then its twinkling stars, shifted a little by the camera's turn (degrees). */
export function drawSpace(ctx, layout, palette, t, turn) {
  ctx.drawImage(
    cachedLayer(`space:${layout.width}x${layout.height}:${palette.id}`, layout, (c) => paintSky(c, layout, palette)),
    0,
    0,
  );
  const { width: w, height: h } = layout;
  const span = w * 1.4;
  const shift = (turn / 360) * span;
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < TWINKLES; i++) {
    const x = (((noise(i, 31) * span - shift) % span) + span) % span;
    const size = 12 + 16 * noise(i, 33);
    ctx.globalAlpha = 0.2 + 0.4 * Math.sin(t * (0.8 + 2 * noise(i, 34)) + i) ** 2;
    ctx.drawImage(glowSprite('#e6ecff'), x - size / 2, noise(i, 32) * h - size / 2, size, size);
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}
