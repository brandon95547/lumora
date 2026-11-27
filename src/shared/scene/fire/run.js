// The fire animations. Fireball Run: one ball of fire lands on every note. Two Hands: the right
// hand's fireball burns teal-blue and the left hand's in the palette's fire, each in its own lane.
// Every landing throws up a pillar of flame and sparks and leaves its ledge glowing; the fire grows
// with the music and burns hottest at the end.
import { energyAt } from '../energy.js';
import { drawAirEmbers, drawBall, drawBurst, drawEmbersOn, drawTrail, fireRamp, TEAL_FIRE } from '../flames.js';
import { ballAt, landingBefore } from './path.js';
import { BALL, drawHeat, drawLedge, warmthOf } from './stage.js';

const AHEAD = 6; // seconds of ledges shown before a ball gets there
const BEHIND = 5; // and after

/**
 * Draws the fire for a list of fireballs, each { run, ramp, scale }: its path, its colors and how
 * big it burns.
 */
function drawFire(ctx, scene, t, view, balls) {
  const { layout } = scene;
  const heat = energyAt(scene, t);
  drawHeat(ctx, layout, heat, balls[balls.length - 1].ramp);

  // Ledges near in time, far ones first so nearer ones cover them.
  const ledges = balls.flatMap((ball) =>
    ball.run.landings.filter((l) => l.time > t - BEHIND && l.time < t + AHEAD).map((l) => ({ l, ball })),
  );
  const depth = ({ l }) => (view.depthOf ? view.depthOf(l.x, l.y, l.z) : 0);
  ledges.sort((a, b) => depth(b) - depth(a));
  for (const { l, ball } of ledges) {
    const ahead = l.time - t;
    const alpha = ahead > 0 ? Math.min(1, (AHEAD - ahead) / 1.5) : Math.min(1, (BEHIND + ahead) / 1.5);
    drawLedge(ctx, view, l, warmthOf(l, t), alpha, ball.ramp);
  }

  // Everything on fire adds light.
  ctx.globalCompositeOperation = 'lighter';
  for (const { l, ball } of ledges) {
    const warmth = warmthOf(l, t);
    if (warmth > 0.05)
      drawEmbersOn(ctx, view, [l.x, l.y + BALL, l.z], l.size, warmth, energyAt(scene, l.time), t, l.index, ball.ramp);
  }
  for (const { run, ramp, scale } of balls) {
    for (let i = landingBefore(run, t); i >= 0 && t - run.landings[i].time < 1.6; i--) {
      const l = run.landings[i];
      drawBurst(
        ctx,
        view,
        [l.x, l.y + BALL * 0.5, l.z],
        t - l.time,
        l.force * scale,
        energyAt(scene, l.time),
        l.index,
        ramp,
      );
    }
    const point = ballAt(run, t);
    if (!point) continue;
    const radius = BALL * (0.75 + 0.6 * heat) * scale;
    drawTrail(ctx, view, (time) => ballAt(run, time), t, heat, radius, ramp);
    drawBall(ctx, view, point, t, heat, radius, ramp);
  }
  balls.forEach((ball, i) => drawAirEmbers(ctx, layout, t + i * 37, heat / balls.length, ball.ramp));
  ctx.globalCompositeOperation = 'source-over';
}

export const fireballRun = {
  id: 'fire-run',
  name: 'Fireball Run',
  description: 'A fireball bounces on every note, and burns brighter as the song builds.',
  hands: ['both'],
  draw(ctx, scene, t, palette, view, runs) {
    drawFire(ctx, scene, t, view, [{ run: runs[0], ramp: fireRamp(palette), scale: 1 }]);
  },
};

export const twoHands = {
  id: 'fire-hands',
  name: 'Two Hands',
  description: 'A teal fireball for the right hand, the palette’s fire for the left, each in its lane.',
  hands: ['right', 'left'],
  draw(ctx, scene, t, palette, view, runs) {
    drawFire(ctx, scene, t, view, [
      { run: runs[0], ramp: TEAL_FIRE, scale: 1 },
      { run: runs[1], ramp: fireRamp(palette), scale: 0.85 },
    ]);
  },
};
