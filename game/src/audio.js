// All sound is synthesised with WebAudio: short blips and noise bursts, no
// audio files. The context is created lazily on the first gesture so a silent
// page (or a headless screenshot) never throws.
let ctx = null;
let muted = false;

function audio() {
  if (muted) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq, seconds, type, gain, when = 0) {
  const ac = audio();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(gain, ac.currentTime + when);
    amp.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + when + seconds);
    osc.connect(amp).connect(ac.destination);
    osc.start(ac.currentTime + when);
    osc.stop(ac.currentTime + when + seconds + 0.02);
  } catch {
    // Sound is garnish: never let it break the game.
  }
}

function noise(seconds, gain, when = 0) {
  const ac = audio();
  if (!ac) return;
  try {
    const len = Math.max(1, Math.floor(ac.sampleRate * seconds));
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    const amp = ac.createGain();
    amp.gain.value = gain;
    src.buffer = buf;
    src.connect(amp).connect(ac.destination);
    src.start(ac.currentTime + when);
  } catch {
    // Sound is garnish.
  }
}

export const sfx = {
  click() { tone(660, 0.06, 'sine', 0.08); },
  place() { tone(520, 0.07, 'triangle', 0.12); tone(780, 0.08, 'triangle', 0.1, 0.05); },
  chop() { noise(0.05, 0.25); tone(180, 0.05, 'square', 0.06); },
  sizzle() { noise(0.18, 0.1); },
  ding() { tone(1046, 0.25, 'sine', 0.14); tone(1568, 0.3, 'sine', 0.08, 0.08); },
  error() { tone(160, 0.15, 'sawtooth', 0.08); },
  serve() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.14, 'triangle', 0.12, i * 0.07)); },
  expire() { tone(220, 0.3, 'sawtooth', 0.1); tone(147, 0.4, 'sawtooth', 0.1, 0.15); },
  over() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.25, 'triangle', 0.12, i * 0.16)); },
};

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}
