import { expect, it } from 'vitest';
import { clock } from './time.js';

it('formats minutes and seconds', () => {
  expect(clock(0)).toBe('0:00');
  expect(clock(83.4)).toBe('1:23');
  expect(clock(-2)).toBe('0:00');
});
