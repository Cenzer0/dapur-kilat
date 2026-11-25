// The kitchen's state and rules. The world is a pure-ish simulation: step(dt)
// advances timers, and the click* functions are the only way to act — the
// mouse handler, the keyboard handler and the screenshot autopilot all call
// them, so a staged screenshot plays the real rules.
import { MAX_ORDERS, START_HEARTS, STEP } from './config.js';
import { DISHES, ingredient, nextNeeded, orderComplete } from './recipes.js';
import { pick } from './random.js';

export const EVENT_NONE = 0;
export const EVENT_SERVED = 1;
export const EVENT_EXPIRED = 2;
export const EVENT_OVER = 4;
export const EVENT_DING = 8;

let orderSeq = 0;

export function createWorld(random) {
  const world = {
    random,
    screen: 'title',
    paused: false,
    score: 0,
    best: 0,
    combo: 0,
    comboLeft: 0,
    hearts: START_HEARTS,
    orders: [],
    activeId: null,
    board: null,
    pans: [{ item: null }, { item: null }],
    hand: null,
    spawnIn: 6,
    served: 0,
    lost: 0,
    elapsed: 0,
    flash: 0,
    flashText: '',
    muted: false,
  };
  world.reset = () => resetWorld(world);
  world.step = (dt, actions) => stepWorld(world, dt, actions);
  world.clickBin = (id) => clickBin(world, id);
  world.clickBoard = () => clickBoard(world);
  world.clickPan = (i) => clickPan(world, i);
  world.clickPlate = () => clickPlate(world);
  world.clickTicket = (i) => clickTicket(world, i);
  world.serve = () => serveOrder(world);
  world.selectNextOrder = () => selectNextOrder(world);
  world.activeOrder = () => world.orders.find((o) => o.id === world.activeId) || world.orders[0] || null;
  resetWorld(world);
  // A pair of tickets on the title screen, so the kitchen reads as a kitchen
  // before the first game starts. They are replaced when play begins.
  spawnOrder(world);
  spawnOrder(world);
  return world;
}

function resetWorld(world) {
  world.screen = 'title';
  world.paused = false;
  world.score = 0;
  world.combo = 0;
  world.comboLeft = 0;
  world.hearts = START_HEARTS;
  world.orders = [];
  world.activeId = null;
  world.board = null;
  world.pans = [{ item: null }, { item: null }];
  world.hand = null;
  world.spawnIn = 6;
  world.served = 0;
  world.lost = 0;
  world.elapsed = 0;
  world.flash = 0;
  world.flashText = '';
}

function orderTimeLimit(served) {
  return Math.max(28, 50 - served);
}

function spawnInterval(served) {
  return Math.max(7, 14 - served * 0.4);
}

function maxOrders(served) {
  return Math.min(MAX_ORDERS, 2 + Math.floor(served / 4));
}

function spawnOrder(world) {
  const dish = pick(world.random, DISHES);
  const limit = orderTimeLimit(world.served);
  const order = {
    id: `o${(orderSeq += 1)}`,
    dish,
    items: dish.items.slice(),
    placed: [],
    timeLeft: limit,
    timeMax: limit,
    born: world.elapsed,
  };
  world.orders.push(order);
  if (world.activeId === null) world.activeId = order.id;
  return order;
}

function startGame(world) {
  resetWorld(world);
  world.screen = 'play';
  spawnOrder(world);
  spawnOrder(world);
  world.spawnIn = spawnInterval(0);
}

function endGame(world) {
  world.screen = 'over';
  if (world.score > world.best) world.best = world.score;
}

function freePan(world) {
  return world.pans.findIndex((p) => p.item === null);
}

function moveBoardToPan(world) {
  const pan = freePan(world);
  if (pan === -1 || !world.board || !world.board.ready) return false;
  const ing = ingredient(world.board.ing);
  world.pans[pan].item = { ing: world.board.ing, left: ing.cook, state: 'cooking' };
  world.board = null;
  return true;
}

/** The board's click: chop what is there, or take a finished chop to the plate. */
function clickBoard(world) {
  const b = world.board;
  if (!b) return 'empty';
  if (!b.ready) {
    b.chops -= 1;
    if (b.chops <= 0) {
      b.ready = true;
      if (b.ing === 'ayam') moveBoardToPan(world);
    }
    return 'chop';
  }
  const order = world.activeOrder();
  if (b.ing === 'ayam') {
    // Chopped chicken waits for a free pan, it never goes on the plate raw.
    if (moveBoardToPan(world)) return 'prep';
    return 'busy';
  }
  if (order && nextNeeded(order) === b.ing) {
    order.placed.push(b.ing);
    world.board = null;
    return 'place';
  }
  return 'wrong';
}

