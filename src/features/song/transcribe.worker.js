// Finds the notes in a recording with Spotify's Basic Pitch model, off the main thread.
// The model's raw output is kept, so a new sensitivity re-reads it without running the model again.
import './worker-window.js';
import * as tf from '@tensorflow/tfjs';
import { addPitchBendsToNoteEvents, BasicPitch, noteFramesToTime, outputToNotesPoly } from '@spotify/basic-pitch';
import modelUrl from '@spotify/basic-pitch/model/model.json?url';
import weightsUrl from '@spotify/basic-pitch/model/group1-shard1of1.bin?url';

let model;
let output; // { frames, onsets, contours } of the last recording

function loadModel() {
  model ??= tf.loadGraphModel(modelUrl, { weightUrlConverter: async () => weightsUrl });
  return model;
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

// A failure inside TensorFlow.js's own timers escapes the try below; report it instead of hanging.
self.addEventListener('unhandledrejection', (event) => {
  self.postMessage({ type: 'error', message: String(event.reason?.message ?? event.reason) });
});

self.onmessage = async ({ data }) => {
  try {
    if (data.type === 'transcribe') {
      const basicPitch = new BasicPitch(loadModel());
      const frames = [];
      const onsets = [];
      const contours = [];
      await basicPitch.evaluateModel(
        data.samples,
        (f, o, c) => {
          frames.push(...f);
          onsets.push(...o);
          contours.push(...c);
        },
        (progress) => self.postMessage({ type: 'progress', progress }),
      );
      output = { frames, onsets, contours };
    }
    self.postMessage({ type: 'notes', notes: extract(data.thresholds) });
  } catch (error) {
    self.postMessage({ type: 'error', message: String(error?.message ?? error) });
  }
};
