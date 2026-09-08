let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let muted = false;
let musicVol = 0.5;
let sfxVol = 0.7;
let started = false;
let nextPhrase = 0;
let raf = 0;
let tension = 20;

const BPM = 72;
const BEAT = 60 / BPM;

function AC(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  return window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
}

function ensure(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor = AC();
  if (!Ctor) return null;
  ctx = new Ctor({ latencyHint: "interactive" });
  master = ctx.createGain();
  musicGain = ctx.createGain();
  sfxGain = ctx.createGain();
  musicGain.connect(master);
  sfxGain.connect(master);
  master.connect(ctx.destination);
  apply();
  return ctx;
}

function apply() {
  if (!master || !musicGain || !sfxGain || !ctx) return;
  const t = ctx.currentTime;
  master.gain.setTargetAtTime(muted ? 0 : 1, t, 0.04);
  musicGain.gain.setTargetAtTime(musicVol * musicVol, t, 0.06);
  sfxGain.gain.setTargetAtTime(sfxVol * sfxVol, t, 0.04);
}

export function resumeAudio() {
  const c = ensure();
  if (!c) return;
  if (c.state === "suspended") {
    try {
      const p = c.resume();
      void p.then(() => startHymn());
    } catch {
      /* ignore */
    }
  }
  startHymn();
}

function startHymn() {
  const c = ensure();
  if (!c || started) return;
  if (c.state === "suspended") return;
  started = true;
  nextPhrase = c.currentTime + 0.12;
  if (!raf) raf = requestAnimationFrame(pump);
}

function pump() {
  raf = requestAnimationFrame(pump);
  const c = ctx;
  if (!c || !started || muted) return;
  const horizon = c.currentTime + 0.55;
  while (nextPhrase < horizon) {
    schedulePhrase(nextPhrase);
    nextPhrase += BEAT * 32;
  }
}

function tone(
  freq: number,
  when: number,
  beats: number,
  vol: number,
  type: OscillatorType,
) {
  const c = ctx;
  if (!c || !musicGain) return;
  const dur = beats * BEAT;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, when);
  const peak = Math.max(0.0008, vol);
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(peak, when + 0.04);
  g.gain.setValueAtTime(peak, when + Math.max(0.05, dur - 0.18));
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  o.connect(g);
  g.connect(musicGain);
  o.start(when);
  o.stop(when + dur + 0.02);
}

function schedulePhrase(t0: number) {
  const D3 = 146.83;
  const F3 = 174.61;
  const A3 = 220.0;
  const C4 = 261.63;
  const D4 = 293.66;
  const E4 = 329.63;
  const F4 = 349.23;
  const G4 = 392.0;
  const A4 = 440.0;
  const C5 = 523.25;

  const t = 1 + tension / 400;
  const mv = 0.11;
  const bv = 0.045;

  const melody: [number, number, number][] = [
    [D4, 0, 2],
    [F4, 2, 1],
    [A4, 3, 1],
    [G4, 4, 2],
    [F4, 6, 1],
    [E4, 7, 1],
    [D4, 8, 2],
    [A3, 10, 2],
    [A4, 16, 1],
    [C5, 17, 1],
    [A4, 18, 2],
    [G4, 20, 1],
    [F4, 21, 1],
    [E4, 22, 2],
    [D4, 24, 3],
  ];
  for (const [f, b, d] of melody) {
    tone(f * t, t0 + b * BEAT, d, mv, "triangle");
    if (d >= 2) tone(f * t * 0.5, t0 + b * BEAT, d, mv * 0.28, "sine");
  }

  const bass: [number, number, number][] = [
    [D3, 0, 1.4],
    [F3, 4, 1.4],
    [D3, 8, 1.4],
    [A3 * 0.5, 16, 1.4],
    [C4 * 0.5, 20, 1.4],
    [D3, 24, 2],
  ];
  for (const [f, b, d] of bass) tone(f, t0 + b * BEAT, d, bv, "sine");
}

export function setMuted(v: boolean) {
  muted = v;
  apply();
  if (!v) resumeAudio();
}

export function setMusic(v: number) {
  musicVol = v;
  apply();
}

export function setSfx(v: number) {
  sfxVol = v;
  apply();
}

export function setTension(t: number) {
  tension = t;
}

function blip(freq: number, dur: number, type: OscillatorType = "square", vol = 0.08) {
  const c = ensure();
  if (!c || !sfxGain || muted) return;
  if (c.state === "suspended") void c.resume();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  o.connect(g);
  g.connect(sfxGain);
  o.start();
  o.stop(c.currentTime + dur);
}

export function sfxClick() {
  blip(520, 0.06, "square", 0.05);
}

export function sfxStamp() {
  blip(180, 0.18, "triangle", 0.09);
  blip(90, 0.22, "sine", 0.07);
}

export function sfxWin() {
  blip(440, 0.2, "sine", 0.08);
  setTimeout(() => blip(554, 0.24, "sine", 0.08), 120);
  setTimeout(() => blip(659, 0.4, "sine", 0.09), 240);
}

export function sfxLose() {
  blip(220, 0.4, "sawtooth", 0.07);
  setTimeout(() => blip(164, 0.5, "sine", 0.08), 160);
}
