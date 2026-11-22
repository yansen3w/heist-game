// The world: one thief, the guards and cameras, the loot, the vault and the exit.
// Fixed-step simulation; the renderer only paints what this module computes.
import {
  CAMERA,
  FIELD,
  FLOOR_POINTS,
  GUARD,
  LOOT_POINTS,
  LIVES,
  PLAYER,
  STEP,
  VAULT,
  VAULT_POINTS,
} from './config.js';
import { distance, moveCircle, pointInRect } from './geom.js';
import { FLOORS, floorWalls } from './level.js';
import { createCamera, createGuard, GUARD_CHASE, updateCamera, updateGuard } from './guards.js';

export const EVENT_LOOT = 'loot';
export const EVENT_VAULT = 'vault';
export const EVENT_FLOOR = 'floor';
export const EVENT_WIN = 'win';
export const EVENT_OVER = 'over';
export const EVENT_ALARM = 'alarm';
export const EVENT_CAUGHT = 'caught';
export const EVENT_STEP = 'step';

export function createWorld(random) {
  const world = {
    random,
    state: null,
    solids: [],
    events: [],
  };
  world.reset = () => resetWorld(world);
  world.setupFloor = (index) => setupFloor(world, index);
  world.update = (input, dt) => updateWorld(world, input, dt);
  world.reset();
  return world;
}

function freshState() {
  return {
    floorIndex: 0,
    floor: null,
    player: { x: 0, y: 0, facing: -Math.PI / 2, sneaking: false, moving: false },
    clickTarget: null,
    guards: [],
    cameras: [],
    heat: 0,
    alarm: false,
    alarmLeft: 0,
    lastSeenAt: -100,
    lastSeenX: 0,
    lastSeenY: 0,
    lives: LIVES,
    score: 0,
    loot: 0,
    time: 0,
    graceLeft: 0,
    exitOpen: false,
    vaultChannel: 0,
    message: '',
    messageLeft: 0,
    over: false,
    won: false,
    stepLeft: 0,
  };
}

function resetWorld(world) {
  world.state = freshState();
  setupFloor(world, 0);
}

function setupFloor(world, index) {
  const state = world.state;
  const def = FLOORS[index];
  state.floorIndex = index;
  state.floor = {
    name: def.name,
    hint: def.hint,
    exit: { ...def.exit },
    vault: def.vault ? { x: def.vault.x, y: def.vault.y, opened: false } : null,
    loot: def.loot.map((item) => ({ ...item, taken: false })),
    obstacles: def.obstacles.map((r) => ({ ...r })),
    paintings: def.paintings.map((r) => ({ ...r })),
    walls: floorWalls(),
  };
  world.solids = [...state.floor.walls, ...state.floor.obstacles];
  state.player.x = def.playerStart.x;
  state.player.y = def.playerStart.y;
  state.player.facing = -Math.PI / 2;
  state.clickTarget = null;
  state.guards = def.guards.map(createGuard);
  state.cameras = def.cameras.map(createCamera);
  state.heat = 0;
  state.alarm = false;
  state.alarmLeft = 0;
  state.lastSeenAt = -100;
  state.exitOpen = false;
  state.vaultChannel = 0;
  state.graceLeft = 0;
  state.message = def.name;
  state.messageLeft = 2.6;
}

function say(state, text, seconds = 2.2) {
  state.message = text;
  state.messageLeft = seconds;
}

function updateWorld(world, input, dt) {
  const state = world.state;
  if (state.over || state.won) return;
  let remaining = dt;
  while (remaining > 0) {
    const step = Math.min(remaining, STEP);
    stepWorld(world, input, step);
    remaining -= step;
  }
}

function stepWorld(world, input, dt) {
  const state = world.state;
  state.time += dt;
  if (state.messageLeft > 0) state.messageLeft -= dt;
  if (state.graceLeft > 0) state.graceLeft -= dt;

  movePlayer(world, input, dt);

  const events = { noise: [] };
  if (state.player.moving && !state.player.sneaking) {
    state.stepLeft -= dt;
    if (state.stepLeft <= 0) {
      state.stepLeft = PLAYER.stepInterval;
      events.noise.push({ x: state.player.x, y: state.player.y, radius: PLAYER.walkNoise });
      world.events.push({ type: EVENT_STEP });
    }
  }

  let anyoneSees = false;
  for (const guard of state.guards) {
    updateGuard(guard, dt, world, events);
    if (guard.seenPlayer) anyoneSees = true;
  }
  for (const camera of state.cameras) {
    updateCamera(camera, dt, world);
    if (camera.seenPlayer) anyoneSees = true;
  }

  // Heat: guards fill it, cameras fill it a little slower, quiet drains it.
  let fill = 0;
  for (const guard of state.guards) if (guard.seenPlayer) fill += GUARD.detectRate;
  for (const camera of state.cameras) if (camera.seenPlayer) fill += CAMERA.detectRate;
  if (fill > 0) {
    state.heat = Math.min(1, state.heat + fill * dt);
    state.lastSeenAt = state.time;
    state.lastSeenX = state.player.x;
    state.lastSeenY = state.player.y;
  } else {
    state.heat = Math.max(0, state.heat - GUARD.decayRate * dt);
  }

  if (state.heat >= 1 && !state.alarm) {
    state.alarm = true;
    state.alarmLeft = 6;
    for (const guard of state.guards) guard.state = GUARD_CHASE;
    world.events.push({ type: EVENT_ALARM });
    say(state, 'SPOTTED! The alarm is up — break line of sight!', 2.6);
  }
  if (state.alarm) {
    state.alarmLeft -= dt;
    if (state.alarmLeft <= 0 && !anyoneSees) {
      state.alarm = false;
      state.heat = 0.45;
      for (const guard of state.guards) {
        if (guard.state === GUARD_CHASE) guard.state = 'patrol';
      }
      say(state, 'The alarm dies down… for now.', 2);
    } else if (state.alarmLeft <= 0) {
      state.alarmLeft = 2;
    }
  }

  // Caught: a chasing guard touches the thief.
  if (state.graceLeft <= 0) {
    for (const guard of state.guards) {
      if (guard.state === GUARD_CHASE && distance(guard.x, guard.y, state.player.x, state.player.y) < GUARD.radius + PLAYER.radius + 2) {
        caught(world);
        return;
      }
    }
  }

  collectLoot(world, input, dt);
  checkExit(world);
}

