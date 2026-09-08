import { ATLAS, MAP_H, MAP_W, rolePatron } from "./atlas";
import { COMPACT_DOCTRINE, DIRECTORATE_DOCTRINE } from "./names";
import { clamp, randRange, rngFrom, type Rng } from "./rng";
import type { Country, Difficulty, Faction, Side, World } from "./types";

export { MAP_H, MAP_W };

export function generateWorld(seed: string, difficulty: Difficulty, playerSide: Side): World {
  const rng = rngFrom(seed, 0x51ed);
  const countries: Country[] = ATLAS.map((a) => {
    const isSuper: 0 | 1 | 2 = a.role === "compact_core" ? 1 : a.role === "directorate_core" ? 2 : 0;
    const patron = rolePatron(a.role);
    const leanJitter = a.role === "neutral" ? randRange(rng, -16, 16) : randRange(rng, -4, 4);
    let alignment = clamp(a.lean + leanJitter, -100, 100);
    if (isSuper === 1) alignment = 100;
    if (isSuper === 2) alignment = -100;
    if (patron === 1 && !isSuper) alignment = clamp(alignment, 72, 90);
    if (patron === 2 && !isSuper) alignment = clamp(alignment, -90, -72);
    if (!patron && !isSuper) alignment = clamp(alignment, -48, 48);

    const areaScale = Math.sqrt(Math.max(400, a.area));
    const pop =
      a.area *
      (isSuper === 1 ? 0.92 : isSuper === 2 ? 0.38 : 0.62) *
      randRange(rng, 0.9, 1.1);
    const industry =
      areaScale *
      (isSuper === 1 ? 4.4 : isSuper === 2 ? 2.6 : patron ? 2.2 : 1.9) *
      randRange(rng, 0.88, 1.12);

    const moraleBase = isSuper ? 78 : patron ? 58 : 52;
    const stabBase = isSuper ? 82 : patron ? 64 : 54;
    const econBase = clamp(38 + industry / 18, 28, 88);

    return {
      id: a.id,
      name: a.name,
      adjective: a.adjective,
      capital: a.capital,
      cx: a.cx,
      cy: a.cy,
      area: a.area,
      pop,
      industry,
      gov: a.gov,
      alignment,
      opinionA: clamp(50 + alignment * 0.32 + randRange(rng, -5, 5), 10, 92),
      opinionB: clamp(50 - alignment * 0.32 + randRange(rng, -5, 5), 10, 92),
      loyalty: isSuper ? 100 : patron ? 72 : 36,
      unrest: randRange(rng, 10, 24) + (a.gov === "junta" ? 10 : 0),
      military: isSuper ? randRange(rng, 42, 54) : patron ? randRange(rng, 14, 26) : randRange(rng, 6, 18),
      spyA: isSuper === 1 ? 22 : patron === 1 ? 12 : 0,
      spyB: isSuper === 2 ? 22 : patron === 2 ? 12 : 0,
      exposedA: false,
      exposedB: false,
      isSuper,
      patron,
      rogue: false,
      morale: clamp(moraleBase + randRange(rng, -10, 10), 18, 92),
      stability: clamp(stabBase + randRange(rng, -8, 8) - (a.gov === "junta" ? 14 : 0), 18, 94),
      economy: clamp(econBase + randRange(rng, -8, 8), 16, 92),
      neighbors: a.neighbors.slice(),
    };
  });

  markRogue(countries, difficulty, playerSide, rng);

  if (difficulty === "easy") {
    const home = countries[playerSide === "compact" ? 0 : 14]!;
    home.industry *= 1.22;
    home.morale = clamp(home.morale + 8, 0, 100);
    home.economy = clamp(home.economy + 8, 0, 100);
  }
  if (difficulty === "hard") {
    const rival = countries[playerSide === "compact" ? 14 : 0]!;
    const you = countries[playerSide === "compact" ? 0 : 14]!;
    rival.industry *= 1.28;
    you.industry *= 0.9;
  }

  const compactForces = difficulty === "easy" ? (playerSide === "compact" ? 58 : 46) : difficulty === "hard" ? (playerSide === "compact" ? 40 : 64) : 52;
  const dirForces = difficulty === "easy" ? (playerSide === "directorate" ? 58 : 46) : difficulty === "hard" ? (playerSide === "directorate" ? 40 : 64) : 52;

  const world: World = {
    seed,
    difficulty,
    playerSide,
    year: 1,
    maxYear: 20,
    eraYear: 1947,
    width: MAP_W,
    height: MAP_H,
    countries,
    compact: {
      side: "compact",
      name: "Atlantic Compact",
      short: "Compact",
      doctrine: COMPACT_DOCTRINE,
      homelandId: 1,
      pc: 0,
      prestige: 54,
      forces: compactForces,
      nuclear: compactForces > 55 ? 18 : 8,
      stability: 72,
    },
    directorate: {
      side: "directorate",
      name: "Continental Directorate",
      short: "Directorate",
      doctrine: DIRECTORATE_DOCTRINE,
      homelandId: 15,
      pc: 0,
      prestige: 54,
      forces: dirForces,
      nuclear: dirForces > 55 ? 18 : 8,
      stability: 72,
    },
    tension: difficulty === "hard" ? 28 : 18,
    intelOnRival: difficulty === "easy" ? 35 : 12,
    consecutiveLead: 0,
    cables: [],
    cableSeq: 1,
  };
  grantIncome(world);
  return world;
}

