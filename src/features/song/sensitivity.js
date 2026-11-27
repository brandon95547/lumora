// How eagerly the note model reports notes: thresholds for Basic Pitch's note extraction.
export const SENSITIVITY = [
  { id: 'fewer', label: 'Fewer', onset: 0.6, frame: 0.4, minFrames: 11 },
  { id: 'balanced', label: 'Balanced', onset: 0.5, frame: 0.3, minFrames: 8 },
  { id: 'more', label: 'More', onset: 0.35, frame: 0.25, minFrames: 5 },
];

export const sensitivityById = (id) => SENSITIVITY.find((s) => s.id === id) ?? SENSITIVITY[1];
