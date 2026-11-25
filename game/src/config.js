// Dapur Kilat — layout and tuning in one place. The canvas is a fixed 1280x800
// stage; the renderer scales it to the window. Every station's rectangle lives
// here so the world, the input handler and the renderer agree on hit areas.
export const W = 1280;
export const H = 800;
export const STEP = 1 / 60;

export const BEST_KEY = 'dapur-kilat-best';
export const START_HEARTS = 3;
export const MAX_ORDERS = 4;

// Top bar.
export const BAR = { x: 0, y: 0, w: W, h: 72 };
// Order board strip.
export const BOARD = { x: 24, y: 84, w: W - 48, h: 128 };
export const TICKET_W = 286;
export const TICKET_H = 116;
export const TICKET_GAP = 16;

// Kitchen middle row.
export const STOVE = { x: 24, y: 228, w: 380, h: 260 };
export const PAN_W = 150;
export const PAN_H = 120;
export const CHOP = { x: 452, y: 228, w: 340, h: 260 };
export const PLATE = { x: 840, y: 228, w: 416, h: 260 };

// Bottom counter: the seven ingredient bins.
export const COUNTER = { x: 24, y: 512, w: W - 48, h: 264 };
export const BIN_W = 128;
export const BIN_H = 190;
export const BIN_GAP = 22;
export const SERVE = { x: 1064, y: 560, w: 192, h: 168 };

// Palette: a warm warung — cream walls, terracotta, teal, chili red.
export const COLORS = {
  wall: '#f7ead7',
  wallDark: '#efdcbf',
  counter: '#b4552d',
  counterTop: '#d97b4f',
  board: '#f3e2c7',
  ticket: '#fffaf0',
  ticketSel: '#fff3c4',
  ink: '#33261d',
  muted: '#8a6f5c',
  teal: '#0f766e',
  tealDark: '#0b5e57',
  red: '#c2410c',
  green: '#15803d',
  gold: '#eab308',
  plate: '#ffffff',
  stove: '#3f3f46',
  pan: '#52525b',
  danger: '#dc2626',
};

// Keyboard: number keys pick a bin, C chops, Space serves, P pauses.
export const BIN_KEYS = ['1', '2', '3', '4', '5', '6', '7'];

export function binRect(index) {
  const total = 7 * BIN_W + 6 * BIN_GAP;
  const x0 = COUNTER.x + 8;
  return { x: x0 + index * (BIN_W + BIN_GAP), y: COUNTER.y + 44, w: BIN_W, h: BIN_H };
}

export function panRect(index) {
  return {
    x: STOVE.x + 28 + index * (PAN_W + 24),
    y: STOVE.y + 96,
    w: PAN_W,
    h: PAN_H,
  };
}

export function ticketRect(index) {
  return {
    x: BOARD.x + index * (TICKET_W + TICKET_GAP),
    y: BOARD.y + 6,
    w: TICKET_W,
    h: TICKET_H,
  };
}