function markRogue(countries: Country[], difficulty: Difficulty, playerSide: Side, rng: Rng) {
  const candidates = countries.filter((c) => !c.isSuper && c.patron);
  const prefer = countries.find((c) => ATLAS[c.id - 1]?.rogueCandidate && c.patron) ?? pickSat(candidates, rng);
  if (!prefer) return;

  let rogue = prefer;
  if (difficulty === "easy") {
    rogue = candidates.find((c) => c.patron !== (playerSide === "compact" ? 1 : 2)) ?? prefer;
  } else if (difficulty === "hard") {
    rogue = candidates.find((c) => c.patron === (playerSide === "compact" ? 1 : 2)) ?? prefer;
  }
  rogue.rogue = true;
  rogue.loyalty = clamp(rogue.loyalty - 28, 28, 48);
  rogue.morale = clamp(rogue.morale - 22, 22, 42);
  rogue.stability = clamp(rogue.stability - 18, 26, 44);
  rogue.unrest = clamp(rogue.unrest + 16, 0, 70);
}

function pickSat(list: Country[], rng: Rng): Country | undefined {
  if (!list.length) return undefined;
  return list[Math.floor(rng() * list.length)];
}

export function countryWeight(c: Country): number {
  return c.pop * 0.4 + c.industry * 0.6;
}

export function campOf(c: Country): "compact" | "directorate" | "neutral" {
  if (c.isSuper === 1 || c.patron === 1) return "compact";
  if (c.isSuper === 2 || c.patron === 2) return "directorate";
  return "neutral";
}

export function stanceOf(c: Country): "core" | "satellite" | "neutral" {
  if (c.isSuper) return "core";
  if (c.patron) return "satellite";
  return "neutral";
}

export function isSatellite(c: Country, side?: Side): boolean {
  if (c.isSuper || !c.patron) return false;
  if (side === "compact") return c.patron === 1;
  if (side === "directorate") return c.patron === 2;
  return true;
}

export function factionOf(world: World, side: Side): Faction {
  return side === "compact" ? world.compact : world.directorate;
}

export function rivalSide(side: Side): Side {
  return side === "compact" ? "directorate" : "compact";
}

export function blocScore(world: World, side: Side): { weight: number; sats: number; leaning: number } {
  const want = side === "compact" ? 1 : 2;
  const sign = side === "compact" ? 1 : -1;
  let weight = 0;
  let sats = 0;
  let leaning = 0;
  for (const c of world.countries) {
    const w = countryWeight(c);
    if (c.isSuper === want) weight += w;
    else if (c.patron === want) {
      sats++;
      weight += w * (c.rogue ? 0.7 : 1);
    } else if (!c.patron && c.alignment * sign >= 28) {
      leaning++;
      weight += w * 0.35;
    }
  }
  return { weight, sats, leaning };
}

export function worldWeight(world: World): number {
  return world.countries.reduce((s, c) => s + countryWeight(c), 0);
}

