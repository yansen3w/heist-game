// Boot and the one loop: input is read every frame, the world advances in fixed
// 1/60 s steps (several in a slow frame, none in a fast one), and the renderer
// paints what is there. The game moves between five screens: title, play, paused,
// win and game over.
//
// ?seed=N fixes the random pattern. ?shot=start|play|alarm|win (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import {
  createWorld,
  drainEvents,
  EVENT_ALARM,
  EVENT_CAUGHT,
  EVENT_FLOOR,
  EVENT_LOOT,
  EVENT_OVER,
  EVENT_STEP,
  EVENT_VAULT,
  EVENT_WIN,
} from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';
import { initAudio, playSound } from './audio.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    initAudio();
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Playing. Slip past the guards and reach the exit unseen.');
  }

  function endGame(won) {
    screen = won ? SCREEN_WIN : SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    announce(won ? 'Clean getaway! You escaped with the loot.' : 'Busted. The gallery keeps its secrets.');
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const elapsed = Math.min((now - last) / 1000, MAX_FRAME);
    last = now;

    for (const action of input.pollActions()) {
      if (action === ACTION_PAUSE && (screen === SCREEN_PLAY || screen === SCREEN_PAUSED)) {
        screen = screen === SCREEN_PLAY ? SCREEN_PAUSED : SCREEN_PLAY;
        announce(screen === SCREEN_PAUSED ? 'Paused.' : 'Playing.');
      }
      if (action === ACTION_CONFIRM) {
        if (screen === SCREEN_TITLE) startGame();
        else if (screen === SCREEN_WIN || screen === SCREEN_OVER) startGame();
      }
    }
    if (screen === SCREEN_PLAY) {
      for (const click of input.pollClicks()) {
        world.state.clickTarget = { x: click.x, y: click.y };
      }
      accumulator += elapsed;
      while (accumulator >= STEP) {
        world.update(input.read(), STEP);
        accumulator -= STEP;
      }
      for (const event of drainEvents(world)) {
        if (event.type === EVENT_LOOT) playSound('loot');
        else if (event.type === EVENT_VAULT) playSound('vault');
        else if (event.type === EVENT_FLOOR) playSound('floor');
        else if (event.type === EVENT_ALARM) playSound('alarm');
        else if (event.type === EVENT_CAUGHT) playSound('caught');
        else if (event.type === EVENT_WIN) playSound('win');
        else if (event.type === EVENT_STEP) playSound('step');
      }
      if (world.state.won) endGame(true);
      else if (world.state.over) endGame(false);
    } else {
      // Title, paused and end screens still tick the clock so banners fade.
      world.state.time += elapsed;
      if (screen === SCREEN_TITLE || screen === SCREEN_WIN || screen === SCREEN_OVER) {
        for (const click of input.pollClicks()) {
          // A click anywhere on these screens starts (again).
          if (screen === SCREEN_TITLE) startGame();
          else startGame();
        }
      }
      input.pollClicks();
    }
    renderer.draw(world.state, screen, best);
  }
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
