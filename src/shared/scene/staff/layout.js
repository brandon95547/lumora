// Where everything sits in a frame of a given format, in output pixels.

/** Half-spaces → pixels: the y of an offset on a clef's staff. */
export function staffY(layout, clef, offset) {
  return layout.bottomLine[clef] - (offset * layout.space) / 2;
}

export function layoutFor({ width, height }) {
  const portrait = height > width;
  const space = portrait ? 48 : 40; // one staff space
  const grandHeight = 15 * space; // treble (4) + between staves (7) + bass (4)
  const center = height * (portrait ? 0.53 : 0.56);
  const trebleTop = center - grandHeight / 2;
  const bassTop = trebleTop + 11 * space;
  const marginX = portrait ? 56 : 120;
  const noteLeft = marginX + space * 5;
  const noteRight = width - marginX;
  const noteWidth = noteRight - noteLeft;
  const playheadX = noteLeft + noteWidth * (portrait ? 0.24 : 0.2);
  return {
    width,
    height,
    portrait,
    space,
    radius: space * 0.62,
    marginX,
    trebleTop,
    bassTop,
    bottomLine: { treble: trebleTop + 4 * space, bass: bassTop + 4 * space },
    grandTop: trebleTop,
    grandBottom: bassTop + 4 * space,
    noteLeft,
    noteRight,
    // Scrolling styles: notes travel right to left and light at the playhead.
    playheadX,
    pixelsPerSecond: portrait ? 260 : 330,
    // The title sits at the top: its top edge here, at this size (Medium; the size menu scales it).
    titleTop: height * (portrait ? 0.11 : 0.085),
    titleSize: portrait ? 92 : 76,
  };
}
