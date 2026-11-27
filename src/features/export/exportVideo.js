// Renders the whole song frame by frame and encodes it as an MP4, faster than real time,
// in the browser (WebCodecs through Mediabunny). Loaded the first time Export is pressed.
import {
  AudioBufferSource,
  BufferTarget,
  CanvasSource,
  getFirstEncodableAudioCodec,
  getFirstEncodableVideoCodec,
  Mp4OutputFormat,
  Output,
  QUALITY_HIGH,
} from 'mediabunny';
import { renderFrame } from '../../shared/scene/render.js';
import { makeCanvas } from '../../shared/scene/sprites.js';

const YIELD_EVERY = 4; // frames between pauses that let the page repaint its progress

export class ExportError extends Error {
  name = 'ExportError';
}

export async function exportVideo({ scene, audio, look, fps, onProgress, signal }) {
  const { width, height } = scene.layout;
  const videoCodec = await getFirstEncodableVideoCodec(['avc', 'hevc', 'vp9', 'av1'], {
    width,
    height,
    frameRate: fps,
  });
  if (!videoCodec) throw new ExportError('This browser cannot make videos. Try Chrome, Edge or Safari.');
  const audioCodec = audio
    ? await getFirstEncodableAudioCodec(['aac', 'opus'], {
        numberOfChannels: audio.numberOfChannels,
        sampleRate: audio.sampleRate,
      })
    : null;

  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext('2d', { alpha: false });
  const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target: new BufferTarget() });
  const video = new CanvasSource(canvas, { codec: videoCodec, bitrate: QUALITY_HIGH, keyFrameInterval: 2 });
  output.addVideoTrack(video, { frameRate: fps });
  const sound = audioCodec ? new AudioBufferSource({ codec: audioCodec, bitrate: QUALITY_HIGH }) : null;
  if (sound) output.addAudioTrack(sound);

  await output.start();
  const audioDone = sound ? sound.add(audio) : Promise.resolve();
  const frames = Math.ceil(scene.duration * fps);
  try {
    for (let i = 0; i < frames; i++) {
      if (signal.aborted) throw new DOMException('Export stopped', 'AbortError');
      const t = i / fps;
      renderFrame(ctx, scene, { ...look, t });
      await video.add(t, 1 / fps);
      if (i % YIELD_EVERY === 0) {
        onProgress(i / frames);
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
    await audioDone;
    await output.finalize();
  } catch (error) {
    await output.cancel();
    throw error;
  }
  onProgress(1);
  return new Blob([output.target.buffer], { type: 'video/mp4' });
}
