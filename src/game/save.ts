import type { Op, World } from "./types";

const KEY = "twilight-meridian-v3";

export interface SaveBlob {
  v: 3;
  world: World;
  ops: Op[];
}

export function persistGame(world: World, ops: Op[]) {
  try {
    const blob: SaveBlob = { v: 3, world, ops };
    localStorage.setItem(KEY, JSON.stringify(blob));
  } catch {
    /* quota */
  }
}

export function loadGame(): SaveBlob | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SaveBlob;
    if (parsed?.v !== 3 || !parsed.world?.countries?.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* */
  }
}

export function hasSave(): boolean {
  return loadGame() != null;
}
