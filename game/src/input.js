// Mouse and keyboard, translated into world clicks. Hit areas come from
// config.js, so the renderer and the input handler can never disagree about
// where a station is. Clicks land in a queue the main loop drains each frame.
import {
  BIN_KEYS, W, H, binRect, panRect, ticketRect,
  CHOP, PLATE, SERVE,
} from './config.js';
import { BIN_ORDER } from './recipes.js';

function inside(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export function createInput(canvas, world) {
  const queue = [];

  function clickAt(x, y) {
    if (world.screen === 'title' || world.screen === 'over') {
      queue.push({ type: 'confirm' });
      return;
    }
    if (world.screen !== 'play') return;
    // Mute toggle, top-right of the bar.
    if (inside({ x: W - 64, y: 12, w: 48, h: 48 }, x, y)) {
      queue.push({ type: 'mute' });
      return;
    }
    // Pause button, next to mute.
    if (inside({ x: W - 124, y: 12, w: 48, h: 48 }, x, y)) {
      queue.push({ type: 'pause' });
      return;
    }
    // Order tickets pick the active order.
    for (let i = 0; i < world.orders.length; i += 1) {
      if (inside(ticketRect(i), x, y)) {
        queue.push({ type: 'ticket', index: i });
        return;
      }
    }
    // Stove pans.
    for (let i = 0; i < 2; i += 1) {
      if (inside(panRect(i), x, y)) {
        queue.push({ type: 'pan', index: i });
        return;
      }
    }
    if (inside(CHOP, x, y)) {
      queue.push({ type: 'board' });
      return;
    }
    if (inside(PLATE, x, y)) {
      queue.push({ type: 'plate' });
      return;
    }
    if (inside(SERVE, x, y)) {
      queue.push({ type: 'serve' });
      return;
    }
    // Ingredient bins.
    for (let i = 0; i < BIN_ORDER.length; i += 1) {
      if (inside(binRect(i), x, y)) {
        queue.push({ type: 'bin', id: BIN_ORDER[i] });
        return;
      }
    }
  }

  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * W;
    const y = ((event.clientY - rect.top) / rect.height) * H;
    clickAt(x, y);
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key === ' ' || key === 'enter') {
      event.preventDefault();
      queue.push({ type: world.screen === 'play' ? 'serve' : 'confirm' });
      return;
    }
    if (key === 'p' || key === 'escape') {
      queue.push({ type: 'pause' });
      return;
    }
    if (key === 'c') {
      queue.push({ type: 'board' });
      return;
    }
    if (key === 'tab') {
      event.preventDefault();
      queue.push({ type: 'next-order' });
      return;
    }
    const bin = BIN_KEYS.indexOf(key);
    if (bin !== -1) queue.push({ type: 'bin', id: BIN_ORDER[bin] });
  });

  return {
    takeQueue() {
      return queue.splice(0, queue.length);
    },
  };
}
