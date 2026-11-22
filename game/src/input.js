// Keyboard and mouse input. The game reads a plain object every frame:
// { up, down, left, right, sneak, crack, confirm, pause } plus an optional
// clickTarget in world coordinates, which the main loop turns into a walk order.
import { FIELD } from './config.js';

export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';

const KEYMAP = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ShiftLeft: 'sneak',
  ShiftRight: 'sneak',
  KeyE: 'crack',
};

export function createInput(canvas, toWorld) {
  const held = {
    up: false,
    down: false,
    left: false,
    right: false,
    sneak: false,
    crack: false,
  };
  const pressed = new Set();
  const clicks = [];

  function onKeyDown(event) {
    const action = KEYMAP[event.code];
    if (action) {
      held[action] = true;
      event.preventDefault();
      return;
    }
    if (event.code === 'Enter' || event.code === 'Space') {
      pressed.add(ACTION_CONFIRM);
      event.preventDefault();
      return;
    }
    if (event.code === 'KeyP' || event.code === 'Escape') {
      pressed.add(ACTION_PAUSE);
      event.preventDefault();
    }
  }

  function onKeyUp(event) {
    const action = KEYMAP[event.code];
    if (action) held[action] = false;
  }

  function onPointerDown(event) {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * FIELD.width;
    const y = ((event.clientY - rect.top) / rect.height) * FIELD.height;
    clicks.push({ x, y });
    pressed.add(ACTION_CONFIRM);
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);

  return {
    /** Snapshot the held keys for this frame. */
    read() {
      return { ...held };
    },
    /** One-shot actions pressed since the last poll (confirm / pause). */
    pollActions() {
      const out = [...pressed];
      pressed.clear();
      return out;
    },
    /** Click positions since the last poll, in world coordinates. */
    pollClicks() {
      const out = clicks.splice(0, clicks.length);
      return out;
    },
  };
}
