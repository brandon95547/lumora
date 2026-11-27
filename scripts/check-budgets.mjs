// Size budgets (gzipped), from the build's manifest. Fails when:
// - the first screen's JS or CSS is over its limit, or a lazy chunk is over its own;
// - a module meant to load on demand is pulled into the first screen;
// - anything grew more than 10 KB past the sizes recorded in budgets.json
//   (run with --update to record new sizes, and say why in the commit).
import { readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const LIMITS = { initialJs: 350, initialCss: 60, lazyChunk: 100 };
const GROWTH = 10;
// Must never be in the first screen's JS.
const ON_DEMAND = ['src/features/export/exportVideo.js', 'src/features/song/midi.js', 'src/features/song/musicxml.js'];

const dist = new URL('../dist/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('.vite/manifest.json', dist)));
const kb = (file) => gzipSync(readFileSync(new URL(file, dist))).length / 1024;

const entry = manifest['index.html'];
const initial = new Set();
const walk = (key) => {
  if (initial.has(key)) return;
  initial.add(key);
  for (const dep of manifest[key].imports ?? []) walk(dep);
};
walk('index.html');

const sizes = {
  initialJs: [...initial].reduce((sum, key) => sum + kb(manifest[key].file), 0),
  initialCss: (entry.css ?? []).reduce((sum, file) => sum + kb(file), 0),
};
for (const [key, chunk] of Object.entries(manifest)) {
  if (!initial.has(key) && chunk.file.endsWith('.js')) sizes[`lazy:${key}`] = kb(chunk.file);
}

const failures = [];
for (const key of ON_DEMAND) if (initial.has(key)) failures.push(`${key} is loaded with the first screen`);
for (const [name, size] of Object.entries(sizes)) {
  const limit = name.startsWith('lazy:') ? LIMITS.lazyChunk : LIMITS[name];
  if (size > limit) failures.push(`${name}: ${size.toFixed(1)} KB is over its ${limit} KB limit`);
}

const recordFile = new URL('../budgets.json', import.meta.url);
if (process.argv.includes('--update')) {
  const rounded = Object.fromEntries(Object.entries(sizes).map(([k, v]) => [k, Math.round(v * 10) / 10]));
  writeFileSync(recordFile, JSON.stringify(rounded, null, 2) + '\n');
  console.log('Recorded sizes in budgets.json');
} else {
  const record = JSON.parse(readFileSync(recordFile));
  for (const [name, size] of Object.entries(sizes)) {
    if (name in record && size - record[name] > GROWTH)
      failures.push(`${name} grew ${(size - record[name]).toFixed(1)} KB (to ${size.toFixed(1)} KB)`);
  }
}

for (const [name, size] of Object.entries(sizes)) console.log(`${name.padEnd(48)} ${size.toFixed(1).padStart(7)} KB`);
if (failures.length) {
  console.error('\nBudget check failed:\n- ' + failures.join('\n- '));
  process.exit(1);
}
