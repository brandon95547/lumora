// The page's side of the note-finding worker. The worker (and the model inside it) loads
// the first time a recording is dropped, never with the page.

let worker;
let busy = Promise.resolve();

function call(message, transfer, onProgress) {
  worker ??= new Worker(new URL('./transcribe.worker.js', import.meta.url), { type: 'module' });
  const run = () =>
    new Promise((resolve, reject) => {
      worker.onmessage = ({ data }) => {
        if (data.type === 'progress') onProgress?.(data.progress);
        else if (data.type === 'notes') resolve(data.notes);
        else if (data.type === 'error') reject(new Error(data.message));
      };
      worker.onerror = (event) => reject(new Error(event.message || 'The note finder stopped.'));
      worker.postMessage(message, transfer);
    });
  busy = busy.then(run, run);
  return busy;
}

/** Runs the model over mono 22.05 kHz samples and returns raw notes. */
export function transcribe(samples, thresholds, onProgress) {
  return call({ type: 'transcribe', samples, thresholds }, [samples.buffer], onProgress);
}

/** Re-reads the last recording's model output with new thresholds. */
export function retune(thresholds) {
  return call({ type: 'retune', thresholds }, []);
}