export function grantIncome(world: World) {
  const diffBonus = (side: Side) => {
    if (world.difficulty === "easy") return world.playerSide === side ? 2 : 0;
    if (world.difficulty === "hard") return world.playerSide === side ? 0 : 1;
    return 0;
  };
  for (const side of ["compact", "directorate"] as const) {
    const f = factionOf(world, side);
    const { sats } = blocScore(world, side);
    const home = world.countries[f.homelandId - 1]!;
    f.pc = clamp(Math.round(5 + home.industry / 70 + sats * 0.5 + diffBonus(side)), 4, 12);
  }
}

export function warPower(world: World, side: Side): number {
  const f = factionOf(world, side);
  let p = f.forces;
  for (const c of world.countries) {
    if (isSatellite(c, side)) p += c.military * (c.rogue ? 0.25 : 0.45);
  }
  p *= 0.6 + f.stability / 200;
  return p;
}

export function estimatedRivalForces(world: World): number {
  const rival = rivalSide(world.playerSide);
  return clamp(factionOf(world, rival).forces, 0, 100);
}

export function seedLabel(): string {
  const n = Math.floor(Math.random() * 9000 + 1000);
  const words = ["PACT", "BLOC", "FROST", "WIRE", "GULF", "ASH", "VEIL", "DOCK"];
  const w = words[Math.floor(Math.random() * words.length)]!;
  return `${w}-${n}`;
}

export function coupRisk(c: Country): "ripe" | "unsteady" | "firm" {
  if (c.isSuper) return "firm";
  if (c.morale < 34 && c.stability < 40) return "ripe";
  if (c.morale < 46 || c.stability < 48 || c.unrest > 58) return "unsteady";
  return "firm";
}

export function diktatWillSnap(c: Country): boolean {
  if (c.isSuper || c.patron) return false;
  const gate = c.rogue ? 62 : 50;
  return c.stability < gate;
}

/**
 * Homeland floors. Superpowers do not fall at 40 — that is a client number.
 * Expert pass: 28 / 26 / 24. Warning band 14 points above, so a creak is
 * visible for years before the era ends. Tuned against siege / pry / idle /
 * AI-vs-AI; collapse should be a campaign, neglect should still lose.
 */
export const CORE_BREAK = { morale: 28, stability: 26, economy: 24 } as const;
export const CORE_WARN = { morale: 42, stability: 40, economy: 36 } as const;

export type CoreVital = "morale" | "stability" | "economy";
export type CoreVitalState = "firm" | "warn" | "break";

export function homelandOf(world: World, side: Side): Country {
  return world.countries[factionOf(world, side).homelandId - 1]!;
}

export function coreHealth(c: Country): number {
  return c.morale + c.stability + c.economy;
}

export function vitalSlack(c: Country, k: CoreVital): number {
  return c[k] - CORE_BREAK[k];
}

export function worstVital(c: Country): CoreVital {
  const hits: CoreVital[] = ["morale", "stability", "economy"];
  hits.sort((a, b) => vitalSlack(c, a) - vitalSlack(c, b));
  return hits[0]!;
}

export function brokenVital(c: Country): CoreVital | null {
  const hits: { k: CoreVital; slack: number }[] = [];
  if (c.morale <= CORE_BREAK.morale) hits.push({ k: "morale", slack: c.morale - CORE_BREAK.morale });
  if (c.stability <= CORE_BREAK.stability) hits.push({ k: "stability", slack: c.stability - CORE_BREAK.stability });
  if (c.economy <= CORE_BREAK.economy) hits.push({ k: "economy", slack: c.economy - CORE_BREAK.economy });
  if (!hits.length) return null;
  hits.sort((a, b) => a.slack - b.slack);
  return hits[0]!.k;
}

export function warnedVital(c: Country): CoreVital | null {
  const broken = brokenVital(c);
  if (broken) return broken;
  const hits: { k: CoreVital; slack: number }[] = [];
  if (c.morale <= CORE_WARN.morale) hits.push({ k: "morale", slack: c.morale - CORE_WARN.morale });
  if (c.stability <= CORE_WARN.stability) hits.push({ k: "stability", slack: c.stability - CORE_WARN.stability });
  if (c.economy <= CORE_WARN.economy) hits.push({ k: "economy", slack: c.economy - CORE_WARN.economy });
  if (!hits.length) return null;
  hits.sort((a, b) => a.slack - b.slack);
  return hits[0]!.k;
}

export function coreVitalState(c: Country): CoreVitalState {
  if (brokenVital(c)) return "break";
  if (warnedVital(c)) return "warn";
  return "firm";
}
