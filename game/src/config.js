// The Velvet Vault — tuning numbers and colours, all in one place. The playfield is
// a fixed 1280x720 logical area; the renderer scales it to the window, so no rule
// below depends on the screen size.
export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 13,
  walkSpeed: 178,
  sneakSpeed: 90,
  /** Noise radius in pixels while walking; sneaking is much quieter. */
  walkNoise: 120,
  sneakNoise: 32,
  /** Seconds between footstep sounds while moving. */
  stepInterval: 0.34,
  /** Seconds of grace after being caught and sent back to the start. */
  respawnGrace: 2,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 74,
  chaseSpeed: 155,
  investigateSpeed: 108,
  /** Vision range in pixels. */
  visionRange: 200,
  /** Half-angle of the vision cone, in radians. */
  visionHalfAngle: 0.6,
  /** Seconds a guard waits at each patrol waypoint. */
  waypointPause: 1.1,
  /** Seconds of looking around at an investigated spot before giving up. */
  investigateLook: 2.2,
  /** Heat fills at this rate per second while a guard sees the thief. */
  detectRate: 1.2,
  /** Heat drains at this rate per second while nobody sees the thief. */
  decayRate: 0.4,
};

export const CAMERA = {
  /** Vision range in pixels. */
  visionRange: 235,
  /** Half-angle of the camera's vision cone, in radians. */
  visionHalfAngle: 0.48,
  /** Heat fills at this rate per second while a camera sees the thief. */
  detectRate: 0.85,
  /** How far the camera sweeps, in radians either side of its base angle. */
  sweep: 0.7,
  /** Sweep speed, radians per second. */
  sweepSpeed: 0.55,
};

export const LIVES = 3;
/** localStorage key for the best getaway score. */
export const BEST_KEY = 'velvet-vault-best';
export const LOOT_POINTS = 100;
export const VAULT_POINTS = 500;
export const FLOOR_POINTS = 250;

export const VAULT = {
  /** Seconds holding E beside the vault to crack it open. */
  channelSeconds: 2,
  radius: 48,
};

export const EXIT = { width: 64, height: 18 };

export const COLOURS = {
  floor: '#2b2118',
  floorTile: '#33291d',
  wall: '#171310',
  wallTop: '#3a2f26',
  pillar: '#4a3b2c',
  crate: '#5d4a2f',
  rope: '#8e1f2f',
  gold: '#f5c542',
  carpet: '#5c1f28',
  dark: '#0d0a08',
};
