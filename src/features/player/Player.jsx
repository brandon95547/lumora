// The live preview: the animation drawn at the song's current time, and the transport under it.
import { useEffect, useRef, useState } from 'react';
import { Button } from '../../shared/ui/Button.jsx';
import { clock } from '../../shared/ui/time.js';
import { usePlayback } from './usePlayback.js';

const TICK_MS = 100; // how often the time readout updates

export function Player({ audio, scene, draw }) {
  const canvas = useRef(null);
  const { playing, play, pause, seek, time } = usePlayback(audio);
  const [now, setNow] = useState(0);
  const { width, height } = scene.layout;
  const duration = scene.duration;

  // Draw every frame while playing, and once whenever anything else changes.
  useEffect(() => {
    const el = canvas.current;
    const ctx = el.getContext('2d', { alpha: false });
    let frame = 0;
    let lastTick = 0;
    let lastSize = '';
    const paint = (stamp) => {
      const box = el.getBoundingClientRect();
      const scale = Math.min(1, (box.width * devicePixelRatio) / width);
      const size = `${Math.round(width * scale)}x${Math.round(height * scale)}`;
      if (size !== lastSize) {
        el.width = Math.round(width * scale);
        el.height = Math.round(height * scale);
        lastSize = size;
      }
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      const t = time();
      draw(ctx, t);
      if (stamp - lastTick > TICK_MS) {
        lastTick = stamp;
        setNow(t);
      }
      if (playing) frame = requestAnimationFrame(paint);
    };
    frame = requestAnimationFrame(paint);
    const resize = new ResizeObserver(() => !playing && requestAnimationFrame(paint));
    resize.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
    };
  }, [playing, draw, time, width, height]);

  // Space plays and pauses, unless typing in a field.
  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== 'Space' || e.target.closest('input, textarea, select, button')) return;
      e.preventDefault();
      if (playing) pause();
      else play();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [playing, play, pause]);

  const portrait = height > width;
  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvas}
        aria-label="Animation preview"
        role="img"
        className={`block rounded-2xl bg-black shadow-2xl shadow-black/60 ${portrait ? 'h-[min(72vh,52rem)] w-auto' : 'w-full'}`}
        style={{ aspectRatio: `${width} / ${height}` }}
      />
      <div className="flex w-full max-w-3xl items-center gap-3">
        <Button
          label={playing ? 'Pause' : 'Play'}
          icon={playing ? 'pause' : 'play'}
          variant="primary"
          hideLabel
          disabled={!audio}
          onClick={playing ? pause : play}
        />
        <span className="w-12 text-right text-sm tabular-nums text-muted">{clock(now)}</span>
        <input
          type="range"
          aria-label="Position in the song"
          min={0}
          max={duration || 1}
          step={0.01}
          value={Math.min(now, duration)}
          onChange={(e) => {
            const at = Number(e.target.value);
            seek(at);
            setNow(at);
            if (!playing) draw(canvas.current.getContext('2d'), at);
          }}
          className="h-2 flex-1 cursor-pointer accent-accent"
        />
        <span className="w-12 text-sm tabular-nums text-muted">{clock(duration)}</span>
      </div>
    </div>
  );
}
