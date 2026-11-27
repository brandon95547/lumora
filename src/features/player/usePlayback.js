// Plays the song through Web Audio and reports where it is, with the speaker's delay taken out
// so the lights land when the note is heard.
import { useCallback, useEffect, useRef, useState } from 'react';

export function usePlayback(audio) {
  const ctxRef = useRef(null);
  const sourceRef = useRef(null);
  const startedAt = useRef(0); // context time at song time 0
  const offset = useRef(0); // song time while paused
  // The buffer that is playing, so a new song reads as stopped without an extra render.
  const [playingAudio, setPlayingAudio] = useState(null);
  const playing = playingAudio !== null && playingAudio === audio;

  const stopSource = () => {
    const source = sourceRef.current;
    sourceRef.current = null;
    if (source) {
      source.onended = null;
      source.stop();
    }
  };

  const time = useCallback(() => {
    const ctx = ctxRef.current;
    if (!sourceRef.current || !ctx) return offset.current;
    const latency = (ctx.outputLatency || 0) + (ctx.baseLatency || 0);
    return Math.max(0, ctx.currentTime - startedAt.current - latency);
  }, []);

  const startAt = useCallback(
    (at) => {
      const ctx = (ctxRef.current ??= new AudioContext());
      ctx.resume();
      stopSource();
      const source = ctx.createBufferSource();
      source.buffer = audio;
      source.connect(ctx.destination);
      source.onended = () => {
        sourceRef.current = null;
        offset.current = 0;
        setPlayingAudio(null);
      };
      source.start(0, at);
      sourceRef.current = source;
      startedAt.current = ctx.currentTime - at;
    },
    [audio],
  );

  const play = useCallback(() => {
    if (!audio) return;
    startAt(offset.current >= audio.duration ? 0 : offset.current);
    setPlayingAudio(audio);
  }, [audio, startAt]);

  const pause = useCallback(() => {
    offset.current = time();
    stopSource();
    setPlayingAudio(null);
  }, [time]);

  const seek = useCallback(
    (at) => {
      offset.current = at;
      if (sourceRef.current) startAt(at);
    },
    [startAt],
  );

  // A new song starts from the top.
  useEffect(() => {
    stopSource();
    offset.current = 0;
  }, [audio]);

  useEffect(() => () => ctxRef.current?.close(), []);

  return { playing, play, pause, seek, time };
}
