// A song's notes placed on the grand staff for one format: computed once, then read every frame.
import { firstStartingAt } from '../notes.js';
import { layoutFor, staffY } from './staff/layout.js';
import { estimateKey, ledgerLines, placePitch } from './staff/pitch.js';

const CHORD_WINDOW = 0.035; // onsets this close are drawn as one chord

/** Notes a step apart in one chord sit side by side, as engravers set them, instead of overlapping. */
function offsetSeconds(items, radius) {
  let i = 0;
  while (i < items.length) {
    let j = i + 1;
    while (j < items.length && items[j].start - items[i].start < CHORD_WINDOW) j++;
    for (const clef of ['treble', 'bass']) {
      const chord = items
        .slice(i, j)
        .filter((n) => n.clef === clef)
        .sort((a, b) => a.offset - b.offset);
      for (let k = 1; k < chord.length; k++) {
        if (chord[k].offset - chord[k - 1].offset === 1 && chord[k - 1].dx === 0) chord[k].dx = radius * 1.8;
      }
    }
    i = j;
  }
}

export function prepareScene(notes, format, duration) {
  const layout = layoutFor(format);
  const key = estimateKey(notes);
  const items = notes.map((note, index) => {
    const place = placePitch(note.pitch, key.preferFlats);
    return {
      ...note,
      ...place,
      index,
      dx: 0,
      y: staffY(layout, place.clef, place.offset),
      ledgers: ledgerLines(place.offset).map((o) => staffY(layout, place.clef, o)),
    };
  });
  offsetSeconds(items, layout.radius);
  const longest = items.reduce((m, n) => Math.max(m, n.end - n.start), 0);
  const last = items.reduce((m, n) => Math.max(m, n.end), 0);
  return { layout, key, items, longest, duration: Math.max(duration ?? 0, last) };
}

/** Notes that may be visible between two times: started before `to`, still sounding (or fading) after `from`. */
export function notesBetween(scene, from, to) {
  const first = firstStartingAt(scene.items, from - scene.longest);
  const out = [];
  for (let i = first; i < scene.items.length && scene.items[i].start <= to; i++) {
    if (scene.items[i].end >= from || scene.items[i].start >= from) out.push(scene.items[i]);
  }
  return out;
}
