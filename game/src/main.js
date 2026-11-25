// Boot and the one loop: input is drained every frame, the world advances in
// fixed 1/60 s steps, and the renderer paints what is there. The game moves
// between four screens: title, play, paused and game over.
//
// ?seed=N fixes the order pattern. ?shot=start|play|rush|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, endGame, startGame, EVENT_DING, EVENT_EXPIRED, EVENT_OVER, EVENT_SERVED } from './world.js';
import { createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';
import { sfx, toggleMute } from './audio.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
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
    // Storage can be off (private windows): the best score lasts this visit.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas, world);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function announce(message) {
    status.textContent = message;
  }

  function beginPlay() {
    startGame(world);
    screen = SCREEN_PLAY;
    announce('Bermain. Sajikan pesanan sebelum waktunya habis.');
  }

  function finishGame() {
    screen = SCREEN_OVER;
    if (world.score > best) {
      best = world.score;
      saveBest(best);
    }
    sfx.over();
    announce(`Warung tutup. Skor ${world.score}. Terbaik ${best}.`);
  }

  function playSound(result, okSound) {
    if (result === 'place' || result === 'take') sfx.place();
    else if (result === 'chop') sfx.chop();
    else if (result === 'prep') sfx.sizzle();
    else if (result === 'wrong' || result === 'busy') sfx.error();
    else if (result === 'served') sfx.serve();
    else if (okSound) sfx.click();
  }

  function handleQueue() {
    for (const item of input.takeQueue()) {
      if (item.type === 'confirm') {
        if (screen === SCREEN_TITLE || screen === SCREEN_OVER) beginPlay();
        else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
        continue;
      }
      if (item.type === 'mute') {
        toggleMute();
        continue;
      }
      if (item.type === 'pause') {
        if (screen === SCREEN_PLAY) {
          screen = SCREEN_PAUSED;
          announce('Jeda.');
        } else if (screen === SCREEN_PAUSED) {
          screen = SCREEN_PLAY;
          announce('Bermain.');
        }
        continue;
      }
      if (screen !== SCREEN_PLAY || world.paused) continue;
      if (item.type === 'bin') playSound(world.clickBin(item.id));
      else if (item.type === 'board') playSound(world.clickBoard());
      else if (item.type === 'pan') playSound(world.clickPan(item.index));
      else if (item.type === 'plate') playSound(world.clickPlate());
      else if (item.type === 'ticket') playSound(world.clickTicket(item.index), true);
      else if (item.type === 'next-order') { world.selectNextOrder(); sfx.click(); }
      else if (item.type === 'serve') {
        const result = world.serve();
        playSound(result);
        if (result === 'served') announce(`Tersaji! Skor ${world.score}.`);
      }
    }
  }

  function step() {
    if (screen === SCREEN_TITLE) return;
    const events = world.step(STEP);
    if (events & EVENT_DING) sfx.ding();
    if (events & EVENT_SERVED) sfx.serve();
    if (events & EVENT_EXPIRED) sfx.expire();
    if (events & EVENT_OVER) finishGame();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleQueue();
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world, screen, best);
  }

  // Leaving the tab pauses a running game rather than letting orders expire.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Jeda.');
    }
  });

  announce('Dapur Kilat. Tekan Spasi atau klik untuk mulai.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
