// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { playOrder, readScore } from './musicxml.js';

const score = (parts) => `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0"><part-list>${parts.map((_, i) => `<score-part id="P${i}"><part-name>P${i}</part-name></score-part>`).join('')}</part-list>
${parts.map((measures, i) => `<part id="P${i}">${measures.map((m, k) => `<measure number="${k + 1}">${m}</measure>`).join('')}</part>`).join('')}
</score-partwise>`;

const note = (step, octave, duration, extra = '') =>
  `<note><pitch><step>${step}</step><octave>${octave}</octave></pitch><duration>${duration}</duration>${extra}</note>`;
const piano = '<attributes><divisions>2</divisions><staves>2</staves></attributes>';
const tempo = (bpm) => `<direction><sound tempo="${bpm}"/></direction>`;

describe('readScore', () => {
  it('gives each note its time from the tempo, and its hand from its staff', () => {
    // At 60 bpm a quarter note (2 divisions) is a second.
    const notes = readScore(
      score([
        [
          piano +
            tempo(60) +
            note('E', 5, 2, '<staff>1</staff>') +
            note('G', 5, 2, '<chord/><staff>1</staff>') +
            note('D', 5, 2, '<staff>1</staff>') +
            '<backup><duration>4</duration></backup>' +
            note('C', 3, 4, '<staff>2</staff>'),
        ],
      ]),
    );
    expect(notes).toEqual([
      { pitch: 76, start: 0, end: 1, velocity: 0.7, hand: 'right' },
      { pitch: 79, start: 0, end: 1, velocity: 0.7, hand: 'right' },
      { pitch: 48, start: 0, end: 2, velocity: 0.7, hand: 'left' },
      { pitch: 74, start: 1, end: 2, velocity: 0.7, hand: 'right' },
    ]);
  });

  it('keeps a left-hand note above middle C in the left hand', () => {
    const [n] = readScore(score([[piano + note('G', 4, 2, '<staff>2</staff>')]]));
    expect(n.hand).toBe('left');
  });

  it('reads sharps, flats, rests, ties and the default tempo', () => {
    const notes = readScore(
      score([
        [
          '<attributes><divisions>1</divisions></attributes>' +
            '<note><rest/><duration>1</duration></note>' +
            '<note><pitch><step>F</step><alter>1</alter><octave>4</octave></pitch><duration>1</duration><tie type="start"/></note>',
          '<note><pitch><step>F</step><alter>1</alter><octave>4</octave></pitch><duration>1</duration><tie type="stop"/></note>' +
            '<note><pitch><step>B</step><alter>-1</alter><octave>3</octave></pitch><duration>1</duration></note>',
        ],
      ]),
    );
    // 120 bpm: half a second a quarter note. The tied F♯ is one note held across the bar.
    expect(notes.map((n) => [n.pitch, n.start, n.end])).toEqual([
      [66, 0.5, 1.5],
      [58, 1.5, 2],
    ]);
    expect(notes[0].hand).toBeUndefined();
  });

  it('reads the piano alone when the score has other parts too', () => {
    const voice = ['<attributes><divisions>1</divisions></attributes>' + note('A', 4, 1)];
    const notes = readScore(score([voice, [piano + note('C', 4, 2, '<staff>1</staff>')]]));
    expect(notes.map((n) => n.pitch)).toEqual([60]);
  });

  it('takes two one-staff parts as the right and left hands', () => {
    const div = '<attributes><divisions>1</divisions></attributes>';
    const notes = readScore(score([[div + note('C', 5, 1)], [div + note('C', 3, 1)]]));
    expect(notes.map((n) => [n.pitch, n.hand])).toEqual([
      [72, 'right'],
      [48, 'left'],
    ]);
  });

  it('follows a tempo change and a dynamic', () => {
    const notes = readScore(
      score([
        [
          '<attributes><divisions>1</divisions></attributes>' + tempo(60) + note('C', 4, 1),
          tempo(120) +
            '<direction><direction-type><dynamics><ff/></dynamics></direction-type></direction>' +
            note('D', 4, 1),
        ],
      ]),
    );
    expect(notes.map((n) => [n.start, n.end, n.velocity])).toEqual([
      [0, 1, 0.7],
      [1, 1.5, 0.9],
    ]);
  });

  it('refuses a file that is not a score', () => {
    expect(() => readScore('<html></html>')).toThrow();
    expect(() => readScore('not xml')).toThrow();
  });
});

describe('playOrder', () => {
  const m = (props = {}) => ({ forward: false, backward: 0, ending: null, ...props });

  it('plays a repeat twice', () => {
    expect(playOrder([m(), m({ forward: true }), m({ backward: 2 }), m()])).toEqual([0, 1, 2, 1, 2, 3]);
  });

  it('plays first and second endings on their passes', () => {
    const measures = [m(), m({ ending: [1], backward: 2 }), m({ ending: [2] }), m()];
    expect(playOrder(measures)).toEqual([0, 1, 0, 2, 3]);
  });

  it('takes a repeat as many times as it says', () => {
    expect(playOrder([m({ backward: 3 }), m()])).toEqual([0, 0, 0, 1]);
  });
});
