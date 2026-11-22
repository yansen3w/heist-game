// The three floors of the Marlow Gallery. Each floor is one room the thief crosses:
// border walls, pillars and crates to hide behind, guards on patrol routes, cameras
// sweeping the open floor, artifacts to lift, and an exit door that opens once the
// floor's loot is lifted. Floor 3 also holds the vault with the Velvet Diamond.
import { FIELD } from './config.js';

const WALL = 26;

/** A rectangle: { x, y, w, h }. */
function rect(x, y, w, h) {
  return { x, y, w, h };
}

function borderWalls() {
  return [
    rect(0, 0, FIELD.width, WALL),
    rect(0, FIELD.height - WALL, FIELD.width, WALL),
    rect(0, 0, WALL, FIELD.height),
    rect(FIELD.width - WALL, 0, WALL, FIELD.height),
  ];
}

export const FLOORS = [
  {
    name: 'Floor 1 — The Lobby',
    hint: 'Lift all 3 artifacts to open the exit. Stay out of the cones.',
    playerStart: { x: 90, y: 640 },
    exit: { x: 1140, y: 58, w: 64, h: 18 },
    vault: null,
    loot: [
      { x: 330, y: 150, kind: 'vase' },
      { x: 640, y: 420, kind: 'coin' },
      { x: 1010, y: 200, kind: 'gem' },
    ],
    obstacles: [
      rect(300, 250, 90, 60), // crate stack
      rect(560, 120, 70, 70), // pillar
      rect(820, 380, 110, 60), // display case
      rect(180, 420, 70, 70), // pillar
      rect(1020, 480, 90, 60), // crate stack
    ],
    guards: [
      { x: 420, y: 360, waypoints: [[420, 360], [420, 560], [760, 560], [760, 360]] },
      { x: 980, y: 420, waypoints: [[980, 420], [980, 140], [700, 140]] },
    ],
    cameras: [
      { x: 640, y: 54, baseAngle: Math.PI / 2 },
    ],
    paintings: [
      { x: 300, y: 50, w: 90, h: 14 },
      { x: 900, y: 50, w: 110, h: 14 },
      { x: WALL, y: 300, w: 14, h: 90 },
    ],
  },
  {
    name: 'Floor 2 — The Gallery',
    hint: 'Two cameras now. The far wall hides the fourth artifact.',
    playerStart: { x: 90, y: 640 },
    exit: { x: 1140, y: 58, w: 64, h: 18 },
    vault: null,
    loot: [
      { x: 280, y: 130, kind: 'gem' },
      { x: 620, y: 300, kind: 'vase' },
      { x: 950, y: 130, kind: 'coin' },
      { x: 1120, y: 520, kind: 'gem' },
    ],
    obstacles: [
      rect(240, 300, 70, 70), // pillar
      rect(480, 130, 110, 60), // display case
      rect(700, 430, 90, 60), // crate stack
      rect(900, 300, 70, 70), // pillar
      rect(150, 480, 110, 60), // display case
      rect(1050, 260, 70, 70), // pillar
    ],
    guards: [
      { x: 380, y: 200, waypoints: [[380, 200], [380, 520], [620, 520], [620, 200]] },
      { x: 880, y: 500, waypoints: [[880, 500], [880, 200], [1100, 200], [1100, 500]] },
      { x: 640, y: 620, waypoints: [[640, 620], [300, 620], [300, 420]] },
    ],
    cameras: [
      { x: 420, y: 54, baseAngle: Math.PI / 2 },
      { x: 900, y: FIELD.height - WALL - 4, baseAngle: -Math.PI / 2 },
    ],
    paintings: [
      { x: 200, y: 50, w: 110, h: 14 },
      { x: 700, y: 50, w: 90, h: 14 },
      { x: 1050, y: 50, w: 90, h: 14 },
      { x: FIELD.width - WALL - 14, y: 320, w: 14, h: 110 },
    ],
  },
  {
    name: 'Floor 3 — The Vault',
    hint: 'Hold E at the vault to crack it, then reach the exit. The Diamond is 500.',
    playerStart: { x: 90, y: 640 },
    exit: { x: 1140, y: 58, w: 64, h: 18 },
    vault: { x: 640, y: 110 },
    loot: [
      { x: 300, y: 150, kind: 'coin' },
      { x: 980, y: 150, kind: 'vase' },
      { x: 320, y: 520, kind: 'gem' },
      { x: 960, y: 520, kind: 'coin' },
    ],
    obstacles: [
      rect(260, 300, 70, 70), // pillar
      rect(950, 300, 70, 70), // pillar
      rect(480, 420, 110, 60), // display case
      rect(690, 420, 110, 60), // display case
      rect(150, 220, 90, 60), // crate stack
      rect(1040, 220, 90, 60), // crate stack
    ],
    guards: [
      { x: 420, y: 260, waypoints: [[420, 260], [420, 560], [860, 560], [860, 260]] },
      { x: 640, y: 340, waypoints: [[640, 340], [300, 340], [300, 600], [980, 600], [980, 340]] },
      { x: 1080, y: 420, waypoints: [[1080, 420], [1080, 150], [760, 150]] },
    ],
    cameras: [
      { x: 340, y: 54, baseAngle: Math.PI / 2 },
      { x: 940, y: 54, baseAngle: Math.PI / 2 },
      { x: 640, y: FIELD.height - WALL - 4, baseAngle: -Math.PI / 2 },
    ],
    paintings: [
      { x: 420, y: 50, w: 110, h: 14 },
      { x: 760, y: 50, w: 110, h: 14 },
      { x: WALL, y: 180, w: 14, h: 110 },
      { x: FIELD.width - WALL - 14, y: 180, w: 14, h: 110 },
    ],
  },
];

export function floorWalls() {
  return borderWalls();
}
