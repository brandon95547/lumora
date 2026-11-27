// Marble Walk: the staff lies on a marble floor and runs on ahead. A glass ball for each hand hops
// along it from note to note, landing on every note as it sounds, while the floor, the staff and
// the notes travel past underneath, as if the balls were walking across the floor. Ghosts fly across
// the stage, and now and then the floor heats up under a faint mist (haunt.js). As the song builds
// the balls catch fire, and big chords send a beam of light up through them (blaze.js).
import { burst, held } from '../envelope.js';
import { litColor } from '../palettes.js';
import { glowSprite, sphereSprite } from '../sprites.js';
import { onPlane } from '../view.js';
import { ballPlace, beamAt, beamsOf, drawBallFire, drawBeam, fireAt } from './blaze.js';
import { ballAt, bouncePath } from './bounce.js';
import { drawAccidental, drawGlow, drawLedgers, drawRing, drawSpot, scrollPlacement } from './common.js';
import { FLOOR_RIG } from './floor.js';
import { drawGhosts, drawHeat, drawMist, heatAt } from './haunt.js';

const HANDS = ['left', 'right'];

function ballsAt(scene, t) {
  return HANDS.map((hand) => {
    const ball = ballAt(bouncePath(scene, hand), t, scene.layout);
    return ball && { ...ball, hand };
  }).filter(Boolean);
}

/** The ball, its glow, and a short trail of where it just was. Off the floor, so it shows in the polish. */
function drawBall(ctx, scene, t, palette, view, ball) {
  const { layout } = scene;
  const r = layout.radius * 1.35;
  const x = layout.playheadX;
  const color = litColor(palette, ball.note);
  const point = (y, height) => {
    if (view.depth) return view.project(x, y, -(height + r));
    // From straight above, a hop shows as the ball rising toward the eye: larger, and off its shadow.
    const p = view.project(x, y - height * 0.45);
    return { ...p, s: 1 + height / (layout.space * 14) };
  };
  ctx.globalCompositeOperation = palette.blend;
  for (let k = 5; k >= 1; k--) {
    const past = ballAt(bouncePath(scene, ball.hand), t - k * 0.025, layout);
    const p = past && point(past.y, past.height);
    if (!p) continue;
    const size = r * 3 * p.s * (1 - k / 7);
    ctx.globalAlpha = 0.16 * (1 - k / 6) * p.fog * view.opacity;
    ctx.drawImage(glowSprite(color), p.x - size / 2, p.y - size / 2, size, size);
  }
  drawBallFire(ctx, view, ballPlace(scene, ball.hand, t), t, fireAt(scene, t), r, color, palette);
  const p = point(ball.y, ball.height);
  if (!p) return;
  const a = p.fog * view.opacity;
  const glow = r * 5 * p.s;
  ctx.globalAlpha = 0.5 * a;
  ctx.drawImage(glowSprite(color), p.x - glow / 2, p.y - glow / 2, glow, glow);
  ctx.globalCompositeOperation = 'source-over';
  const size = 2 * r * p.s;
  ctx.globalAlpha = a;
  ctx.drawImage(sphereSprite(color), p.x - size / 2, p.y - size / 2, size, size);
  const beam = beamAt(beamsOf(scene, ball.hand), t);
  drawBeam(ctx, view, layout, palette, [x, ball.y, -(ball.height + r * 1.8)], r, color, beam);
}

/** The ball's shadow on the floor: tight and dark on landing, wide and faint at the top of a hop. */
function drawShadow(ctx, scene, view, ball) {
  const { layout } = scene;
  const x = layout.playheadX;
  const lift = Math.min(1, ball.height / (layout.space * 6));
  const r = layout.radius * (1.3 + lift);
  const p = view.project(x, ball.y);
  if (!p) return;
  ctx.save();
  if (onPlane(ctx, view, x, ball.y)) {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.globalAlpha = (0.85 - 0.6 * lift) * p.fog * view.opacity;
    ctx.fillStyle = g;
    ctx.fillRect(-r, -r, 2 * r, 2 * r);
  }
  ctx.restore();
}

export const marbleWalk = {
  id: 'marble-walk',
  name: 'Marble Walk',
  description: 'A ball for each hand hops along a marble floor; ghosts drift by as it heats up.',
  motion: 'scroll',
  stage: 'floor',
  rig: FLOOR_RIG,
  draw(ctx, scene, t, palette, view) {
    const { layout } = scene;
    const r = layout.radius;
    const heat = heatAt(scene, t);
    drawHeat(ctx, view, layout, palette, heat);
    const { notes } = scrollPlacement(scene, t, view);
    for (const { note, x, alpha } of notes) {
      if (alpha <= 0) continue;
      const color = litColor(palette, note);
      const played = t >= note.start;
      const ink = played ? color : palette.idle;
      drawLedgers(ctx, view, layout, note, x, palette.staff, alpha);
      drawAccidental(ctx, view, layout, note, x, ink, alpha * (played ? 0.9 : 0.7));
      if (!played) {
        drawRing(ctx, view, x, note.y, r * 0.86, r * 0.22, palette.idle, alpha);
        continue;
      }
      const b = burst(note, t);
      const on = held(note, t);
      drawGlow(ctx, view, palette, x, note.y, r * (3.5 + 5 * b), color, alpha * (0.3 + 0.7 * Math.max(b, on * 0.45)));
      drawSpot(ctx, view, x, note.y, r * (0.9 + 0.3 * b), color, alpha * (0.5 + 0.5 * Math.max(on, b)));
    }
    drawMist(ctx, view, layout, t, heat);
    const balls = ballsAt(scene, t);
    for (const ball of balls) drawShadow(ctx, scene, view, ball);
    // The nearer ball last, so it passes in front.
    const depth = (ball) => (view.depth ? view.depthOf(layout.playheadX, ball.y, -ball.height) : 0);
    for (const ball of balls.sort((a, b) => depth(b) - depth(a))) drawBall(ctx, scene, t, palette, view, ball);
    drawGhosts(ctx, view, layout, palette, scene, t);
  },
  /** Only what is off the floor (the balls and ghosts), for its reflection. */
  drawRaised(ctx, scene, t, palette, view) {
    for (const ball of ballsAt(scene, t)) drawBall(ctx, scene, t, palette, view, ball);
    drawGhosts(ctx, view, scene.layout, palette, scene, t);
  },
};
