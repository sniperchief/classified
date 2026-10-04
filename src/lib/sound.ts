// Tiny synthesized UI sounds (Web Audio, no assets). Muted state is remembered.

let ctx: AudioContext | null = null;
const MUTE_KEY = "classified.muted";
let muted = (() => {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
})();

// Browsers only allow audio after a user gesture; stay silent until then.
let unlocked = false;
if (typeof window !== "undefined") {
  const unlock = () => {
    unlocked = true;
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
}

function ac(): AudioContext | null {
  if (muted || !unlocked) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, dur: number, opts: { type?: OscillatorType; gain?: number; delay?: number; slide?: number } = {}) {
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime + (opts.delay ?? 0);
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(freq, t0);
  if (opts.slide) osc.frequency.exponentialRampToValueAtTime(opts.slide, t0 + dur);
  const peak = opts.gain ?? 0.05;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  click: () => tone(1400, 0.05, { type: "square", gain: 0.02 }),
  tick: () => tone(2400, 0.02, { type: "square", gain: 0.008 }),
  confirm: () => {
    tone(660, 0.09, { type: "triangle", gain: 0.05 });
    tone(990, 0.14, { type: "triangle", gain: 0.05, delay: 0.09 });
  },
  success: () => {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.35, { type: "triangle", gain: 0.04, delay: i * 0.08 }));
  },
  alert: () => {
    tone(220, 0.18, { type: "sawtooth", gain: 0.035 });
    tone(220, 0.18, { type: "sawtooth", gain: 0.035, delay: 0.26 });
  },
  lock: () => {
    tone(180, 0.08, { type: "square", gain: 0.05 });
    tone(90, 0.2, { type: "sine", gain: 0.08, delay: 0.06 });
  },
  whoosh: () => tone(200, 0.5, { type: "sine", gain: 0.03, slide: 1200 }),
};

export function isMuted() {
  return muted;
}
export function setMuted(m: boolean) {
  muted = m;
  try {
    localStorage.setItem(MUTE_KEY, m ? "1" : "0");
  } catch {
    /* ignore */
  }
}