/** A bin's click: instant ingredients go straight to the plate, the rest start prep. */
function clickBin(world, id) {
  const ing = ingredient(id);
  if (!ing || world.screen !== 'play' || world.paused) return 'idle';
  const order = world.activeOrder();
  if (ing.prep === 'instant') {
    if (order && nextNeeded(order) === id) {
      order.placed.push(id);
      return 'place';
    }
    return 'wrong';
  }
  if (ing.prep === 'chop' || ing.prep === 'chop-cook') {
    if (world.board) return 'busy';
    world.board = { ing: id, chops: ing.chops, ready: false };
    return 'prep';
  }
  if (ing.prep === 'cook') {
    const pan = freePan(world);
    if (pan === -1) return 'busy';
    world.pans[pan].item = { ing: id, left: ing.cook, state: 'cooking' };
    return 'prep';
  }
  return 'idle';
}

/** A pan's click: take a finished cook into the hand, or bin a burnt one. */
function clickPan(world, index) {
  const pan = world.pans[index];
  if (!pan || !pan.item) return 'empty';
  if (pan.item.state === 'burnt') {
    pan.item = null;
    return 'trash';
  }
  if (pan.item.state === 'done') {
    if (world.hand) return 'busy';
    world.hand = { ing: pan.item.ing };
    pan.item = null;
    return 'take';
  }
  return 'cooking';
}

/** The plate's click: place the held cook, or undo the last plated item. */
function clickPlate(world) {
  const order = world.activeOrder();
  if (!order) return 'empty';
  if (world.hand) {
    if (nextNeeded(order) === world.hand.ing) {
      order.placed.push(world.hand.ing);
      world.hand = null;
      return 'place';
    }
    return 'wrong';
  }
  if (order.placed.length > 0) {
    order.placed.pop();
    return 'undo';
  }
  return 'empty';
}

function clickTicket(world, index) {
  const order = world.orders[index];
  if (!order) return 'empty';
  world.activeId = order.id;
  return 'select';
}

function selectNextOrder(world) {
  if (world.orders.length === 0) return;
  const i = world.orders.findIndex((o) => o.id === world.activeId);
  const next = world.orders[(i + 1) % world.orders.length];
  world.activeId = next.id;
}

function serveOrder(world) {
  const order = world.activeOrder();
  if (!order || !orderComplete(order)) return 'not-ready';
  const timeBonus = Math.round(order.timeLeft) * 2;
  const comboBonus = world.combo * 15;
  const gained = order.dish.base + timeBonus + comboBonus;
  world.score += gained;
  world.served += 1;
  world.combo += 1;
  world.comboLeft = 20;
  world.orders = world.orders.filter((o) => o.id !== order.id);
  if (world.activeId === order.id) world.activeId = world.orders.length ? world.orders[0].id : null;
  world.flash = 1;
  world.flashText = `+${gained}`;
  return 'served';
}

function stepWorld(world, dt, actions) {
  let events = EVENT_NONE;
  if (world.screen !== 'play' || world.paused) return events;
  world.elapsed += dt;
  if (world.comboLeft > 0) {
    world.comboLeft -= dt;
    if (world.comboLeft <= 0) world.combo = 0;
  }
  if (world.flash > 0) world.flash = Math.max(0, world.flash - dt * 1.5);

  // Pans cook; a finished pan dings once, a neglected one burns.
  for (const pan of world.pans) {
    const item = pan.item;
    if (!item || item.state !== 'cooking') continue;
    item.left -= dt;
    if (item.left <= 0) {
      item.state = 'done';
      item.left = 0;
      events |= EVENT_DING;
    }
  }
  for (const pan of world.pans) {
    const item = pan.item;
    if (!item || item.state !== 'done') continue;
    item.overdue = (item.overdue || 0) + dt;
    if (item.overdue > ingredient(item.ing).burn) {
      item.state = 'burnt';
      item.overdue = 0;
    }
  }

  // Orders count down; an expired one costs a heart.
  for (let i = world.orders.length - 1; i >= 0; i -= 1) {
    const order = world.orders[i];
    order.timeLeft -= dt;
    if (order.timeLeft <= 0) {
      world.orders.splice(i, 1);
      world.lost += 1;
      world.combo = 0;
      world.comboLeft = 0;
      world.hearts -= 1;
      events |= EVENT_EXPIRED;
      if (world.activeId === order.id) world.activeId = world.orders.length ? world.orders[0].id : null;
      if (world.hearts <= 0) {
        endGame(world);
        events |= EVENT_OVER;
        return events;
      }
    }
  }

  // New orders arrive faster the more you serve.
  world.spawnIn -= dt;
  if (world.spawnIn <= 0) {
    if (world.orders.length < maxOrders(world.served)) spawnOrder(world);
    world.spawnIn = spawnInterval(world.served);
  }

  if (actions) {
    if (actions.serve) {
      if (serveOrder(world) === 'served') events |= EVENT_SERVED;
    }
  }
  return events;
}

export { startGame, endGame, moveBoardToPan };
export { STEP };
