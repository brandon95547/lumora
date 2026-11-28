// Solar System: the song moves the planets. Each note's star in the sky (stars.js) fires a mote of
// light that strikes its planet as the note sounds and glances off; the planet steps along its orbit,
// flares in its hand's color and sends a ripple out across the orbit plane, and while the note is
// held the planet paints its path. Chords line the struck planets up
// with the sun, both hands together set the asteroid belt sparkling, fast right-hand runs bring a
// comet through, and the sun burns brighter as the song builds.
import { activity } from '../ambient.js';
import { energyAt } from '../energy.js';
import { burst, held, noise } from '../envelope.js';
import { litColor } from '../palettes.js';
import { notesBetween } from '../scene.js';
import { glowSprite, mixColors } from '../sprites.js';
import { drawMoon, drawPlanet, drawRings, drawSun } from './bodies.js';
import { drawKeyStars, drawStarlight } from './stars.js';
import { BELT, cometAt, PLANETS, planetAngle, planetAt, SUN, systemOf } from './system.js';

const RIPPLE = 0.9; // seconds a ripple spreads
const ALIGN = 1.2; // seconds an alignment shows
const ROCKS = 180;
const TAU = Math.PI * 2;

/** Screen points along an orbit-plane circle around (cx, cz), from angle `from` to `to`. */
function circle(view, cx, cz, radius, from = 0, to = TAU, y = 0) {
  const steps = Math.max(8, Math.ceil((Math.abs(to - from) / TAU) * 96));
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const a = from + ((to - from) * i) / steps;
    const p = view.project(cx + Math.cos(a) * radius, y, cz + Math.sin(a) * radius);
    if (p) pts.push(p);
  }
  return pts;
}

function strokePoints(ctx, pts, width, color, alpha) {
  if (pts.length < 2 || alpha <= 0.01) return;
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.stroke();
}

/** What each planet is doing at t: how hard it was just struck, how long it is held, in what color. */
function planetStates(scene, t, palette) {
  const { planetOf } = systemOf(scene);
  const states = PLANETS.map(() => ({ strike: 0, hold: 0, color: palette.lit[0], notes: [] }));
  const hands = { right: 0, left: 0 };
  for (const n of notesBetween(scene, t - 1.5, t)) {
    if (n.start > t) continue;
    const s = states[planetOf[n.index]];
    const b = burst(n, t);
    s.strike += b;
    s.hold = Math.max(s.hold, held(n, t));
    if (b > 0.01 || held(n, t) > 0.02) s.color = litColor(palette, n);
    s.notes.push(n);
    hands[n.hand] += b;
  }
  return { states, together: Math.min(1, hands.right) * Math.min(1, hands.left) };
}

function drawOrbits(ctx, view, palette, states) {
  PLANETS.forEach((p, k) => {
    const pts = circle(view, 0, 0, p.orbit);
    strokePoints(ctx, pts, 1.4, palette.staff, 0.5);
    const lit = Math.min(1, states[k].strike * 0.6 + states[k].hold * 0.25);
    if (lit > 0.02) {
      ctx.globalCompositeOperation = palette.blend;
      strokePoints(ctx, pts, 2.5, states[k].color, lit * 0.7);
      ctx.globalCompositeOperation = 'source-over';
    }
  });
}

/** The asteroid belt, drifting slowly; it sparkles when both hands strike together. */
function drawBelt(ctx, view, palette, t, together) {
  for (let i = 0; i < ROCKS; i++) {
    const r = BELT[0] + (BELT[1] - BELT[0]) * noise(i, 61);
    const a = noise(i, 62) * TAU + (t * 0.5) / r ** 1.5;
    const p = view.project(Math.cos(a) * r, (noise(i, 63) - 0.5) * 0.4, Math.sin(a) * r);
    if (!p) continue;
    const size = Math.max(1, (0.035 + 0.05 * noise(i, 64)) * p.s);
    ctx.globalAlpha = (0.45 + 0.3 * noise(i, 66)) * p.fog;
    ctx.fillStyle = palette.idle;
    ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
    if (together > 0.02 && noise(i, 65) < 0.3) {
      const glow = size * 9 * together;
      ctx.globalCompositeOperation = palette.blend;
      ctx.globalAlpha = together * p.fog;
      ctx.drawImage(glowSprite(palette.lit[i % palette.lit.length]), p.x - glow / 2, p.y - glow / 2, glow, glow);
      ctx.globalCompositeOperation = 'source-over';
    }
  }
}

/** While a note is held, its planet paints the stretch of orbit it travels. */
function drawPaths(ctx, view, scene, t, palette, states) {
  ctx.globalCompositeOperation = palette.blend;
  states.forEach((s, k) => {
    for (const n of s.notes) {
      const alpha = held(n, t);
      if (alpha <= 0.02) continue;
      const from = planetAngle(scene, k, n.start);
      const to = planetAngle(scene, k, Math.min(t, n.end));
      if (to - from < 0.01) continue;
      const pts = circle(view, 0, 0, PLANETS[k].orbit, from, Math.min(to, from + TAU));
      const width = Math.max(1.5, PLANETS[k].size * 0.22 * (pts[0]?.s ?? 1));
      strokePoints(ctx, pts, width, litColor(palette, n), alpha * 0.45);
    }
  });
  ctx.globalCompositeOperation = 'source-over';
}