function movePlayer(world, input, dt) {
  const state = world.state;
  const player = state.player;
  let mx = 0;
  let my = 0;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (input.up) my -= 1;
  if (input.down) my += 1;
  if (mx === 0 && my === 0 && state.clickTarget) {
    const dx = state.clickTarget.x - player.x;
    const dy = state.clickTarget.y - player.y;
    const d = Math.hypot(dx, dy);
    if (d < 6) {
      state.clickTarget = null;
    } else {
      mx = dx / d;
      my = dy / d;
    }
  }
  const moving = mx !== 0 || my !== 0;
  player.moving = moving;
  player.sneaking = Boolean(input.sneak);
  if (!moving) return;
  const len = Math.hypot(mx, my) || 1;
  const speed = player.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
  const next = moveCircle(
    player.x,
    player.y,
    PLAYER.radius,
    (mx / len) * speed * dt,
    (my / len) * speed * dt,
    world.solids,
  );
  player.x = Math.max(PLAYER.radius + 2, Math.min(FIELD.width - PLAYER.radius - 2, next.x));
  player.y = Math.max(PLAYER.radius + 2, Math.min(FIELD.height - PLAYER.radius - 2, next.y));
  player.facing = Math.atan2(my, mx);
}

function collectLoot(world, input, dt) {
  const state = world.state;
  const player = state.player;
  for (const item of state.floor.loot) {
    if (!item.taken && distance(player.x, player.y, item.x, item.y) < PLAYER.radius + 16) {
      item.taken = true;
      state.loot += 1;
      state.score += LOOT_POINTS;
      world.events.push({ type: EVENT_LOOT });
      const left = state.floor.loot.filter((i) => !i.taken).length;
      say(state, left === 0 ? 'All artifacts lifted — the exit is open!' : `Artifact lifted — ${left} to go.`);
    }
  }
  const vault = state.floor.vault;
  if (vault && !vault.opened) {
    const near = distance(player.x, player.y, vault.x, vault.y) < VAULT.radius + PLAYER.radius + 10;
    if (near && input.crack) {
      state.vaultChannel += dt;
      if (state.vaultChannel >= VAULT.channelSeconds) {
        vault.opened = true;
        state.score += VAULT_POINTS;
        state.loot += 1;
        world.events.push({ type: EVENT_VAULT });
        say(state, 'The Velvet Diamond is yours — 500 points!', 2.6);
      }
    } else {
      state.vaultChannel = 0;
    }
  }
  const taken = state.floor.loot.filter((i) => !i.taken).length;
  const vaultDone = !vault || vault.opened;
  state.exitOpen = taken === 0 && vaultDone;
}

function checkExit(world) {
  const state = world.state;
  if (!state.exitOpen) return;
  const exit = state.floor.exit;
  if (!pointInRect(state.player.x, state.player.y, exit, 10)) return;
  state.score += FLOOR_POINTS;
  world.events.push({ type: EVENT_FLOOR });
  if (state.floorIndex + 1 >= FLOORS.length) {
    const bonus = Math.max(0, Math.round(1200 - state.time * 2));
    state.score += bonus;
    state.won = true;
    world.events.push({ type: EVENT_WIN });
    say(state, `CLEAN GETAWAY — time bonus ${bonus}`, 4);
  } else {
    setupFloor(world, state.floorIndex + 1);
  }
}

function caught(world) {
  const state = world.state;
  state.lives -= 1;
  world.events.push({ type: EVENT_CAUGHT });
  if (state.lives <= 0) {
    state.over = true;
    world.events.push({ type: EVENT_OVER });
    say(state, 'BUSTED — the gallery keeps its secrets.', 4);
    return;
  }
  const def = FLOORS[state.floorIndex];
  state.player.x = def.playerStart.x;
  state.player.y = def.playerStart.y;
  state.player.facing = -Math.PI / 2;
  state.clickTarget = null;
  state.heat = 0;
  state.alarm = false;
  state.alarmLeft = 0;
  for (const guard of state.guards) {
    guard.state = 'patrol';
    guard.investigateTarget = null;
  }
  state.graceLeft = PLAYER.respawnGrace;
  say(state, `Caught! ${state.lives} ${state.lives === 1 ? 'life' : 'lives'} left — back to the start.`, 2.6);
}

/** Drain the events queued since the last call (the main loop plays sounds for them). */
export function drainEvents(world) {
  const out = world.events;
  world.events = [];
  return out;
}
