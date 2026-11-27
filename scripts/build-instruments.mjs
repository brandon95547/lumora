// Builds an instrument's samples for the browser from its source sample library:
//   node scripts/build-instruments.mjs <grand|upright|rhodes> <folder of the source .flac files>
//
// Each source sample is decoded with macOS's afconvert, cut to where its sound starts and to where
// it has died away (a fade at the end), then encoded as AAC in .m4a, which every browser decodes.
// Writes public/instruments/<id>/: the samples, named by their content hash so they can be cached
// for good, and manifest.json listing each sample's pitch and velocity layer. Needs macOS.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
const midiOf = (name, octave) => (Number(octave) + 1) * 12 + NOTE[name];

// Which source files make the instrument, and the pitch and velocity layer (0–1, the loudness the
// layer was played at) of each. `longest` caps a sample's length in seconds.
const INSTRUMENTS = {
  grand: {
    // Salamander Grand Piano V3 (Yamaha C5), 4 of its 16 velocity layers.
    match: /^([A-G]#?)(\d)v(4|8|12|16)\.flac$/,
    sample: (m) => ({ pitch: midiOf(m[1], m[2]), layer: Number(m[3]) / 16 }),
    longest: 9,
  },
  upright: {
    // Upright Piano KW (Kawai), its soft and loud layers.
    match: /^([A-G]#?)(\d)v([LH])\.flac$/,
    sample: (m) => ({ pitch: midiOf(m[1], m[2]), layer: m[3] === 'L' ? 0.45 : 0.85 }),
    longest: 8,
  },
  rhodes: {
    // jRhodes3d (1977 Rhodes Mark I Stage 73), stereo, its 5 velocity layers.
    match: /^A_(\d{3})__\w+_(\d)-ST\.flac$/,
    sample: (m) => ({ pitch: Number(m[1]), layer: Number(m[2]) / 5 }),
    longest: 8,
  },
};

const BITRATE = 128000;
const FADE = 0.25; // seconds of fade at the cut end
const QUIET = 10 ** (-60 / 20); // a sample ends where it stays 60 dB under its peak

/** The float samples and channel count of a 32-bit float WAV written by afconvert. */
function readWav(path) {
  const buf = readFileSync(path);
  let at = 12;
  let channels = 2;
  let rate = 48000;
  while (at < buf.length) {
    const id = buf.toString('ascii', at, at + 4);
    const size = buf.readUInt32LE(at + 4);
    if (id === 'fmt ') [channels, rate] = [buf.readUInt16LE(at + 10), buf.readUInt32LE(at + 12)];
    if (id === 'data') {
      const data = new Float32Array(buf.buffer.slice(buf.byteOffset + at + 8, buf.byteOffset + at + 8 + size));
      return { data, channels, rate };
    }
    at += 8 + size + (size % 2);
  }
  throw new Error(`no audio in ${path}`);
}

function writeWav(path, data, channels, rate) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.byteLength, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(3, 20); // IEEE float
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * channels * 4, 28);
  header.writeUInt16LE(channels * 4, 32);
  header.writeUInt16LE(32, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.byteLength, 40);
  writeFileSync(path, Buffer.concat([header, Buffer.from(data.buffer, data.byteOffset, data.byteLength)]));
}

/** From just before the sound starts to where it has died away (or `longest`), faded out at the end. */
function trim({ data, channels, rate }, longest) {
  const frames = data.length / channels;
  const level = (i) => {
    let m = 0;
    for (let c = 0; c < channels; c++) m = Math.max(m, Math.abs(data[i * channels + c]));
    return m;
  };
  let peak = 0;
  for (let i = 0; i < frames; i++) peak = Math.max(peak, level(i));
  let start = 0;
  while (start < frames && level(start) < peak * 0.01) start++;
  start = Math.max(0, start - Math.round(rate * 0.002));
  let end = frames - 1;
  while (end > start && level(end) < peak * QUIET) end--;
  end = Math.min(end, start + Math.round(longest * rate));
  const fade = Math.min(Math.round(FADE * rate), end - start);
  const out = data.slice(start * channels, end * channels);
  for (let i = 0; i < fade; i++) {
    const k = (fade - i) / fade;
    for (let c = 0; c < channels; c++) out[(end - start - fade + i) * channels + c] *= k * k;
  }
  return { data: out, channels, rate, peak };
}

const [id, source] = process.argv.slice(2);
const instrument = INSTRUMENTS[id];
if (!instrument || !source) {
  console.error(`Usage: node scripts/build-instruments.mjs <${Object.keys(INSTRUMENTS).join('|')}> <source folder>`);
  process.exit(1);
}
const outDir = new URL(`../public/instruments/${id}/`, import.meta.url).pathname;
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
const work = mkdtempSync(join(tmpdir(), `lumora-${id}-`));

const samples = [];
let loudest = 0;
let bytes = 0;
for (const name of readdirSync(source).sort()) {
  const m = name.match(instrument.match);
  if (!m) continue;
  const decoded = join(work, 'decoded.wav');
  execFileSync('afconvert', ['-f', 'WAVE', '-d', 'LEF32', join(source, name), decoded]);
  const cut = trim(readWav(decoded), instrument.longest);
  loudest = Math.max(loudest, cut.peak);
  writeWav(join(work, 'cut.wav'), cut.data, cut.channels, cut.rate);
  const encoded = join(work, 'cut.m4a');
  execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', String(BITRATE), join(work, 'cut.wav'), encoded]);
  const file = readFileSync(encoded);
  const hash = createHash('sha256').update(file).digest('hex').slice(0, 10);
  const { pitch, layer } = instrument.sample(m);
  const out = `${pitch}-${Math.round(layer * 100)}.${hash}.m4a`;
  writeFileSync(join(outDir, out), file);
  bytes += file.length;
  samples.push({ file: out, pitch, layer });
}
rmSync(work, { recursive: true, force: true });
// One gain for the whole instrument, so its loudest sample peaks near full scale and every
// instrument plays at a similar level; the layers keep their own loudness under it.
const manifest = { gain: Math.round((0.9 / loudest) * 1000) / 1000, samples };
writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n');
console.log(`${id}: ${samples.length} samples, ${(bytes / 2 ** 20).toFixed(1)} MB`);
