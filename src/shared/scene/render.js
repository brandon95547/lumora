// Draws one frame at time t: the animation's own kind of scene (staff, piano), then the title and
// progress line every video has. Pure: the same inputs always give the same picture.
import { CLEAN_FONT, titleCss } from './titles.js';

/** The title across the top, in its face and size (`font` and `scale`, see titles.js). */
function drawTitle(ctx, layout, palette, title, font, scale) {
  if (!title) return;
  const px = layout.titleSize * scale;
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = palette.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = titleCss(font, px);
  ctx.fillText(title, layout.width / 2, layout.titleTop + px * 0.6, layout.width - layout.marginX * 2);
}

function drawProgress(ctx, layout, palette, t, duration) {
  if (!duration) return;
  const y = layout.height - (layout.portrait ? 170 : 70);
  const x0 = layout.marginX + layout.space;
  const w = layout.width - 2 * x0;
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = palette.staff;
  ctx.fillRect(x0, y, w, 4);
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = palette.lit[0];
  ctx.fillRect(x0, y, w * Math.min(1, Math.max(0, t / duration)), 4);
}

/** `animation` carries its kind; `camera` is null for 2D; `titleFont` must already be loaded. */
export function renderFrame(
  ctx,
  scene,
  { t, animation, palette, title, titleFont = CLEAN_FONT, titleScale = 1, camera },
) {
  const { layout } = scene;
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  animation.kind.render(ctx, scene, t, animation, palette, camera);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  drawTitle(ctx, layout, palette, title, titleFont, titleScale);
  drawProgress(ctx, layout, palette, t, scene.duration);
  ctx.restore();
}
