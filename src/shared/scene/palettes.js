// Color schemes. `lit` holds two colors (right hand, left hand) or twelve (one per pitch class).
// `blend` is how glows mix: 'lighter' adds light on dark grounds; light grounds paint over.

export const PALETTES = [
  {
    id: 'midnight',
    name: 'Midnight',
    background: ['#0d1638', '#03050f'],
    staff: 'rgba(190, 205, 255, 0.42)',
    ink: '#e6ecff',
    idle: 'rgba(170, 190, 255, 0.5)',
    lit: ['#7fe6ff', '#b592ff'],
    blend: 'lighter',
  },
  {
    id: 'ember',
    name: 'Ember',
    background: ['#22100a', '#060202'],
    staff: 'rgba(255, 205, 160, 0.38)',
    ink: '#ffeedd',
    idle: 'rgba(255, 200, 150, 0.45)',
    lit: ['#ffc15a', '#ff6a3d'],
    blend: 'lighter',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    background: ['#05232a', '#01080b'],
    staff: 'rgba(170, 255, 230, 0.36)',
    ink: '#e3fff6',
    idle: 'rgba(150, 240, 220, 0.45)',
    lit: ['#5effc4', '#7aa6ff'],
    blend: 'lighter',
  },
  {
    id: 'neon',
    name: 'Neon',
    background: ['#14001f', '#000000'],
    staff: 'rgba(255, 170, 255, 0.36)',
    ink: '#fbe8ff',
    idle: 'rgba(240, 160, 255, 0.45)',
    lit: ['#ff42d9', '#2ef2ff'],
    blend: 'lighter',
  },
  {
    id: 'prism',
    name: 'Prism',
    background: ['#0c0c14', '#000000'],
    staff: 'rgba(255, 255, 255, 0.34)',
    ink: '#f4f4f8',
    idle: 'rgba(255, 255, 255, 0.4)',
    lit: [
      '#ff5a5a',
      '#ff8a3d',
      '#ffbe3d',
      '#ffe53d',
      '#b5f23d',
      '#4df07a',
      '#3de8d0',
      '#3dc0ff',
      '#4d7dff',
      '#8a5cff',
      '#c95cff',
      '#ff5cc8',
    ],
    blend: 'lighter',
  },
  {
    id: 'ivory',
    name: 'Ivory',
    background: ['#f8f1e3', '#e6d7bb'],
    staff: 'rgba(60, 40, 20, 0.6)',
    ink: '#2b1d10',
    idle: 'rgba(70, 48, 26, 0.42)',
    lit: ['#c8102e', '#1e4fd6'],
    blend: 'source-over',
  },
];

export const paletteById = (id) => PALETTES.find((p) => p.id === id) ?? PALETTES[0];

/** The lit color of a note: by pitch class when the palette has twelve, else by hand. */
export function litColor(palette, note) {
  return palette.lit.length === 12 ? palette.lit[note.pitch % 12] : palette.lit[note.hand === 'right' ? 0 : 1];
}
