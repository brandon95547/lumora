// Staff: the song lights up a grand staff laid on a dark marble floor (Marble Walk), seen flat from
// above (2D) or from a camera standing on the floor (3D).
import { renderFloor } from './floor.js';
import { marbleWalk } from './walk.js';

export const staffKind = {
  id: 'staff',
  name: 'Staff',
  description: 'Notes light up on a grand staff.',
  animations: [marbleWalk],
  render: renderFloor,
};
