// Camera angles the person saves, kept in this browser, one list per rig (each set of ready-made
// angles: Marble Walk's floor, the piano, the galaxy).
import { useCallback, useState } from 'react';

const KEY = 'lumora:camera-presets';

function readAll() {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return all && typeof all === 'object' ? all : {};
  } catch (error) {
    console.error('Saved camera angles could not be read', error);
    return {};
  }
}

/** A saved angle's values, kept only if they are numbers (the stored list could be anything). */
const clean = (p) =>
  typeof p?.name === 'string' && [p.turn, p.tilt, p.zoom].every(Number.isFinite)
    ? { name: p.name.slice(0, 40), turn: p.turn, tilt: p.tilt, zoom: p.zoom }
    : null;

export function presetsFor(rigId) {
  const list = readAll()[rigId];
  return Array.isArray(list) ? list.map(clean).filter(Boolean) : [];
}

function write(rigId, list) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...readAll(), [rigId]: list }));
    return true;
  } catch (error) {
    console.error('The camera angle could not be saved', error);
    return false;
  }
}

/** The saved angles for a rig, and saving (a same-named one is replaced) and deleting them. */
export function usePresets(rigId) {
  const [, refresh] = useState(0); // re-read after a change
  const presets = presetsFor(rigId);
  const save = useCallback(
    (name, { turn, tilt, zoom }) => {
      const kept = presetsFor(rigId).filter((p) => p.name !== name);
      const ok = write(rigId, [...kept, { name, turn, tilt, zoom }]);
      refresh((v) => v + 1);
      return ok;
    },
    [rigId],
  );
  const remove = useCallback(
    (name) => {
      write(
        rigId,
        presetsFor(rigId).filter((p) => p.name !== name),
      );
      refresh((v) => v + 1);
    },
    [rigId],
  );
  return { presets, save, remove };
}
