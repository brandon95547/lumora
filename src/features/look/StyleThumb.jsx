// A still of a style, drawn from the song's own notes, so the cards show what you'll get.
import { useEffect, useRef } from 'react';
import { paletteById } from '../../shared/scene/palettes.js';
import { renderFrame } from '../../shared/scene/render.js';

const WIDTH = 320;

/** A moment with plenty lit: just after the busiest second of the first part of the song. */
function busyMoment(scene) {
  const starts = scene.items.map((n) => n.start).filter((s) => s < 30);
  let best = starts[0] ?? 0;
  let most = 0;
  for (let i = 0, j = 0; i < starts.length; i++) {
    while (starts[j] < starts[i] - 1.2) j++;
    if (i - j > most) [most, best] = [i - j, starts[i]];
  }
  return best + 0.12;
}

export function StyleThumb({ style, scene, paletteId }) {
  const canvas = useRef(null);
  const { width, height } = scene.layout;
  useEffect(() => {
    const el = canvas.current;
    const scale = WIDTH / width;
    el.width = WIDTH;
    el.height = Math.round(height * scale);
    const ctx = el.getContext('2d');
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    renderFrame(ctx, scene, { t: busyMoment(scene), style, palette: paletteById(paletteId), title: '' });
  }, [style, scene, paletteId, width, height]);
  return (
    <canvas
      ref={canvas}
      aria-hidden="true"
      className="block w-full bg-black object-cover"
      style={{ aspectRatio: '16 / 9' }}
    />
  );
}
