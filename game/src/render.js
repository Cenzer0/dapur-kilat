// Every pixel of Dapur Kilat: the top bar, the order board, the stove, the
// chopping board, the plate, the counter bins and the title / pause /
// game-over overlays. All art is drawn with canvas paths — no image files —
// so the game loads nothing over the network.
import {
  W, H, BAR, BOARD, CHOP, COUNTER, PLATE, SERVE, STOVE, COLORS,
  binRect, panRect, ticketRect,
} from './config.js';
import { BIN_ORDER, ingredient, nextNeeded } from './recipes.js';
import { isMuted } from './audio.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = 700, align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, -apple-system, 'Segoe UI', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

/** One ingredient's icon, drawn in a square centred on (cx, cy). */
export function drawIngredient(ctx, id, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  const u = s / 100;
  if (id === 'nasi') {
    ctx.fillStyle = '#e8dcc3';
    ctx.beginPath(); ctx.ellipse(0, 18 * u, 38 * u, 12 * u, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fffdf5';
    ctx.beginPath(); ctx.arc(0, 2 * u, 30 * u, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#f3e9c8';
    for (let i = -2; i <= 2; i += 1) { ctx.beginPath(); ctx.arc(i * 11 * u, -14 * u + Math.abs(i) * 4 * u, 7 * u, 0, Math.PI * 2); ctx.fill(); }
  } else if (id === 'mie') {
    ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 7 * u; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-30 * u, -14 * u + i * 14 * u);
      ctx.bezierCurveTo(-10 * u, -26 * u + i * 14 * u, 10 * u, -2 * u + i * 14 * u, 30 * u, -14 * u + i * 14 * u);
      ctx.stroke();
    }
    ctx.fillStyle = '#16a34a';
    ctx.beginPath(); ctx.arc(24 * u, -26 * u, 6 * u, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-26 * u, 16 * u, 6 * u, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'ayam') {
    ctx.fillStyle = '#b45309';
    ctx.beginPath(); ctx.ellipse(-4 * u, 2 * u, 26 * u, 20 * u, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d97706';
    ctx.beginPath(); ctx.ellipse(-8 * u, -2 * u, 20 * u, 15 * u, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f3e9c8'; ctx.lineWidth = 6 * u; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(16 * u, 14 * u); ctx.lineTo(32 * u, 28 * u); ctx.stroke();
    ctx.fillStyle = '#fff7e0';
    ctx.beginPath(); ctx.arc(34 * u, 30 * u, 7 * u, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(27 * u, 33 * u, 6 * u, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'telur') {
    ctx.fillStyle = '#fffdf5';
    ctx.beginPath(); ctx.ellipse(0, 0, 36 * u, 28 * u, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(2 * u, 0, 15 * u, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath(); ctx.arc(-2 * u, -4 * u, 7 * u, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'sayur') {
    ctx.fillStyle = '#15803d';
    ctx.beginPath(); ctx.ellipse(-12 * u, 6 * u, 18 * u, 26 * u, 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath(); ctx.ellipse(10 * u, -4 * u, 18 * u, 26 * u, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#86efac';
    ctx.beginPath(); ctx.ellipse(0, -14 * u, 14 * u, 20 * u, 0.1, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'sambal') {
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath(); ctx.ellipse(0, 8 * u, 32 * u, 20 * u, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.ellipse(0, 2 * u, 26 * u, 16 * u, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7f1d1d';
    for (let i = -1; i <= 1; i += 1) { ctx.beginPath(); ctx.arc(i * 12 * u, -2 * u, 3 * u, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 5 * u; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(22 * u, -12 * u); ctx.quadraticCurveTo(34 * u, -26 * u, 30 * u, -34 * u); ctx.stroke();
  } else if (id === 'kerupuk') {
    ctx.fillStyle = '#fda4af';
    for (const [dx, dy] of [[-14, 6], [12, -8], [2, 12]]) {
      ctx.beginPath(); ctx.arc(dx * u, dy * u, 17 * u, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#fff1f2';
    for (const [dx, dy] of [[-14, 6], [12, -8], [2, 12]]) {
      ctx.beginPath(); ctx.arc(dx * u, dy * u, 9 * u, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

function drawHeart(ctx, x, y, s, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s / 20, s / 20);
  ctx.fillStyle = filled ? '#dc2626' : '#d6c9b8';
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.bezierCurveTo(-12, -6, -6, -14, 0, -6);
  ctx.bezierCurveTo(6, -14, 12, -6, 0, 6);
  ctx.fill();
  ctx.restore();
}

function drawTicket(ctx, order, index, active) {
  const r = ticketRect(index);
  const urgent = order.timeLeft < 12;
  ctx.fillStyle = active ? COLORS.ticketSel : COLORS.ticket;
  rr(ctx, r.x, r.y, r.w, r.h, 14);
  ctx.fill();
  ctx.lineWidth = active ? 4 : 2;
  ctx.strokeStyle = active ? COLORS.teal : urgent ? COLORS.danger : '#e2d3b8';
  ctx.stroke();
  text(ctx, order.dish.name.toUpperCase(), r.x + 14, r.y + 22, 19, COLORS.ink, 800);
  // Recipe: the icons in plating order; plated ones are ticked.
  const need = nextNeeded(order);
  order.items.forEach((id, i) => {
    const ix = r.x + 26 + i * 52;
    const iy = r.y + 58;
    const done = i < order.placed.length;
    ctx.globalAlpha = done ? 0.35 : 1;
    drawIngredient(ctx, id, ix, iy, 40);
    ctx.globalAlpha = 1;
    if (done) {
      ctx.strokeStyle = COLORS.green; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ix - 9, iy); ctx.lineTo(ix - 2, iy + 8); ctx.lineTo(ix + 11, iy - 9); ctx.stroke();
    } else if (need === id) {
      ctx.strokeStyle = COLORS.teal; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(ix, iy, 24, 0, Math.PI * 2); ctx.stroke();
    }
  });
  // Timer bar, shortened so the seconds never sit on top of it.
  const frac = Math.max(0, order.timeLeft / order.timeMax);
  ctx.fillStyle = '#eadfc8';
  rr(ctx, r.x + 14, r.y + r.h - 20, r.w - 100, 10, 5);
  ctx.fill();
  ctx.fillStyle = urgent ? COLORS.danger : frac > 0.5 ? COLORS.green : COLORS.gold;
  if (frac > 0) { rr(ctx, r.x + 14, r.y + r.h - 20, (r.w - 100) * frac, 10, 5); ctx.fill(); }
  text(ctx, `${Math.ceil(order.timeLeft)} dtk`, r.x + r.w - 16, r.y + r.h - 14, 13, urgent ? COLORS.danger : COLORS.muted, 700, 'right');
  if (active) text(ctx, 'PESANAN AKTIF', r.x + r.w - 16, r.y + 22, 12, COLORS.teal, 800, 'right');
}

function drawStove(ctx, world) {
  ctx.fillStyle = COLORS.stove;
  rr(ctx, STOVE.x, STOVE.y, STOVE.w, STOVE.h, 16);
  ctx.fill();
  text(ctx, 'KOMPOR', STOVE.x + 20, STOVE.y + 28, 16, '#d4d4d8', 800);
  text(ctx, 'klik wajan untuk angkat', STOVE.x + STOVE.w - 20, STOVE.y + 28, 13, '#a1a1aa', 600, 'right');
  world.pans.forEach((pan, i) => {
    const r = panRect(i);
    ctx.fillStyle = '#18181b';
    ctx.beginPath(); ctx.ellipse(r.x + r.w / 2, r.y + r.h / 2 + 8, r.w / 2, r.h / 2 - 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = COLORS.pan;
    ctx.beginPath(); ctx.ellipse(r.x + r.w / 2, r.y + r.h / 2, r.w / 2, r.h / 2 - 10, 0, 0, Math.PI * 2); ctx.fill();
    const item = pan.item;
    if (item) {
      const ing = ingredient(item.ing);
      if (item.state === 'burnt') {
        ctx.fillStyle = '#1c1917';
        ctx.beginPath(); ctx.arc(r.x + r.w / 2, r.y + r.h / 2, 34, 0, Math.PI * 2); ctx.fill();
        text(ctx, 'GOSONG!', r.x + r.w / 2, r.y + r.h / 2, 15, '#fca5a5', 800, 'center');
      } else {
        drawIngredient(ctx, item.ing, r.x + r.w / 2, r.y + r.h / 2 - 4, 64);
        if (item.state === 'cooking') {
          const frac = 1 - item.left / ing.cook;
          ctx.fillStyle = '#27272a';
          rr(ctx, r.x + 10, r.y + r.h - 18, r.w - 20, 8, 4); ctx.fill();
          ctx.fillStyle = '#f97316';
          rr(ctx, r.x + 10, r.y + r.h - 18, (r.w - 20) * frac, 8, 4); ctx.fill();
        } else {
          ctx.strokeStyle = COLORS.gold; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.ellipse(r.x + r.w / 2, r.y + r.h / 2, r.w / 2 - 4, r.h / 2 - 12, 0, 0, Math.PI * 2); ctx.stroke();
          text(ctx, 'MATANG!', r.x + r.w / 2, r.y + 6, 14, COLORS.gold, 800, 'center');
        }
      }
    } else {
      text(ctx, 'wajan kosong', r.x + r.w / 2, r.y + r.h / 2, 13, '#a1a1aa', 600, 'center');
    }
  });
}

function drawBoard(ctx, world) {
  ctx.fillStyle = COLORS.board;
  rr(ctx, CHOP.x, CHOP.y, CHOP.w, CHOP.h, 16);
  ctx.fill();
  ctx.strokeStyle = '#d9b98a'; ctx.lineWidth = 2; ctx.stroke();
  text(ctx, 'TALENAN  (klik / tekan C)', CHOP.x + 20, CHOP.y + 28, 16, COLORS.ink, 800);
  const b = world.board;
  if (!b) {
    text(ctx, 'taruh ayam / sayur di sini', CHOP.x + CHOP.w / 2, CHOP.y + 130, 15, COLORS.muted, 600, 'center');
    return;
  }
  const ing = ingredient(b.ing);
  const cx = CHOP.x + CHOP.w / 2;
  const cy = CHOP.y + 130;
  drawIngredient(ctx, b.ing, cx, cy, 96);
  if (!b.ready) {
    text(ctx, `cincang ${b.chops}x lagi`, cx, cy + 68, 17, COLORS.ink, 800, 'center');
    const frac = 1 - b.chops / ing.chops;
    ctx.fillStyle = '#e2d3b8';
    rr(ctx, CHOP.x + 40, CHOP.y + CHOP.h - 34, CHOP.w - 80, 12, 6); ctx.fill();
    ctx.fillStyle = COLORS.teal;
    rr(ctx, CHOP.x + 40, CHOP.y + CHOP.h - 34, (CHOP.w - 80) * frac, 12, 6); ctx.fill();
  } else if (b.ing === 'ayam') {
    text(ctx, 'ayam siap — tunggu wajan', cx, cy + 68, 16, COLORS.muted, 700, 'center');
  } else {
    text(ctx, 'siap! klik untuk ke piring', cx, cy + 68, 16, COLORS.teal, 800, 'center');
  }
}

function drawPlate(ctx, world) {
  const order = world.activeOrder();
  ctx.fillStyle = '#fffaf0';
  rr(ctx, PLATE.x, PLATE.y, PLATE.w, PLATE.h, 16);
  ctx.fill();
  ctx.strokeStyle = '#e2d3b8'; ctx.lineWidth = 2; ctx.stroke();
  text(ctx, 'PIRING SAJI', PLATE.x + 20, PLATE.y + 28, 16, COLORS.ink, 800);
  if (!order) {
    text(ctx, 'belum ada pesanan', PLATE.x + PLATE.w / 2, PLATE.y + 130, 15, COLORS.muted, 600, 'center');
    return;
  }
  text(ctx, order.dish.name.toUpperCase(), PLATE.x + PLATE.w - 20, PLATE.y + 28, 15, COLORS.teal, 800, 'right');
  const cx = PLATE.x + 130;
  const cy = PLATE.y + 135;
  ctx.fillStyle = COLORS.plate;
  ctx.beginPath(); ctx.ellipse(cx, cy, 100, 78, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d9c48f'; ctx.lineWidth = 3; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(cx, cy, 72, 52, 0, 0, Math.PI * 2); ctx.stroke();
  // Plated items fan out on the plate.
  order.placed.forEach((id, i) => {
    const a = -0.9 + (i * 1.8) / Math.max(1, order.placed.length - 1 || 1);
    drawIngredient(ctx, id, cx + Math.sin(a) * 42, cy + Math.cos(a) * 24 - 8, 50);
  });
  // Ghosts of what is still needed, in a row at the top right.
  text(ctx, 'SISA:', PLATE.x + 268, PLATE.y + 62, 12, COLORS.muted, 700);
  order.items.forEach((id, i) => {
    if (i < order.placed.length) return;
    const k = i - order.placed.length;
    ctx.globalAlpha = 0.45;
    drawIngredient(ctx, id, PLATE.x + 306 + k * 46, PLATE.y + 100, 40);
    ctx.globalAlpha = 1;
  });
  // What the hand holds, bottom right.
  if (world.hand) {
    text(ctx, 'DI TANGAN:', PLATE.x + 268, PLATE.y + 208, 12, COLORS.muted, 700);
    drawIngredient(ctx, world.hand.ing, PLATE.x + 356, PLATE.y + 226, 44);
  }
  const need = nextNeeded(order);
  text(ctx, need ? `butuh: ${ingredient(need).name}` : 'lengkap — SAJIKAN!', PLATE.x + 20, PLATE.y + PLATE.h - 20, 15, need ? COLORS.muted : COLORS.green, 800);
}

function drawBins(ctx, world) {
  ctx.fillStyle = COLORS.counter;
  rr(ctx, COUNTER.x, COUNTER.y, COUNTER.w, COUNTER.h, 18);
  ctx.fill();
  ctx.fillStyle = COLORS.counterTop;
  rr(ctx, COUNTER.x, COUNTER.y, COUNTER.w, 26, 13);
  ctx.fill();
  text(ctx, 'BAHAN — klik atau tekan 1–7', COUNTER.x + 20, COUNTER.y + 12, 15, '#ffedd5', 800);
  BIN_ORDER.forEach((id, i) => {
    const r = binRect(i);
    const ing = ingredient(id);
    ctx.fillStyle = '#fffaf0';
    rr(ctx, r.x, r.y, r.w, r.h, 14);
    ctx.fill();
    ctx.strokeStyle = '#e2d3b8'; ctx.lineWidth = 2; ctx.stroke();
    drawIngredient(ctx, id, r.x + r.w / 2, r.y + 62, 84);
    text(ctx, ing.name.toUpperCase(), r.x + r.w / 2, r.y + 122, 16, COLORS.ink, 800, 'center');
    const prep = ing.prep === 'instant' ? 'langsung' : ing.prep === 'chop' ? 'cincang 2x' : ing.prep === 'cook' ? 'masak 3 dtk' : 'cincang + masak';
    text(ctx, prep, r.x + r.w / 2, r.y + 146, 12, COLORS.muted, 600, 'center');
    ctx.fillStyle = COLORS.teal;
    ctx.beginPath(); ctx.arc(r.x + r.w - 18, r.y + 18, 13, 0, Math.PI * 2); ctx.fill();
    text(ctx, String(i + 1), r.x + r.w - 18, r.y + 19, 14, '#ffffff', 800, 'center');
  });
  // Serve button.
  const ready = world.activeOrder() && world.activeOrder().placed.length >= world.activeOrder().items.length;
  ctx.fillStyle = ready ? COLORS.green : '#a8a29e';
  rr(ctx, SERVE.x, SERVE.y, SERVE.w, SERVE.h, 16);
  ctx.fill();
  ctx.strokeStyle = ready ? '#166534' : '#78716c'; ctx.lineWidth = 3; ctx.stroke();
  text(ctx, 'SAJIKAN', SERVE.x + SERVE.w / 2, SERVE.y + SERVE.h / 2 - 14, 26, '#ffffff', 800, 'center');
  text(ctx, '(Spasi)', SERVE.x + SERVE.w / 2, SERVE.y + SERVE.h / 2 + 20, 14, '#dcfce7', 700, 'center');
}

function drawBar(ctx, world) {
  ctx.fillStyle = '#7c2d12';
  ctx.fillRect(BAR.x, BAR.y, BAR.w, BAR.h);
  text(ctx, 'DAPUR KILAT', 24, BAR.y + 38, 30, '#fde68a', 900);
  text(ctx, 'warung rush', 268, BAR.y + 40, 15, '#fdba74', 700);
  text(ctx, `SKOR  ${world.score}`, 470, BAR.y + 38, 22, '#ffffff', 800);
  text(ctx, `terbaik ${world.best}`, 640, BAR.y + 40, 15, '#fdba74', 700);
  for (let i = 0; i < 3; i += 1) drawHeart(ctx, 800 + i * 30, BAR.y + 36, 22, i < world.hearts);
  if (world.combo > 1) {
    ctx.fillStyle = COLORS.gold;
    rr(ctx, 920, BAR.y + 14, 92, 44, 10);
    ctx.fill();
    text(ctx, `KOMBO x${world.combo}`, 966, BAR.y + 37, 16, '#451a03', 800, 'center');
  }
  // Pause and mute buttons, drawn as shapes so they never depend on a glyph.
  ctx.fillStyle = '#9a3412';
  rr(ctx, W - 124, 12, 48, 48, 10); ctx.fill();
  ctx.fillStyle = '#ffffff';
  if (world.paused) {
    ctx.beginPath();
    ctx.moveTo(W - 106, 24); ctx.lineTo(W - 106, 48); ctx.lineTo(W - 86, 36); ctx.closePath(); ctx.fill();
  } else {
    ctx.fillRect(W - 107, 24, 6, 24);
    ctx.fillRect(W - 95, 24, 6, 24);
  }
  ctx.fillStyle = '#9a3412';
  rr(ctx, W - 64, 12, 48, 48, 10); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(W - 54, 28); ctx.lineTo(W - 46, 28); ctx.lineTo(W - 38, 36); ctx.lineTo(W - 46, 44); ctx.lineTo(W - 54, 44); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  if (isMuted()) {
    ctx.beginPath(); ctx.moveTo(W - 34, 28); ctx.lineTo(W - 24, 44); ctx.moveTo(W - 24, 28); ctx.lineTo(W - 34, 44); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(W - 40, 36, 7, -0.9, 0.9); ctx.stroke();
    ctx.beginPath(); ctx.arc(W - 40, 36, 12, -0.9, 0.9); ctx.stroke();
  }
}

function drawOverlay(ctx, world, screen, best) {
  ctx.fillStyle = 'rgba(51, 38, 29, 0.72)';
  ctx.fillRect(0, 0, W, H);
  if (screen === SCREEN_TITLE) {
    text(ctx, 'DAPUR KILAT', W / 2, 210, 84, '#fde68a', 900, 'center');
    text(ctx, 'Warung paling sibuk di kota — masak cepat, sajikan tepat waktu!', W / 2, 290, 24, '#ffffff', 600, 'center');
    text(ctx, 'Klik bahan di meja, cincang di talenan, masak di kompor, sajikan sebelum waktu habis.', W / 2, 340, 19, '#ffedd5', 600, 'center');
    text(ctx, 'Tombol 1–7 pilih bahan · C cincang · Spasi sajikan · P jeda', W / 2, 378, 18, '#fdba74', 700, 'center');
    ctx.fillStyle = COLORS.teal;
    rr(ctx, W / 2 - 190, 430, 380, 72, 16); ctx.fill();
    text(ctx, 'MULAI MASAK', W / 2, 467, 28, '#ffffff', 800, 'center');
    if (best > 0) text(ctx, `skor terbaik: ${best}`, W / 2, 540, 18, '#fde68a', 700, 'center');
  } else if (screen === SCREEN_PAUSED) {
    text(ctx, 'JEDA', W / 2, 330, 72, '#ffffff', 900, 'center');
    text(ctx, 'Tekan P atau klik untuk lanjut', W / 2, 410, 22, '#ffedd5', 600, 'center');
  } else if (screen === SCREEN_OVER) {
    text(ctx, 'WARUNG TUTUP!', W / 2, 250, 72, '#fca5a5', 900, 'center');
    text(ctx, `Skor akhir: ${world.score}  ·  Pesanan tersaji: ${world.served}  ·  Hangus: ${world.lost}`, W / 2, 340, 24, '#ffffff', 700, 'center');
    if (world.score >= best && world.score > 0) text(ctx, 'Skor terbaik baru!', W / 2, 390, 22, COLORS.gold, 800, 'center');
    ctx.fillStyle = COLORS.teal;
    rr(ctx, W / 2 - 190, 440, 380, 72, 16); ctx.fill();
    text(ctx, 'MASAK LAGI', W / 2, 477, 28, '#ffffff', 800, 'center');
  }
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = W;
  canvas.height = H;

  function draw(state, screen, best) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = COLORS.wallDark;
    for (let x = 0; x < W; x += 96) ctx.fillRect(x, 72, 2, H - 72);
    drawBar(ctx, state);
    text(ctx, 'PAPAN PESANAN — klik tiket untuk memilih', BOARD.x, BOARD.y - 8 + 6, 15, COLORS.muted, 700);
    state.orders.forEach((order, i) => drawTicket(ctx, order, i, order.id === state.activeId));
    drawStove(ctx, state);
    drawBoard(ctx, state);
    drawPlate(ctx, state);
    drawBins(ctx, state);
    if (state.flash > 0) {
      ctx.globalAlpha = Math.min(1, state.flash);
      text(ctx, state.flashText, W / 2, 300, 54, COLORS.green, 900, 'center');
      ctx.globalAlpha = 1;
    }
    if (screen === SCREEN_TITLE || screen === SCREEN_PAUSED || screen === SCREEN_OVER) {
      drawOverlay(ctx, state, screen, best);
    }
  }

  return { draw };
}
