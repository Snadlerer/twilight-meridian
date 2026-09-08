export const COL = {
  ocean: [22, 48, 54] as const,
  oceanLine: [58, 92, 96] as const,
  compact: [118, 156, 186] as const,
  compactDeep: [38, 82, 128] as const,
  directorate: [176, 92, 84] as const,
  directorateDeep: [132, 42, 38] as const,
  neutral: [196, 184, 156] as const,
  parchment: [214, 208, 196] as const,
  ink: [18, 16, 14] as const,
  coast: [210, 198, 168] as const,
  gold: [196, 168, 104] as const,
  crisis: [184, 92, 74] as const,
};

export function mix3(
  a: readonly [number, number, number] | [number, number, number],
  b: readonly [number, number, number] | [number, number, number],
  t: number,
): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function rgb(c: readonly [number, number, number] | [number, number, number], a?: number): string {
  if (a == null) return `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
  return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
}

export function alignmentRgb(alignment: number): [number, number, number] {
  if (alignment >= 0) return mix3(COL.neutral, COL.compact, Math.min(1, alignment / 100));
  return mix3(COL.neutral, COL.directorate, Math.min(1, -alignment / 100));
}

export function nationRgb(c: {
  isSuper: 0 | 1 | 2;
  patron: 0 | 1 | 2;
  alignment: number;
  rogue?: boolean;
}): [number, number, number] {
  if (c.isSuper === 1) return [...COL.compactDeep];
  if (c.isSuper === 2) return [...COL.directorateDeep];
  if (c.patron === 1) return c.rogue ? mix3(COL.compact, COL.gold, 0.28) : [...COL.compact];
  if (c.patron === 2) return c.rogue ? mix3(COL.directorate, COL.gold, 0.28) : [...COL.directorate];
  const lean = Math.max(-1, Math.min(1, c.alignment / 42));
  if (lean >= 0) return mix3(COL.neutral, COL.compact, lean * 0.55);
  return mix3(COL.neutral, COL.directorate, -lean * 0.55);
}
