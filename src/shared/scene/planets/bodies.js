// The bodies of the solar system as the camera sees them: the sun, the planets (each painted once
// into a picture, then lit from the sun's side every frame), Saturn's rings and the moons.
import { noise } from '../envelope.js';
import { glowSprite, makeCanvas } from '../sprites.js';

const SIZE = 128;

// How each planet is painted: a lit and a shadowed color, and its markings.
const LOOKS = {
  mercury: { light: '#c2bdb6', dark: '#5d5955', craters: 9 },
  venus: { light: '#f4e0b0', dark: '#b48a4f', bands: ['#ead29c', '#f7e9c8', '#e2c48c'], soft: true },
  earth: { light: '#4f93f2', dark: '#163a86', land: ['#4f9a4a', '#8c7c4c', '#3f8243'], clouds: true },
  mars: { light: '#e47c4c', dark: '#7d2c14', cap: true, craters: 4 },
  jupiter: {
    light: '#ead2ab',
    dark: '#9b6a45',
    bands: ['#c98f63', '#f1e2c6', '#b77a50', '#e9d3ad', '#a86c47', '#f0dcb8'],
    spot: '#c1553a',
  },
  saturn: { light: '#f2e2b4', dark: '#a8864e', bands: ['#e3c98f', '#f6eacb', '#d2b47a', '#ecdcb0'] },
  uranus: { light: '#c4f3f4', dark: '#4d9fb3' },
  neptune: { light: '#6595f8', dark: '#1d2f8f', bands: ['#4a72e0'], soft: true, spot: '#16246e' },
};

function ellipse(ctx, x, y, rx, ry, color, alpha) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x * SIZE, y * SIZE, rx * SIZE, ry * SIZE, 0, 0, Math.PI * 2);
  ctx.fill();
}

function paintPlanet(ctx, look, seed) {
  const c = SIZE / 2;
  ctx.beginPath();
  ctx.arc(c, c, c - 1, 0, Math.PI * 2);
  ctx.clip();
  const body = ctx.createRadialGradient(c * 0.85, c * 0.85, 0, c, c, c);
  body.addColorStop(0, look.light);
  body.addColorStop(1, look.dark);
  ctx.fillStyle = body;
  ctx.fillRect(0, 0, SIZE, SIZE);
  (look.bands ?? []).forEach((color, i, all) => {
    const y = 0.1 + (0.8 * (i + 0.5)) / all.length;
    ellipse(ctx, 0.5, y, 0.7, 0.035 + 0.04 * noise(seed, i), color, look.soft ? 0.35 : 0.7);
  });
  if (look.spot) ellipse(ctx, 0.62, 0.64, 0.12, 0.065, look.spot, 0.8);
  for (let i = 0; i < (look.land ?? []).length * 3; i++) {
    const r = 0.08 + 0.12 * noise(seed, 20 + i);
    ellipse(ctx, 0.15 + 0.7 * noise(seed, 30 + i), 0.2 + 0.6 * noise(seed, 40 + i), r, r * 0.7, look.land[i % 3], 0.9);
  }
  if (look.clouds) {
    for (let i = 0; i < 6; i++) {
      ellipse(ctx, noise(seed, 50 + i), 0.15 + 0.7 * noise(seed, 60 + i), 0.3, 0.025, '#ffffff', 0.5);
    }
    ellipse(ctx, 0.5, 0.02, 0.4, 0.1, '#ffffff', 0.85);
    ellipse(ctx, 0.5, 0.98, 0.4, 0.1, '#ffffff', 0.85);
  }
  if (look.cap) ellipse(ctx, 0.52, 0.04, 0.22, 0.08, '#fff6ee', 0.85);
  for (let i = 0; i < (look.craters ?? 0); i++) {
    const r = 0.04 + 0.06 * noise(seed, 70 + i);
    ellipse(ctx, 0.15 + 0.7 * noise(seed, 80 + i), 0.15 + 0.7 * noise(seed, 90 + i), r, r, '#000000', 0.18);
  }
  // Darker toward the edge, so it reads as a ball.
  const limb = ctx.createRadialGradient(c, c, c * 0.55, c, c, c);
  limb.addColorStop(0, 'rgba(0, 0, 0, 0)');
  limb.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
  ctx.globalAlpha = 1;
  ctx.fillStyle = limb;
  ctx.fillRect(0, 0, SIZE, SIZE);
}

const sprites = new Map();

function planetSprite(id) {
  if (!sprites.has(id)) {
    const sprite = makeCanvas(SIZE, SIZE);
    paintPlanet(sprite.getContext('2d'), LOOKS[id], id.length);
    sprites.set(id, sprite);
  }
  return sprites.get(id);
}

