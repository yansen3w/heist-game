// The screenshot scenes behind ?shot=start|play|alarm|win. Each one sets the world
// to a real state of the game — the same state a player could reach — and returns
// the screen to draw over it, so every frame is what the game really looks like.
// NOTE: reset()/setupFloor() replace world.state, so the state is always read
// AFTER the reset, never captured before it.
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

/**
 * Set `world` to the named scene (start, play, alarm or win; any other name is
 * start) and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  if (name === 'play') {
    // Mid-infiltration on floor 1: the thief sneaking past a guard's cone, one
    // artifact already lifted, a camera sweeping overhead.
    world.reset();
    const state = world.state;
    state.player.x = 500;
    state.player.y = 480;
    state.player.facing = Math.PI / 2;
    state.player.sneaking = true;
    state.loot = 1;
    state.score = 100;
    state.time = 41;
    state.heat = 0.35;
    const guard = state.guards[0];
    guard.x = 640;
    guard.y = 420;
    guard.facing = Math.PI * 0.8;
    const guard2 = state.guards[1];
    guard2.x = 900;
    guard2.y = 300;
    guard2.facing = Math.PI * 1.1;
    state.floor.loot[0].taken = true;
    state.clickTarget = { x: 640, y: 560 };
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'alarm') {
    // Near-miss on floor 2: the alarm is up, two guards are closing in, the thief
    // is backing into the corner with the meter full.
    world.reset();
    world.setupFloor(1);
    const state = world.state;
    state.player.x = 340;
    state.player.y = 170;
    state.player.facing = Math.PI / 4;
    state.loot = 2;
    state.score = 450;
    state.time = 96;
    state.heat = 1;
    state.alarm = true;
    state.alarmLeft = 4;
    const guard = state.guards[0];
    guard.x = 470;
    guard.y = 230;
    guard.facing = Math.atan2(state.player.y - guard.y, state.player.x - guard.x);
    guard.state = 'chase';
    const guard2 = state.guards[1];
    guard2.x = 560;
    guard2.y = 330;
    guard2.facing = Math.atan2(state.player.y - guard2.y, state.player.x - guard2.x);
    guard2.state = 'chase';
    state.floor.loot[0].taken = true;
    state.floor.loot[1].taken = true;
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'win') {
    // The getaway on floor 3: vault cracked open, loot lifted, thief at the exit.
    world.reset();
    world.setupFloor(2);
    const state = world.state;
    state.floor.vault.opened = true;
    state.player.x = 1150;
    state.player.y = 110;
    state.player.facing = 0;
    state.loot = 5;
    state.score = 1930;
    state.time = 168;
    for (const item of state.floor.loot) item.taken = true;
    state.exitOpen = true;
    const guard = state.guards[0];
    guard.x = 500;
    guard.y = 430;
    guard.facing = Math.PI;
    return { screen: SCREEN_WIN, best: 1930 };
  }
  // start: the title over a fresh floor 1.
  world.reset();
  return { screen: SCREEN_TITLE, best: 0 };
}
