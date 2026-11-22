// Guards and cameras: patrol routes, vision cones, chasing and investigating.
// A guard is a small state machine — patrol, investigate, chase — and a camera is a
// fixed eye that sweeps its cone back and forth.
import { GUARD, CAMERA } from './config.js';
import { angleDiff, distance, lineOfSight, moveCircle } from './geom.js';

export const GUARD_PATROL = 'patrol';
export const GUARD_INVESTIGATE = 'investigate';
export const GUARD_CHASE = 'chase';

/** A fresh guard on a patrol route; `def` comes from the floor layout. */
export function createGuard(def) {
  const first = def.waypoints[0];
  return {
    x: def.x,
    y: def.y,
    facing: 0,
    state: GUARD_PATROL,
    waypoints: def.waypoints.map(([x, y]) => ({ x, y })),
    waypointIndex: 1 % def.waypoints.length,
    pauseLeft: 0,
    investigateTarget: null,
    lookLeft: 0,
    seenPlayer: false,
  };
}

/** A fresh camera; `def` comes from the floor layout. */
export function createCamera(def) {
  return {
    x: def.x,
    y: def.y,
    baseAngle: def.baseAngle,
    angle: def.baseAngle,
    phase: 0,
    seenPlayer: false,
  };
}

/**
 * Can `eye` (a guard or camera at x,y facing `angle`, with `range` and
 * `halfAngle`) see the point (tx, ty) through `blockers`?
 */
export function canSee(x, y, angle, range, halfAngle, tx, ty, blockers) {
  const d = distance(x, y, tx, ty);
  if (d > range) return false;
  const toTarget = Math.atan2(ty - y, tx - x);
  if (angleDiff(toTarget, angle) > halfAngle) return false;
  return lineOfSight(x, y, tx, ty, blockers);
}

function stepTowards(guard, tx, ty, speed, dt, solids) {
  const d = distance(guard.x, guard.y, tx, ty);
  if (d < 1) return true;
  const vx = ((tx - guard.x) / d) * speed * dt;
  const vy = ((ty - guard.y) / d) * speed * dt;
  const next = moveCircle(guard.x, guard.y, GUARD.radius, vx, vy, solids);
  guard.x = next.x;
  guard.y = next.y;
  guard.facing = Math.atan2(ty - guard.y, tx - guard.x);
  return d < speed * dt + 2;
}

/**
 * Advance one guard by dt. `world` carries the player, the heat state and the
 * solids; `events` collects noise the guard reacts to. Returns nothing; the
 * guard's state, position and facing are updated in place.
 */
export function updateGuard(guard, dt, world, events) {
  const player = world.state.player;
  const blockers = world.solids;
  const seen = canSee(
    guard.x,
    guard.y,
    guard.facing,
    GUARD.visionRange,
    GUARD.visionHalfAngle,
    player.x,
    player.y,
    blockers,
  );
  guard.seenPlayer = seen && world.state.graceLeft <= 0;

  if (guard.state === GUARD_CHASE) {
    if (seen) {
      stepTowards(guard, player.x, player.y, GUARD.chaseSpeed, dt, world.solids);
      world.state.lastSeenAt = world.state.time;
    } else if (world.state.time - world.state.lastSeenAt > 4) {
      guard.state = GUARD_PATROL;
      guard.waypointIndex = nearestWaypoint(guard);
    } else {
      // Lost sight a moment ago: keep pushing to where the thief was last seen.
      stepTowards(guard, world.state.lastSeenX, world.state.lastSeenY, GUARD.chaseSpeed, dt, world.solids);
    }
    return;
  }

  if (guard.state === GUARD_INVESTIGATE) {
    const target = guard.investigateTarget;
    if (target && stepTowards(guard, target.x, target.y, GUARD.investigateSpeed, dt, world.solids)) {
      guard.lookLeft -= dt;
      guard.facing += dt * 1.8;
      if (guard.lookLeft <= 0) {
        guard.state = GUARD_PATROL;
        guard.investigateTarget = null;
        guard.waypointIndex = nearestWaypoint(guard);
      }
    }
    return;
  }

  // Patrol: walk the waypoints, pausing at each, and listen for noise.
  for (const noise of events.noise) {
    if (distance(guard.x, guard.y, noise.x, noise.y) < noise.radius) {
      guard.state = GUARD_INVESTIGATE;
      guard.investigateTarget = { x: noise.x, y: noise.y };
      guard.lookLeft = GUARD.investigateLook;
      return;
    }
  }
  if (guard.pauseLeft > 0) {
    guard.pauseLeft -= dt;
    guard.facing += dt * 0.6;
    return;
  }
  const target = guard.waypoints[guard.waypointIndex];
  if (stepTowards(guard, target.x, target.y, GUARD.patrolSpeed, dt, world.solids)) {
    guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
    guard.pauseLeft = GUARD.waypointPause;
  }
}

function nearestWaypoint(guard) {
  let best = 0;
  let bestD = Infinity;
  guard.waypoints.forEach((w, i) => {
    const d = distance(guard.x, guard.y, w.x, w.y);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

/** Advance one camera by dt: sweep its cone and check whether it sees the thief. */
export function updateCamera(camera, dt, world) {
  camera.phase += dt * CAMERA.sweepSpeed;
  camera.angle = camera.baseAngle + Math.sin(camera.phase) * CAMERA.sweep;
  const player = world.state.player;
  camera.seenPlayer =
    world.state.graceLeft <= 0 &&
    canSee(
      camera.x,
      camera.y,
      camera.angle,
      CAMERA.visionRange,
      CAMERA.visionHalfAngle,
      player.x,
      player.y,
      world.solids,
    );
}
