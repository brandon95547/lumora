// How a video's title is set: its typeface and size. Each typeface's file is fetched the first time
// it is chosen; until it arrives the title is drawn in the clean face.
import grenzeGotisch from './fonts/grenze-gotisch.woff2';
import newRocker from './fonts/new-rocker.ttf';
import pirataOne from './fonts/pirata-one.ttf';
import unifrakturMaguntia from './fonts/unifraktur-maguntia.ttf';

const CLEAN_STACK = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';

export const TITLE_FONTS = [
  { id: 'grenze', label: 'Grenze Gotisch', family: 'Lumora Grenze Gotisch', weight: 700, url: grenzeGotisch },
  { id: 'fraktur', label: 'Fraktur', family: 'Lumora UnifrakturMaguntia', weight: 400, url: unifrakturMaguntia },
  { id: 'pirata', label: 'Pirata One', family: 'Lumora Pirata One', weight: 400, url: pirataOne },
  { id: 'rocker', label: 'New Rocker', family: 'Lumora New Rocker', weight: 400, url: newRocker },
  { id: 'clean', label: 'Clean', family: null, weight: 600 },
];

/** Sizes as a multiple of the format's title size. */
export const TITLE_SIZES = [
  { id: 'small', label: 'Small', scale: 0.75 },
  { id: 'medium', label: 'Medium', scale: 1 },
  { id: 'large', label: 'Large', scale: 1.3 },
  { id: 'huge', label: 'Huge', scale: 1.65 },
];

export const titleFontById = (id) => TITLE_FONTS.find((f) => f.id === id) ?? TITLE_FONTS[0];
export const titleSizeById = (id) => TITLE_SIZES.find((s) => s.id === id) ?? TITLE_SIZES[2];
export const CLEAN_FONT = titleFontById('clean');

/** The canvas font for a title face at a size in pixels. */
export const titleCss = (font, px) =>
  `${font.weight} ${Math.round(px)}px ${font.family ? `"${font.family}", serif` : CLEAN_STACK}`;

const loading = new Map();

/** Fetches a title face once; resolves when the canvas can draw with it. */
export function loadTitleFont(font) {
  if (!font.url) return Promise.resolve(font);
  if (!loading.has(font.id)) {
    const face = new FontFace(font.family, `url(${font.url})`, { weight: String(font.weight) });
    const ready = face.load().then((loaded) => {
      document.fonts.add(loaded);
      return font;
    });
    ready.catch(() => loading.delete(font.id)); // tried again the next time it is chosen
    loading.set(font.id, ready);
  }
  return loading.get(font.id);
}
