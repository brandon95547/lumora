// Notes from a MusicXML score (.musicxml, .xml, or compressed .mxl), the format every notation app
// exports (MuseScore, Sibelius, Finale, Dorico, Noteflight, flat.io). A piano part's staves give
// each note its hand: the upper staff the right hand, the lower the left. Repeats and first and
// second endings are played out as written; tempo comes from the score's tempo marks.
// Loaded the first time a score is dropped.
import { unzip } from './zip.js';

const STEPS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const DYNAMICS = { pppp: 0.15, ppp: 0.25, pp: 0.35, p: 0.45, mp: 0.55, mf: 0.65, f: 0.78, ff: 0.9, fff: 1 };
const ACCENTS = { sf: 0.85, sfz: 0.85, fz: 0.85, fp: 0.78, sfp: 0.85, rf: 0.8, rfz: 0.8 };
const DEFAULT_TEMPO = 120; // quarter notes a minute, MusicXML's own default
const DEFAULT_VELOCITY = 0.7;
const GRACE = 0.125; // quarter notes a grace note sounds, just before its note
const FORTE = 90 / 127; // a <sound dynamics> of 100 means the velocity of forte

const kids = (el, name) => [...el.children].filter((c) => c.localName === name);
const kid = (el, name) => kids(el, name)[0];
const num = (el, name) => {
  const c = kid(el, name);
  return c && c.textContent.trim() !== '' ? Number(c.textContent) : undefined;
};
const clamp01 = (v) => Math.min(1, Math.max(0, v));

/** One part's measures, in the order they are written, each holding its notes in quarter notes from its start. */
function readPart(part) {
  let divisions = 1;
  let staves = 1;
  let velocity = DEFAULT_VELOCITY;
  let ending = null; // the ending numbers of the measures being read, while inside a first/second ending
  const measures = [];
  for (const measure of kids(part, 'measure')) {
    const m = { length: 0, notes: [], tempos: [], forward: false, backward: 0, ending };
    let pos = 0;
    let chordAt = 0;
    let closeEnding = false;
    const sound = (el) => {
      const tempo = Number(el.getAttribute('tempo'));
      if (tempo > 0) m.tempos.push({ at: pos, bpm: tempo });
      const dynamics = Number(el.getAttribute('dynamics'));
      if (dynamics > 0) velocity = clamp01((dynamics / 100) * FORTE);
      return tempo > 0;
    };
    for (const el of measure.children) {
      switch (el.localName) {
        case 'attributes':
          divisions = num(el, 'divisions') ?? divisions;
          staves = Math.max(staves, num(el, 'staves') ?? 1);
          break;
        case 'backup':
          pos -= (num(el, 'duration') ?? 0) / divisions;
          break;
        case 'forward':
          pos += (num(el, 'duration') ?? 0) / divisions;
          m.length = Math.max(m.length, pos);
          break;
        case 'sound':
          sound(el);
          break;
        case 'direction': {
          const sounds = kids(el, 'sound').map(sound);
          if (!sounds.includes(true)) {
            // No playback tempo: read the metronome mark (♩ = 72, or ♪ = 144 and so on).
            const metronome = el.getElementsByTagName('metronome')[0];
            const perMinute = metronome && num(metronome, 'per-minute');
            if (perMinute > 0) {
              const unit = { half: 2, quarter: 1, eighth: 0.5, whole: 4, '16th': 0.25 }[
                kid(metronome, 'beat-unit')?.textContent.trim()
              ];
              const dotted = kid(metronome, 'beat-unit-dot') ? 1.5 : 1;
              m.tempos.push({ at: pos, bpm: perMinute * (unit ?? 1) * dotted });
            }
          }
          const mark = el.getElementsByTagName('dynamics')[0]?.children[0]?.localName;
          if (mark in DYNAMICS) velocity = DYNAMICS[mark];
          break;
        }
        case 'barline': {
          const repeat = kid(el, 'repeat');
          if (repeat?.getAttribute('direction') === 'forward') m.forward = true;
          if (repeat?.getAttribute('direction') === 'backward') m.backward = Number(repeat.getAttribute('times')) || 2;
          const mark = kid(el, 'ending');
          if (mark?.getAttribute('type') === 'start') {
            ending = (mark.getAttribute('number') ?? '1')
              .split(/[,\s]+/)
              .filter(Boolean)
              .map(Number);
            m.ending = ending;
          } else if (mark) closeEnding = true;
          break;
        }
        case 'note': {
          const pitch = kid(el, 'pitch');
          const length = (num(el, 'duration') ?? 0) / divisions;
          const accent = el.getElementsByTagName('dynamics')[0]?.children[0]?.localName;
          const loud = Number(el.getAttribute('dynamics'));
          const noteVelocity =
            loud > 0 ? clamp01((loud / 100) * FORTE) : accent in ACCENTS ? ACCENTS[accent] : velocity;
          const note = (at, sounds) =>
            pitch &&
            !kid(el, 'cue') &&
            m.notes.push({
              pitch:
                ((num(pitch, 'octave') ?? 4) + 1) * 12 +
                STEPS[kid(pitch, 'step')?.textContent.trim()] +
                Math.round(num(pitch, 'alter') ?? 0),
              at,
              length: sounds,
              staff: num(el, 'staff') ?? 1,
              velocity: noteVelocity,
              tieStart: kids(el, 'tie').some((t) => t.getAttribute('type') === 'start'),
              tieStop: kids(el, 'tie').some((t) => t.getAttribute('type') === 'stop'),
            });
          if (kid(el, 'grace')) {
            note(pos - GRACE, GRACE); // a grace note takes no time of its own
            break;
          }
          if (!kid(el, 'chord')) {
            chordAt = pos;
            pos += length;
            m.length = Math.max(m.length, pos);
          }
          note(chordAt, length);
          break;
        }
      }
    }
    if (closeEnding) ending = null;
    measures.push(m);
  }
  return { measures, staves };
}

