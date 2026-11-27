// TensorFlow.js 3 tests a bare `window` (setTimeoutCustom), which throws in a worker.
// Declaring it as undefined makes that test fall back to plain setTimeout.
// Imported first by the worker, before TensorFlow.js runs.
if (!('window' in globalThis)) globalThis.window = undefined;
