let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let pad: OscillatorNode[] = [];
let muted = false;
let musicVol = 0.45;
let sfxVol = 0.7;

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    musicGain = ctx.createGain();
    sfxGain = ctx.createGain();
    musicGain.connect(master);
    sfxGain.connect(master);
    master.connect(ctx.destination);
    apply();
  }
  return ctx;
}

function apply() {
  if (!master || !musicGain || !sfxGain) return;
  master.gain.value = muted ? 0 : 1;
  musicGain.gain.value = musicVol;
  sfxGain.gain.value = sfxVol;
}

export function resumeAudio() {
  const c = ensure();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  startPad();
}

function startPad() {
  const c = ensure();
  if (!c || !musicGain || pad.length) return;
  const freqs = [110, 164.81, 196, 246.94];
  pad = freqs.map((f, i) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = i % 2 ? "triangle" : "sine";
    o.frequency.value = f;
    g.gain.value = 0.04 + i * 0.008;
    o.connect(g);
    g.connect(musicGain!);
    o.start();
    return o;
  });
}

export function setMuted(v: boolean) {
  muted = v;
  apply();
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
  const c = ensure();
  if (!c || !pad[0]) return;
  const detune = (t / 100) * 28;
  pad.forEach((o, i) => {
    o.detune.setTargetAtTime(detune * (i + 1) * 0.4, c.currentTime, 0.4);
  });
}

function blip(freq: number, dur: number, type: OscillatorType = "square", vol = 0.08) {
  const c = ensure();
  if (!c || !sfxGain || muted) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = vol;
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
