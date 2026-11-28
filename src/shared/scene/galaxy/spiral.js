// The spiral galaxy, far out in the scene: a bright core and two arms, slowly turning, drawn through
// the camera so it sits in the same space as the keyboard. It is where every note's star is born: the
// left hand's along one arm, the right hand's along the other, each arm faintly in its hand's color.
// Where it is (`galaxy`: its center and radius) comes from the camera (galaxyAt in index.js), so it
// always hangs in the sky above the keyboard whatever the angle.
import { noise } from '../envelope.js';
import { litColor } from '../palettes.js';
import { glowSprite, mixColors } from '../sprites.js';

const SPIN = 0.025; // radians a second
const TURNS = 1.6; // how far round each arm winds
const DUST = 1400;
// The disc's plane: across, and tipped back into the distance so it reads as a tilted ellipse.
const ACROSS = [0.95, 0.18, 0.25];
const BACK = [-0.2, -0.45, 0.87];

/** The point `u` (0 core – 1 edge) out along `arm` (0 left hand, 1 right hand) of `galaxy` at t. */
export function armPoint(galaxy, arm, u, offset, t) {
  const theta = u * Math.PI * 2 * TURNS + arm * Math.PI + offset + t * SPIN;
  const r = galaxy.radius * u;
  const [a, b] = [Math.cos(theta) * r, Math.sin(theta) * r];
  return galaxy.center.map((c, i) => c + ACROSS[i] * a + BACK[i] * b);
}

/** Where note `n`'s star is in `galaxy` at t: on its hand's arm, at its own place along it. */
export function starOf(galaxy, n, t) {
  const arm = n.hand === 'right' ? 1 : 0;
  return armPoint(galaxy, arm, 0.15 + 0.8 * noise(n.index, 42), (noise(n.index, 43) - 0.5) * 0.5, t);
}

function glowAt(ctx, view, point, size, color, alpha) {
  const p = view.project(...point);
  if (!p) return;
  const s = size * p.s;
  if (s < 1 || alpha <= 0.01) return;
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.drawImage(glowSprite(color), p.x - s / 2, p.y - s / 2, s, s);
}

/** The galaxy: its glowing core, colored haze along each arm, then the dust of its stars. */
export function drawGalaxy(ctx, view, galaxy, t, palette) {
  ctx.globalCompositeOperation = 'lighter';
  glowAt(ctx, view, galaxy.center, galaxy.radius * 1.1, '#ffe2b8', 0.45);
  glowAt(ctx, view, galaxy.center, galaxy.radius * 0.35, '#fff4e0', 0.8);
  const tints = [0, 1].map((arm) =>
    mixColors(litColor(palette, { hand: arm ? 'right' : 'left', pitch: arm ? 72 : 48 }), '#000000', 0.25),
  );
  for (let k = 0; k < 24; k++) {
    const arm = k % 2;
    const u = 0.2 + 0.8 * (Math.floor(k / 2) / 11);
    glowAt(ctx, view, armPoint(galaxy, arm, u, 0, t), galaxy.radius * (0.45 - 0.2 * u), tints[arm], 0.16);
  }
  for (let i = 0; i < DUST; i++) {
    const arm = i % 2;
    const u = noise(i, 11) ** 0.7;
    const p = view.project(...armPoint(galaxy, arm, u, (noise(i, 12) - 0.5) * 0.6, t));
    if (!p) continue;
    ctx.globalAlpha = (1 - u) * 0.7 + 0.2;
    ctx.fillStyle = noise(i, 14) < 0.3 ? '#ffd9b0' : '#c9d8ff';
    const s = Math.max(1.2, 0.5 * p.s);
    ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}