/**
 * The order measures are played in: each repeat taken as many times as it says, and each
 * first, second… ending played only on its pass. (D.C., D.S. and codas are played straight through.)
 */
export function playOrder(measures) {
  const order = [];
  const left = new Map(); // repeats still to take at each backward barline
  let back = 0;
  let pass = 1;
  let returning = false;
  for (let i = 0; i < measures.length; i++) {
    const m = measures[i];
    if (m.forward && !returning) [back, pass] = [i, 1];
    returning = false;
    if (m.ending && !m.ending.includes(pass)) continue;
    order.push(i);
    if (m.backward) {
      const remaining = left.get(i) ?? m.backward - 1;
      if (remaining > 0) {
        left.set(i, remaining - 1);
        [i, pass, returning] = [back - 1, pass + 1, true];
        continue;
      }
      back = i + 1;
      if (!measures[i + 1]?.ending) pass = 1;
    }
  }
  return order;
}

/** Seconds at a beat (in quarter notes), through the score's tempo changes. */
function clockOf(tempos) {
  const marks = [{ at: 0, bpm: tempos[0]?.at === 0 ? tempos[0].bpm : DEFAULT_TEMPO, seconds: 0 }];
  for (const t of tempos) {
    const last = marks[marks.length - 1];
    if (t.at === last.at) last.bpm = t.bpm;
    else marks.push({ at: t.at, bpm: t.bpm, seconds: last.seconds + ((t.at - last.at) * 60) / last.bpm });
  }
  return (beat) => {
    let k = marks.length - 1;
    while (k > 0 && marks[k].at > beat) k--;
    return marks[k].seconds + ((beat - marks[k].at) * 60) / marks[k].bpm;
  };
}

/** Joins tied notes into one held note. */
function joinTies(notes) {
  const open = new Map();
  const out = [];
  for (const n of notes.sort((a, b) => a.start - b.start)) {
    const key = `${n.part}:${n.pitch}`;
    const held = open.get(key);
    if (n.tieStop && held && Math.abs(held.end - n.start) < 1e-6) {
      held.end = n.end;
      if (!n.tieStart) open.delete(key);
      continue;
    }
    out.push(n);
    if (n.tieStart) open.set(key, n);
  }
  return out;
}

/** Notes, in seconds, from the text of a MusicXML score. */
export function readScore(text) {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  const root = doc.documentElement;
  if (doc.getElementsByTagName('parsererror').length) throw new Error('not valid XML');
  if (root.localName === 'score-timewise') throw new Error('time-wise MusicXML is not supported');
  if (root.localName !== 'score-partwise') throw new Error('not a MusicXML score');

  const all = kids(root, 'part').map(readPart);
  // A score with a piano (a part on two staves) is read for its piano alone: a vocal line or other
  // instruments would only double what the hands play. Otherwise every part is read.
  const pianos = all.filter((p) => p.staves >= 2);
  const parts = pianos.length ? pianos : all;
  const handOf = (part, staff) => {
    if (part.staves >= 2) return staff === 1 ? 'right' : staff === 2 ? 'left' : undefined;
    if (parts.length === 2) return part === parts[0] ? 'right' : 'left'; // two one-staff parts: a piano split in two
    return undefined;
  };

  const count = Math.max(...parts.map((p) => p.measures.length), 0);
  const lengths = Array.from({ length: count }, (_, i) => Math.max(0, ...parts.map((p) => p.measures[i]?.length ?? 0)));
  const order = playOrder(parts[0]?.measures ?? []);
  const tempos = [];
  const notes = [];
  let beat = 0;
  for (const i of order) {
    parts.forEach((part, p) => {
      const m = part.measures[i];
      if (!m) return;
      for (const t of m.tempos) tempos.push({ at: beat + t.at, bpm: t.bpm });
      for (const n of m.notes) {
        notes.push({ ...n, part: p, start: beat + n.at, end: beat + n.at + n.length, hand: handOf(part, n.staff) });
      }
    });
    beat += lengths[i];
  }
  const seconds = clockOf(tempos.sort((a, b) => a.at - b.at));
  return joinTies(notes).map((n) => ({
    pitch: n.pitch,
    start: seconds(n.start),
    end: seconds(n.end),
    velocity: n.velocity,
    ...(n.hand && { hand: n.hand }),
  }));
}

/** The score inside a compressed .mxl: the file its container names, or else its first MusicXML file. */
async function scoreInMxl(buffer) {
  const files = unzip(buffer);
  const container = files.get('META-INF/container.xml');
  let path;
  if (container) {
    const doc = new DOMParser().parseFromString(decodeText(await container()), 'application/xml');
    path = doc.getElementsByTagName('rootfile')[0]?.getAttribute('full-path');
  }
  path ??= [...files.keys()].find((name) => /\.(musicxml|xml)$/i.test(name) && !name.startsWith('META-INF/'));
  if (!path || !files.has(path)) throw new Error('no score inside the .mxl file');
  return decodeText(await files.get(path)());
}

/** Text in the encoding its byte-order mark names (some exporters write UTF-16), else UTF-8. */
function decodeText(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder('utf-16le').decode(bytes);
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder('utf-16be').decode(bytes);
  return new TextDecoder().decode(bytes);
}

export async function readMusicXml(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const zipped = bytes[0] === 0x50 && bytes[1] === 0x4b; // "PK"
  return readScore(zipped ? await scoreInMxl(bytes.buffer) : decodeText(bytes));
}