/** A planet of screen radius r at p, its night side turned away from the sun (screen point `sun`). */
export function drawPlanet(ctx, id, p, r, sun) {
  ctx.globalAlpha = p.fog;
  ctx.drawImage(planetSprite(id), p.x - r, p.y - r, 2 * r, 2 * r);
  const dx = sun.x - p.x;
  const dy = sun.y - p.y;
  const d = Math.hypot(dx, dy);
  if (d < 1) return; // seen straight down past the sun: all day side
  const [ux, uy] = [dx / d, dy / d];
  ctx.save();
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.clip();
  const night = ctx.createLinearGradient(p.x + ux * r, p.y + uy * r, p.x - ux * r, p.y - uy * r);
  night.addColorStop(0, 'rgba(0, 0, 0, 0)');
  night.addColorStop(0.45, 'rgba(0, 0, 0, 0.05)');
  night.addColorStop(0.8, 'rgba(0, 0, 0, 0.62)');
  night.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
  ctx.fillStyle = night;
  ctx.fillRect(p.x - r, p.y - r, 2 * r, 2 * r);
  ctx.restore();
}

/**
 * Saturn's rings, flat in the orbit plane around `center`. `side` 'back' draws the half beyond the
 * planet (before it), 'front' the half before it (after it). Seen from straight above, it is all back.
 */
export function drawRings(ctx, view, center, size, side) {
  const [cx, cy, cz] = center;
  const base = view.depthOf(cx, cy, cz);
  const a = view.depthOf(cx + 1, cy, cz) - base;
  const b = view.depthOf(cx, cy, cz + 1) - base;
  const flat = Math.hypot(a, b) < 1e-3;
  if (flat && side === 'front') return;
  const far = Math.atan2(b, a); // the direction that runs away from the camera
  const [from, to] = flat
    ? [0, Math.PI * 2]
    : side === 'back'
      ? [far - Math.PI / 2, far + Math.PI / 2]
      : [far + Math.PI / 2, far + Math.PI * 1.5];
  const steps = 40;
  const arc = (radius) => {
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const t = from + ((to - from) * i) / steps;
      pts.push(view.project(cx + Math.cos(t) * radius, cy, cz + Math.sin(t) * radius));
    }
    return pts;
  };
  for (const [inner, outer, alpha] of [
    [1.3, 1.75, 0.55],
    [1.85, 2.3, 0.4],
  ]) {
    const out = arc(outer * size);
    const back = arc(inner * size).reverse();
    if ([...out, ...back].some((p) => !p)) continue;
    ctx.globalAlpha = alpha * out[0].fog * view.opacity;
    ctx.fillStyle = '#dcc690';
    ctx.beginPath();
    [...out, ...back].forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.fill();
  }
}

/** A small grey moon. */
export function drawMoon(ctx, p, r, sun) {
  ctx.globalAlpha = p.fog;
  const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
  g.addColorStop(0, '#e4e0d8');
  g.addColorStop(1, '#8d8983');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();
  const d = Math.hypot(sun.x - p.x, sun.y - p.y);
  if (d < 1) return;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.beginPath();
  ctx.arc(p.x - ((sun.x - p.x) / d) * r * 0.5, p.y - ((sun.y - p.y) / d) * r * 0.5, r, 0, Math.PI * 2);
  ctx.fill();
}

/** The sun: a white-hot core in a corona that grows with the song's energy and breathes with the playing. */
export function drawSun(ctx, p, r, palette, energy, pulse, t) {
  const bright = palette.blend === 'lighter' ? 1 : 0.5;
  const flicker = 1 + 0.04 * Math.sin(t * 3.1) + 0.03 * Math.sin(t * 7.3);
  ctx.globalCompositeOperation = palette.blend;
  ctx.globalAlpha = Math.min(1, (0.45 + 0.35 * energy + 0.25 * pulse) * bright);
  const corona = r * (6 + 6 * energy + 2 * pulse) * flicker;
  ctx.drawImage(glowSprite('#ffa63d'), p.x - corona / 2, p.y - corona / 2, corona, corona);
  ctx.globalAlpha = 0.8 * bright;
  const halo = r * 3.2 * flicker;
  ctx.drawImage(glowSprite('#fff1c2'), p.x - halo / 2, p.y - halo / 2, halo, halo);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  const core = ctx.createRadialGradient(p.x - r * 0.2, p.y - r * 0.2, 0, p.x, p.y, r);
  core.addColorStop(0, '#fffdf0');
  core.addColorStop(0.5, '#ffe183');
  core.addColorStop(1, '#ff9a2a');
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();
}