/** Ripples spreading across the orbit plane from each struck planet. */
function drawRipples(ctx, view, t, palette, states, places) {
  ctx.globalCompositeOperation = palette.blend;
  states.forEach((s, k) => {
    const [x, , z] = places[k];
    const p = view.project(x, 0, z);
    if (!p) return;
    for (const n of s.notes) {
      const age = t - n.start;
      const color = litColor(palette, n);
      if (age < RIPPLE) {
        const u = age / RIPPLE;
        const radius = PLANETS[k].size * (1.3 + 3.5 * u);
        strokePoints(ctx, circle(view, x, z, radius), 2, color, (1 - u) ** 2 * (0.4 + 0.6 * n.velocity));
      }
    }
  });
  ctx.globalCompositeOperation = 'source-over';
}

/** A chord lines its planets up with the sun, joined by a thread of light. */
function drawAlignments(ctx, view, scene, t, palette, places, sun) {
  ctx.globalCompositeOperation = palette.blend;
  for (const { start, planets } of systemOf(scene).alignments) {
    const age = t - start;
    if (age < 0 || age > ALIGN) continue;
    const alpha = Math.exp(-age * 3);
    const pts = [sun, ...planets.map((k) => view.project(...places[k]))].filter(Boolean);
    strokePoints(ctx, pts, 2, palette.ink, alpha * 0.55);
    for (const p of pts.slice(1)) {
      const size = 0.9 * p.s;
      ctx.globalAlpha = alpha * 0.6;
      ctx.drawImage(glowSprite(palette.ink), p.x - size / 2, p.y - size / 2, size, size);
    }
  }
  ctx.globalCompositeOperation = 'source-over';
}

/** A comet: a bright head and a tail of light streaming away from the sun. */
function drawComet(ctx, view, palette, at) {
  const color = mixColors('#ffffff', palette.lit[0], 0.45);
  const d = Math.hypot(at.x, at.z) || 1;
  ctx.globalCompositeOperation = palette.blend;
  for (let i = 14; i >= 0; i--) {
    const back = i * 0.32;
    const p = view.project(at.x + (at.x / d) * back, at.y, at.z + (at.z / d) * back);
    if (!p) continue;
    const size = (0.9 - i * 0.04) * p.s * (i ? 1 : 1.4);
    ctx.globalAlpha = at.clear * p.fog * (1 - i / 15) * 0.7;
    ctx.drawImage(glowSprite(i ? palette.lit[0] : color), p.x - size / 2, p.y - size / 2, size, size);
  }
  ctx.globalCompositeOperation = 'source-over';
}

export const solarSystem = {
  id: 'solar-system',
  name: 'Solar System',
  description:
    'Each key is a star; its light strikes a planet as the note sounds. The right hand plays the rocky planets, the left hand the giants, and every note moves its planet along its orbit.',
  draw(ctx, scene, t, palette, view) {
    const { states, together } = planetStates(scene, t, palette);
    const places = PLANETS.map((_, k) => planetAt(scene, k, t));
    const sun = view.project(0, 0, 0);
    drawKeyStars(ctx, scene.layout, palette);
    drawOrbits(ctx, view, palette, states);
    drawBelt(ctx, view, palette, t, together);
    drawPaths(ctx, view, scene, t, palette, states);
    drawRipples(ctx, view, t, palette, states, places);
    drawAlignments(ctx, view, scene, t, palette, places, sun);

    // The bodies, farthest first, so nearer ones pass in front.
    const bodies = [
      { at: [0, 0, 0], draw: () => drawSun(ctx, sun, SUN * sun.s, palette, energyAt(scene, t), activity(scene, t), t) },
    ];
    PLANETS.forEach((planet, k) => {
      const [x, y, z] = places[k];
      const s = states[k];
      bodies.push({
        at: places[k],
        draw: () => {
          const p = view.project(x, y, z);
          if (!p) return;
          const r = Math.max(2.5, planet.size * p.s * (1 + 0.3 * Math.min(1, s.strike)));
          const glow = Math.min(1, s.strike * 0.9 + s.hold * 0.3);
          if (glow > 0.02) {
            const size = r * (5 + 5 * Math.min(1, s.strike));
            ctx.globalCompositeOperation = palette.blend;
            ctx.globalAlpha = glow * p.fog;
            ctx.drawImage(glowSprite(s.color), p.x - size / 2, p.y - size / 2, size, size);
            ctx.globalCompositeOperation = 'source-over';
          }
          if (planet.rings) drawRings(ctx, view, places[k], planet.size, 'back');
          drawPlanet(ctx, planet.id, p, r, sun);
          if (planet.rings) drawRings(ctx, view, places[k], planet.size, 'front');
        },
      });
      (planet.moons ?? []).forEach((moon, m) => {
        const a = noise(k, 70 + m) * TAU + (t * TAU) / moon.period;
        const at = [x + Math.cos(a) * moon.orbit, 0, z + Math.sin(a) * moon.orbit];
        bodies.push({
          at,
          draw: () => {
            const p = view.project(...at);
            if (p) drawMoon(ctx, p, Math.max(1.5, moon.size * p.s), sun);
          },
        });
      });
    });
    for (const comet of systemOf(scene).comets) {
      const at = cometAt(comet, t);
      if (at) bodies.push({ at: [at.x, at.y, at.z], draw: () => drawComet(ctx, view, palette, at) });
    }
    bodies.sort((a, b) => view.depthOf(...b.at) - view.depthOf(...a.at));
    for (const body of bodies) body.draw();
    drawStarlight(ctx, scene, t, palette, view, places);
    ctx.globalAlpha = 1;
  },
};
