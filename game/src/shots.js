// The screenshot scenes behind ?shot=start|play|rush|end. Each one plays the
// real rules forward from a fresh world for a fixed number of seconds, steered
// by a simple autopilot that only calls the world's own click functions, so
// the frame is what a real game looks like and the same seed always gives the
// same frame.
import { STEP } from './config.js';
import { ingredient, nextNeeded, orderComplete } from './recipes.js';
import { startGame } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 26;
const RUSH_SECONDS = 72;
const END_LIMIT_SECONDS = 600;

/** One useful action, or null when the kitchen must wait (a pan still cooking). */
function nextAction(world, allowServe) {
  const order = world.activeOrder();
  // A finished pan is always taken first.
  for (let i = 0; i < world.pans.length; i += 1) {
    if (world.pans[i].item && world.pans[i].item.state === 'done') return { type: 'pan', index: i };
  }
  // A burnt pan is binned.
  for (let i = 0; i < world.pans.length; i += 1) {
    if (world.pans[i].item && world.pans[i].item.state === 'burnt') return { type: 'pan', index: i };
  }
  // The hand goes on the plate when it is the next thing needed.
  if (world.hand && order && nextNeeded(order) === world.hand.ing) return { type: 'plate' };
  // A finished chop goes on the plate, or the chicken goes to a pan.
  if (world.board && world.board.ready) return { type: 'board' };
  // Keep chopping.
  if (world.board && !world.board.ready) return { type: 'board' };
  if (!order) return null;
  const need = nextNeeded(order);
  if (!need) {
    if (allowServe) return { type: 'serve' };
    // Serve held: work the next unfinished order while the full plate waits.
    const other = world.orders.find((o) => o.id !== order.id && !orderComplete(o));
    if (other) {
      world.activeId = other.id;
      return nextAction(world, false);
    }
    return null;
  }
  const ing = ingredient(need);
  if (ing.prep === 'instant') return { type: 'bin', id: need };
  if (ing.prep === 'chop' || ing.prep === 'chop-cook') {
    if (!world.board) return { type: 'bin', id: need };
    return null;
  }
  if (ing.prep === 'cook') {
    if (world.pans.some((p) => p.item === null)) return { type: 'bin', id: need };
    return null;
  }
  return null;
}

/** Run the autopilot until it has nothing to do, then step the world once. */
function autopilotStep(world, allowServe = true) {
  for (let guard = 0; guard < 12; guard += 1) {
    const action = nextAction(world, allowServe);
    if (!action) break;
    if (action.type === 'pan') world.clickPan(action.index);
    else if (action.type === 'board') world.clickBoard();
    else if (action.type === 'plate') world.clickPlate();
    else if (action.type === 'bin') world.clickBin(action.id);
    else if (action.type === 'serve') world.serve();
    if (world.screen !== 'play') break;
  }
  return world.step(STEP);
}

/** Set `world` to the named scene and return the screen to draw over it. */
export function stageShot(name, world) {
  startGame(world);
  if (name !== 'play' && name !== 'rush' && name !== 'end') {
    for (let i = 0; i < START_SECONDS / STEP; i += 1) world.step(STEP);
    world.screen = SCREEN_TITLE;
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'end') {
    // A good cook who then stops serving: a couple of dishes go out first,
    // then orders expire until the warung closes.
    for (let i = 0; i < 40 / STEP; i += 1) {
      autopilotStep(world);
      if (world.screen !== 'play') break;
    }
    for (let i = 0; i < END_LIMIT_SECONDS / STEP; i += 1) {
      world.step(STEP);
      if (world.screen === SCREEN_OVER) break;
    }
    return { screen: SCREEN_OVER, best: world.best };
  }
  const seconds = name === 'rush' ? RUSH_SECONDS : PLAY_SECONDS;
  for (let i = 0; i < seconds / STEP; i += 1) {
    // In the rush scene the last stretch holds the serve: a finished plate
    // sits ready while fresh orders pile onto the board.
    const holdServe = name === 'rush' && i > (RUSH_SECONDS - 14) / STEP;
    autopilotStep(world, !holdServe);
    if (world.screen !== 'play') break;
  }
  return { screen: SCREEN_PLAY, best: world.best };
}
