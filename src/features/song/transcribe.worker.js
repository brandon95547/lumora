// Finds the notes in a recording with Spotify's Basic Pitch model, off the main thread.
// The model's raw output is kept, so a new sensitivity re-reads it without running the model again.
//
// It runs on the graphics card (WebGL) where it can, and falls back to the processor when the
// graphics card refuses or runs out of memory: slower, but it works in every browser.
import './worker-window.js';
import * as tf from '@tensorflow/tfjs';
import { addPitchBendsToNoteEvents, BasicPitch, noteFramesToTime, outputToNotesPoly } from '@spotify/basic-pitch';
import modelUrl from '@spotify/basic-pitch/model/model.json?url';
import weightsUrl from '@spotify/basic-pitch/model/group1-shard1of1.bin?url';

const BACKENDS = ['webgl', 'cpu'];
// Basic Pitch's output tensors, in the order we ask for them.
const OUTPUTS = { frames: 'Identity_1', onsets: 'Identity_2', contours: 'Identity' };
const FRAMES_PER_SAMPLE = Math.floor(22050 / 256) / 22050;

let model;
let output; // { frames, onsets, contours } of the last recording
let running = false;
let escaped = null; // a failure thrown from TensorFlow.js's own timers during a run

async function switchBackend(name) {
  if (tf.getBackend() === name) return;
  if (!(await tf.setBackend(name))) throw new Error(`${name} is not available`);
  await tf.ready();
  model = null; // the weights live on the old backend; load them again
}

function loadModel() {
  model ??= tf.loadGraphModel(modelUrl, { weightUrlConverter: async () => weightsUrl });
  return model;
}

/**
 * Basic Pitch's own loop over the recording, except that each window's tensors are freed as soon
 * as its numbers are read, so a long song doesn't fill the graphics card's memory.
 */
async function evaluate(graph, samples, onProgress) {
  const basicPitch = new BasicPitch(graph);
  tf.engine().startScope();
  const [input, length] = await basicPitch.prepareData(samples);
  tf.keep(input);
  tf.engine().endScope();
  const total = Math.floor(length * FRAMES_PER_SAMPLE);
  const result = { frames: [], onsets: [], contours: [] };
  const names = Object.keys(OUTPUTS);
  let done = 0;
  try {
    for (let i = 0; i < input.shape[0] && done < total; i++) {
      onProgress(i / input.shape[0]);
      const parts = tf.tidy(() => {
        const window = graph
          .execute(tf.slice(input, i, 1), Object.values(OUTPUTS))
          .map((r) => basicPitch.unwrapOutput(r));
        const keep = Math.min(window[0].shape[0], total - done);
        return window.map((t) => t.slice([0, 0], [keep, -1]));
      });
      const arrays = await Promise.all(parts.map((p) => p.array()));
      parts.forEach((p) => p.dispose());
      if (escaped) throw escaped;
      names.forEach((name, k) => result[name].push(...arrays[k]));
      done += arrays[0].length;
    }
  } finally {
    input.dispose();
  }
  onProgress(1);
  return result;
}

async function transcribe(samples) {
  for (const backend of BACKENDS) {
    try {
      running = true;
      escaped = null;
      await switchBackend(backend);
      const graph = await loadModel();
      return await evaluate(graph, samples, (progress) =>
        self.postMessage({ type: 'progress', progress, slow: backend === 'cpu' }),
      );
    } catch (error) {
      console.warn(`Note finder failed on ${backend}`, error);
      if (backend === BACKENDS[BACKENDS.length - 1]) throw error;
    } finally {
      running = false;
    }
  }
}

function extract({ onset, frame, minFrames }) {
  const events = outputToNotesPoly(output.frames, output.onsets, onset, frame, minFrames);
  return noteFramesToTime(addPitchBendsToNoteEvents(output.contours, events)).map((n) => ({
    pitch: n.pitchMidi,
    start: n.startTimeSeconds,
    end: n.startTimeSeconds + n.durationSeconds,
    velocity: n.amplitude,
  }));
}

// A failure inside TensorFlow.js's own timers escapes the try blocks. During a run it fails that
// attempt (so the next backend is tried); otherwise it is reported instead of leaving the page waiting.
self.addEventListener('unhandledrejection', (event) => {
  event.preventDefault();
  if (running) escaped = event.reason;
  else self.postMessage({ type: 'error', message: String(event.reason?.message ?? event.reason) });
});

self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'transcribe') output = await transcribe(data.samples);
    self.postMessage({ type: 'notes', notes: extract(data.thresholds) });
  } catch (error) {
    self.postMessage({ type: 'error', message: String(error?.message ?? error) });
  }
};
