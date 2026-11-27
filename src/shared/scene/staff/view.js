// The flat view of the staff: the 2D picture as laid out, with where its notes begin and end and
// how they fade at those edges.
export function flatView(layout) {
  const bounds = { staffLeft: layout.marginX, noteLeft: layout.noteLeft, noteRight: layout.noteRight };
  const span = layout.space * 2.5;
  return {
    depth: false,
    opacity: 1,
    glow: 1,
    ...bounds,
    project: (x, y) => ({ x, y, s: 1, fog: 1 }),
    fade: (x) => Math.max(0, Math.min(1, (x - bounds.noteLeft) / span, (bounds.noteRight - x) / span)),
  };
}
