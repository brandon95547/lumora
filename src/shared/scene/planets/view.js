// The camera on the solar system: in 2D straight down on the orbits, like a chart of the heavens; in
// 3D circling the sun at an angle. Either way the whole system out to Neptune fits the frame.
import { aim, perspective } from '../view.js';
import { OUTER } from './system.js';

/** Ready-made camera angles. Turn circles the sun; tilt raises the camera over the orbits. */
export const PLANET_ANGLES = [
  { id: 'orbit', label: 'Orbit', turn: 0, tilt: 36, zoom: 1 },
  { id: 'edge', label: 'Edge', turn: 20, tilt: 9, zoom: 1.1 },
  { id: 'above', label: 'Above', turn: 0, tilt: 62, zoom: 1 },
  { id: 'inner', label: 'Inner', turn: -25, tilt: 32, zoom: 2.4 },
];

/** `flatZoom` comes in on the 2D chart, toward the sun. */
export function planetView(layout, camera, t, flatZoom = 1) {
  const { yaw, pitch } = camera ? aim(camera, t) : { yaw: 0, pitch: Math.PI / 2 };
  // Seen low, the orbits flatten and the width decides the fit; seen from above, the height does. A
  // phone frame is narrow, so there Neptune's orbit may brush its sides.
  const tall = Math.max(0.3, Math.sin(pitch));
  const fit = Math.min(layout.width * (layout.portrait ? 0.52 : 0.47), (layout.height * 0.36) / tall) / OUTER;
  return perspective({
    pivot: [0, 0, 0],
    anchor: [layout.width / 2, layout.height * (layout.portrait ? 0.56 : 0.57)],
    distance: camera ? OUTER * 2.8 : OUTER * 40, // 2D: far and long, nearly flat
    zoom: fit * (camera ? camera.zoom : flatZoom),
    yaw,
    pitch,
    fogFrom: 3,
    fogTo: 6,
  });
}
