// Gothic: two fires race down a moonlit cathedral nave, the right hand's teal soulfire down the
// right aisle and the left hand's crimson hellfire down the left, each placed across its aisle by
// pitch. They light the stone around them, candles kindle as they pass, the rose window burns
// brighter with the music, and the mightiest landings call down lightning and scatter bats.
import { BALL } from './stage.js';
import { candleItems, drawCandleFlames, drawNaveFloor, drawRoseWindow, naveItems, pedestalItems } from './cathedral.js';
import { energyAt } from '../energy.js';
import { CRIMSON_FIRE, drawBall, drawBurst, drawEmbersOn, drawTrail, TEAL_FIRE } from './flames.js';
import { drawAsh, drawBats, drawLightning, drawMist, lightningAt, strikes } from './omens.js';
import { ballAt, followAt, landingBefore } from './path.js';
import { warmthOf } from './stage.js';

const AHEAD = 8; // seconds of pedestals shown before a ball gets there
const BEHIND = 4;

function roseWindowPlace(layout, view, pivot) {
  if (!view.depth || view.flat)
    return { center: [layout.width * 0.8, layout.height * 0.24], radius: layout.width * 0.08 };
  const far = view.project(pivot[0] + 140, -16, 0);
  if (!far) return null;
  return { center: [far.x, far.y], radius: Math.min(layout.width, layout.height) * 0.1 };
}

export const gothic = {
  id: 'fire-gothic',
  name: 'Gothic',
  description: 'Teal and crimson fire race down a moonlit cathedral, each hand on its own side.',
  hands: ['right', 'left'],
  layout: 'nave',
  defaultAngle: 'nave',
  draw(ctx, scene, t, palette, view, runs) {
    const { layout } = scene;
    const heat = energyAt(scene, t);
    const balls = [
      { run: runs[0], ramp: TEAL_FIRE, rgb: [70, 220, 235] },
      { run: runs[1], ramp: CRIMSON_FIRE, rgb: [255, 70, 45] },
    ];
    const pivot = followAt(runs, t);
    const from = pivot[0] - 40;
    const to = pivot[0] + 120;
    const struck = strikes(scene, runs);
    const flash = lightningAt(struck, t);

    // The rose window, far away behind everything.
    const rose = roseWindowPlace(layout, view, pivot);
    if (rose) drawRoseWindow(ctx, rose.center, rose.radius, Math.min(1, 0.25 + 0.75 * heat + flash));

    // The fire is the light. Lightning lights everything cold blue for a moment.
    const lights = balls
      .map((b) => ({ pos: ballAt(b.run, t), rgb: b.rgb, strength: 0.7 + 1.1 * heat }))
      .filter((l) => l.pos);
    if (flash > 0.02) lights.push({ pos: [pivot[0], -60, pivot[2]], rgb: [150, 170, 255], strength: 4 * flash });
    const lead = Math.max(...lights.map((l) => l.pos[0]), from);

    drawNaveFloor(ctx, view, from, to, lights);

    // Stone, far to near.
    const pedestals = balls.flatMap((ball) =>
      ball.run.landings
        .filter((l) => l.time > t - BEHIND && l.time < t + AHEAD)
        .map((l) => ({ l, ball, warmth: warmthOf(l, t) })),
    );
    const items = [...naveItems(ctx, view, from, to, lights), ...candleItems(ctx, view, from, to, lights)];
    for (const { l, ball, warmth } of pedestals) {
      const ahead = l.time - t;
      const alpha = ahead > 0 ? Math.min(1, (AHEAD - ahead) / 2) : Math.min(1, (BEHIND + ahead) / 1.5);
      items.push(...pedestalItems(ctx, view, l, warmth, alpha, ball.ramp, lights));
    }
    items.sort((a, b) => b.depth - a.depth);
    for (const item of items) item.draw();
    drawMist(ctx, layout, t);

    // Fire adds light.
    ctx.globalCompositeOperation = 'lighter';
    drawCandleFlames(ctx, view, from, to, lead, t);
    for (const { l, ball, warmth } of pedestals) {
      if (warmth > 0.05)
        drawEmbersOn(ctx, view, [l.x, l.y + BALL, l.z], l.size, warmth, energyAt(scene, l.time), t, l.index, ball.ramp);
    }
    for (const { run, ramp } of balls) {
      for (let i = landingBefore(run, t); i >= 0 && t - run.landings[i].time < 1.6; i--) {
        const l = run.landings[i];
        drawBurst(ctx, view, [l.x, l.y + BALL * 0.5, l.z], t - l.time, l.force, energyAt(scene, l.time), l.index, ramp);
      }
      const point = ballAt(run, t);
      if (!point) continue;
      const radius = BALL * (0.75 + 0.6 * heat);
      drawTrail(ctx, view, (time) => ballAt(run, time), t, heat, radius, ramp);
      drawBall(ctx, view, point, t, heat, radius, ramp);
    }
    ctx.globalCompositeOperation = 'source-over';

    drawBats(ctx, view, struck, t);
    drawLightning(ctx, layout, struck, t);
    drawAsh(ctx, layout, t, heat);
    ctx.globalAlpha = 1;
  },
};
