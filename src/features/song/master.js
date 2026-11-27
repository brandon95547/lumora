// Mastering: every song leaves Lumora at the loudness the video platforms play at, so it is neither
// turned down nor left too quiet. TikTok, Instagram and YouTube aim near -14 LUFS (integrated
// loudness, ITU-R BS.1770 with EBU R128 gating) and want peaks under -1 dBTP, so their own encoders
// don't distort them. The song is raised or lowered to -14 LUFS, then a look-ahead limiter catches
// the peaks that would pass the ceiling.

export const TARGET_LUFS = -14;
export const CEILING_DBTP = -1;

const db = (x) => 20 * Math.log10(x);
const fromDb = (d) => 10 ** (d / 20);

// K-weighting at 48 kHz (BS.1770-4, table 1 and 2): a high shelf for the head, then a high-pass.
const SHELF = { b: [1.53512485958697, -2.69169618940638, 1.19839281085285], a: [-1.69065929318241, 0.73248077421585] };
const HIGH_PASS = { b: [1, -2, 1], a: [-1.99004745483398, 0.99007225036621] };

function biquad(input, { b, a }) {
  const out = new Float32Array(input.length);
  let [x1, x2, y1, y2] = [0, 0, 0, 0];
  for (let i = 0; i < input.length; i++) {
    const x = input[i];
    const y = b[0] * x + b[1] * x1 + b[2] * x2 - a[0] * y1 - a[1] * y2;
    [x2, x1, y2, y1] = [x1, x, y1, y];
    out[i] = y;
  }
  return out;
}

/** Integrated loudness in LUFS of 48 kHz channels (left and right weigh the same). */
export function integratedLoudness(channels, rate = 48000) {
  if (rate !== 48000) throw new Error('loudness is measured at 48 kHz');
  const step = rate / 10; // blocks of 400 ms, every 100 ms
  const length = channels[0].length;
  const steps = Math.floor(length / step);
  const power = new Float64Array(steps); // summed mean square of the channels, per 100 ms
  for (const channel of channels) {
    const weighted = biquad(biquad(channel, SHELF), HIGH_PASS);
    for (let s = 0; s < steps; s++) {
      let sum = 0;
      for (let i = s * step; i < (s + 1) * step; i++) sum += weighted[i] * weighted[i];
      power[s] += sum / step;
    }
  }
  const blocks = [];
  for (let s = 0; s + 4 <= steps; s++) blocks.push((power[s] + power[s + 1] + power[s + 2] + power[s + 3]) / 4);
  const lufs = (p) => -0.691 + 10 * Math.log10(p);
  const mean = (list) => list.reduce((sum, p) => sum + p, 0) / list.length;
  const audible = blocks.filter((p) => lufs(p) > -70); // absolute gate
  if (!audible.length) return -Infinity;
  const relative = lufs(mean(audible)) - 10; // relative gate
  const gated = audible.filter((p) => lufs(p) > relative);
  return lufs(mean(gated));
}

/**
 * The highest peak in dB, read between the samples too (4× over, by cubic interpolation), since a
 * waveform can swing past its samples once it is turned back into sound.
 */
export function truePeak(channels) {
  let peak = 0;
  for (const d of channels) {
    for (let i = 1; i < d.length - 2; i++) {
      const p1 = d[i];
      const p2 = d[i + 1];
      const a = Math.abs(p1);
      if (a > peak) peak = a;
      // A curve between two samples rises at most about 3 dB past them; skip where that can't matter.
      if (Math.max(a, Math.abs(p2)) * 1.42 <= peak) continue;
      const p0 = d[i - 1];
      const p3 = d[i + 2];
      for (const t of [0.25, 0.5, 0.75]) {
        const v = p1 + 0.5 * t * (p2 - p0 + t * (2 * p0 - 5 * p1 + 4 * p2 - p3 + t * (3 * (p1 - p2) + p3 - p0)));
        peak = Math.max(peak, Math.abs(v));
      }
    }
  }
  return db(peak);
}

/** Minimum of each `width`-long window starting at i, in one pass. */
function slidingMin(values, width) {
  const out = new Float32Array(values.length);
  const queue = new Int32Array(values.length);
  let head = 0;
  let tail = 0;
  for (let i = values.length - 1; i >= 0; i--) {
    while (tail > head && values[queue[tail - 1]] >= values[i]) tail--;
    queue[tail++] = i;
    while (queue[head] >= i + width) head++;
    out[i] = values[queue[head]];
  }
  return out;
}

/**
 * Keeps every sample under `ceiling` (linear) without clicks: the gain starts coming down 5 ms before
 * a peak, reaches what the peak needs exactly at it, and recovers over about 80 ms. Both channels
 * share one gain so the stereo picture holds.
 */
export function limit(channels, ceiling, rate = 48000) {
  const length = channels[0].length;
  const ahead = Math.round(rate * 0.005);
  const needed = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    let level = 0;
    for (const c of channels) level = Math.max(level, Math.abs(c[i]));
    needed[i] = level > ceiling ? ceiling / level : 1;
  }
  // The least gain any peak in the next `ahead` samples needs, averaged over `ahead`: it is down to
  // a peak's need by the time the peak arrives.
  const hold = slidingMin(needed, ahead);
  const release = 1 - Math.exp(-1 / (rate * 0.08));
  let sum = 0;
  let gain = 1;
  for (let i = 0; i < length; i++) {
    sum += hold[i] - (i >= ahead ? hold[i - ahead] : 0); // the window's gains; before the start counts as 1
    const smooth = (sum + Math.max(0, ahead - 1 - i)) / ahead;
    gain = Math.min(smooth, gain + (1 - gain) * release);
    for (const c of channels) c[i] *= gain;
  }
}

/** Masters an AudioBuffer in place to TARGET_LUFS with peaks under CEILING_DBTP. Returns what it measured. */
export function master(buffer) {
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, c) => buffer.getChannelData(c));
  const before = integratedLoudness(channels, buffer.sampleRate);
  if (!Number.isFinite(before)) return { lufs: before, truePeak: -Infinity };
  const gain = fromDb(TARGET_LUFS - before);
  for (const c of channels) for (let i = 0; i < c.length; i++) c[i] *= gain;
  // The limiter works on samples; aim half a dB under the ceiling to leave room between them.
  limit(channels, fromDb(CEILING_DBTP - 0.5), buffer.sampleRate);
  let peak = truePeak(channels);
  if (peak > CEILING_DBTP) {
    const trim = fromDb(CEILING_DBTP - peak - 0.05);
    for (const c of channels) for (let i = 0; i < c.length; i++) c[i] *= trim;
    peak = truePeak(channels);
  }
  return { lufs: integratedLoudness(channels, buffer.sampleRate), truePeak: peak };
}
