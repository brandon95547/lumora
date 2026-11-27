// Every animation style, in the order the picker shows them.
import { constellation } from './constellation.js';
import { glowLane } from './glowLane.js';
import { ribbon } from './ribbon.js';
import { ripple } from './ripple.js';

export const STYLES = [glowLane, ripple, constellation, ribbon];

export const styleById = (id) => STYLES.find((s) => s.id === id) ?? STYLES[0];
