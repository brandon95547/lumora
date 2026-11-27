// Fireball Run: a ball of fire bounces from ledge to ledge, landing on every note. Each landing
// throws up a pillar of flame and sparks and leaves the ledge glowing; the fire grows with the
// music and burns hottest at the end.
import { energyAt } from './energy.js';
import { drawAirEmbers, drawBall, drawBurst, drawEmbersOn, drawTrail, fireRamp } from './flames.js';
import { ballAt, landingBefore } from './path.js';
import { BALL, drawHeat, drawLedge, warmthOf } from './stage.js';

const AHEAD = 6; // seconds of ledges shown before the ball gets there
const BEHIND = 5; // and after

export const fireballRun = {
  id: 'fire-run',
  name: 'Fireball Run',
  description: 'A fireball bounces on every note, and burns brighter as the song builds.',
  draw(ctx, scene, t, palette, view, run) {
    const { layout } = scene;
    const ramp = fireRamp(palette);
    const heat = energyAt(scene, t);
    drawHeat(ctx, layout, heat, ramp);

    // Ledges near in time, far ones first so nearer ones cover them.
    const now = landingBefore(run, t);
    const near = run.landings.filter((l) => l.time > t - BEHIND && l.time < t + AHEAD);
    const depth = (l) => (view.depthOf ? view.depthOf(l.x, l.y, l.z) : 0);
    near.sort((a, b) => depth(b) - depth(a));
    for (const l of near) {
      const ahead = l.time - t;
      const alpha = ahead > 0 ? Math.min(1, (AHEAD - ahead) / 1.5) : Math.min(1, (BEHIND + ahead) / 1.5);
      drawLedge(ctx, view, l, warmthOf(l, t), alpha, ramp);
    }

    // Everything on fire adds light.
    ctx.globalCompositeOperation = 'lighter';
    for (const l of near) {
      const warmth = warmthOf(l, t);
      if (warmth > 0.05)
        drawEmbersOn(ctx, view, [l.x, l.y + BALL, l.z], l.size, warmth, energyAt(scene, l.time), t, l.index, ramp);
    }
    for (let i = now; i >= 0 && t - run.landings[i].time < 1.6; i--) {
      const l = run.landings[i];
      drawBurst(ctx, view, [l.x, l.y + BALL * 0.5, l.z], t - l.time, l.force, energyAt(scene, l.time), l.index, ramp);
    }
    const radius = BALL * (0.75 + 0.6 * heat);
    drawTrail(ctx, view, (time) => ballAt(run, time), t, heat, radius, ramp);
    drawBall(ctx, view, ballAt(run, t), t, heat, radius, ramp);
    drawAirEmbers(ctx, layout, t, heat, ramp);
    ctx.globalCompositeOperation = 'source-over';
  },
};
