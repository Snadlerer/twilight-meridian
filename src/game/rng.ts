export type Rng = () => number;

function hashSeed(seed: string, salt: number): number {
  let h = salt >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 2654435761);
  }
  return h >>> 0;
}

export function rngFrom(seed: string, salt = 0): Rng {
  let s = hashSeed(seed, salt) || 0x9e3779b9;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

export function randRange(rng: Rng, a: number, b: number): number {
  return a + (b - a) * rng();
}

export function chance(rng: Rng, p: number): boolean {
  return rng() < p;
}

export function pick<T>(rng: Rng, list: T[]): T | undefined {
  if (!list.length) return undefined;
  return list[Math.floor(rng() * list.length)];
}
