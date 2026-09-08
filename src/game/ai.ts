import { blocScore, coreVitalState, coupRisk, factionOf, isSatellite, rivalSide, warPower, worstVital } from "./generateWorld";
import { chance, pick, type Rng } from "./rng";
import type { Country, Op, OpType, Side, World } from "./types";
import { OP_COST } from "./types";

export function planAiOps(world: World, rng: Rng): Op[] {
  return planSideOps(world, rivalSide(world.playerSide), rng);
}

export function planSideOps(world: World, side: Side, rng: Rng): Op[] {
  const f = factionOf(world, side);
  let pc = f.pc;
  const ops: Op[] = [];
  const used = new Set<number>();
  const them = rivalSide(side);
  const myPatron = side === "compact" ? 1 : 2;
  const home = world.countries[f.homelandId - 1]!;
  const theirHome = world.countries[factionOf(world, them).homelandId - 1]!;
  const mySats = blocScore(world, side).sats;
  const theirSats = blocScore(world, them).sats;
  const myState = coreVitalState(home);
  const theirState = coreVitalState(theirHome);
  const slipping = home.morale < 58 || home.stability < 58 || home.economy < 54;
  const homeCap = world.difficulty === "hard" && (myState !== "firm" || slipping) ? 2 : 1;
  let homeUsed = 0;

  const scored: { type: OpType; id: number; score: number }[] = [];
  const myPower = warPower(world, side);
  const theirPower = warPower(world, them);
  const behind = myPower < theirPower * 0.92;
  const worst = worstVital(home);
  const warnBoost = myState !== "firm" ? 28 : 0;

  if (myState !== "firm" || slipping) {
    if (worst === "stability") {
      scored.push({ type: "defy", id: home.id, score: 98 + warnBoost });
      scored.push({ type: "broadcast", id: home.id, score: 82 + warnBoost });
    } else {
      scored.push({ type: "broadcast", id: home.id, score: 98 + warnBoost });
      scored.push({ type: "defy", id: home.id, score: 72 + warnBoost });
    }
    scored.push({ type: "counterintel", id: home.id, score: 90 + (myState !== "firm" ? 28 : 0) });
  }

  if (theirState !== "firm") {
    scored.push({ type: "embargo", id: theirHome.id, score: 120 });
    scored.push({ type: "blackout", id: theirHome.id, score: 112 });
    scored.push({ type: "clandestine", id: theirHome.id, score: 108 });
    scored.push({ type: "broadcast", id: theirHome.id, score: 98 });
  } else if (mySats >= 3) {
    scored.push({ type: "embargo", id: theirHome.id, score: 30 + (70 - theirHome.economy) / 2 });
    scored.push({ type: "blackout", id: theirHome.id, score: 22 + (72 - theirHome.morale) / 3 });
  }

  if (mySats <= 1) {
    for (const c of world.countries) {
      if (isSatellite(c, side)) {
        scored.push({ type: "counterintel", id: c.id, score: 132 });
        scored.push({ type: "broadcast", id: c.id, score: 114 });
        scored.push({ type: "defy", id: c.id, score: 88 });
      }
    }
  }
  if (theirSats <= 2) {
    for (const c of world.countries) {
      if (isSatellite(c, them)) {
        scored.push({ type: "clandestine", id: c.id, score: 126 - theirSats * 8 + (c.rogue ? 20 : 0) });
        scored.push({ type: "diktat", id: c.id, score: 78 + (c.rogue ? 22 : 0) });
      }
    }
  }

  for (const c of world.countries) {
    const mine = side === "compact" ? c.alignment : -c.alignment;
    const spyThem = side === "compact" ? c.spyB : c.spyA;
    const risk = coupRisk(c);

    if (c.isSuper === myPatron && behind) {
      scored.push({ type: "arm", id: c.id, score: 70 + (theirPower - myPower) });
    }
    if (isSatellite(c, side)) {
      if (c.rogue || c.unrest > 40 || spyThem > 22) {
        scored.push({ type: "counterintel", id: c.id, score: 80 + (c.rogue ? 18 : 0) + c.unrest / 2 });
        scored.push({ type: "defy", id: c.id, score: 50 + (c.rogue ? 20 : 0) });
        scored.push({ type: "broadcast", id: c.id, score: 48 + (60 - c.loyalty) });
      }
    }
    if (!c.isSuper && !c.patron) {
      scored.push({ type: "broadcast", id: c.id, score: 46 + (c.morale < 40 ? 16 : 0) + (40 - Math.abs(c.alignment)) / 3 });
      scored.push({ type: "blackout", id: c.id, score: 24 + (mine < 0 ? 10 : 0) });
      if (risk === "ripe") scored.push({ type: "clandestine", id: c.id, score: 86 });
      else scored.push({ type: "clandestine", id: c.id, score: 40 + (world.difficulty === "hard" ? 12 : 0) });
      if (c.stability < 50 && f.prestige > 34 && mine > -14) {
        scored.push({ type: "diktat", id: c.id, score: 30 + (c.stability < 38 ? 28 : 0) + (mine > 18 ? 16 : 0) });
      }
      if (c.economy < 40) scored.push({ type: "embargo", id: c.id, score: 22 });
    }
    if (isSatellite(c, them)) {
      const pry = c.rogue ? 28 : 0;
      scored.push({ type: "clandestine", id: c.id, score: 58 + pry + c.unrest / 3 + (c.loyalty < 50 ? 12 : 0) });
      scored.push({ type: "embargo", id: c.id, score: 26 + pry });
      if (c.rogue || c.stability < 42) scored.push({ type: "diktat", id: c.id, score: 44 + pry });
    }
    if (c.patron === myPatron && !c.isSuper) scored.push({ type: "arm", id: c.id, score: 28 });
    if (spyThem > 35) scored.push({ type: "counterintel", id: c.id, score: 55 + spyThem / 2 });
  }

  if (behind) scored.push({ type: "arm", id: f.homelandId, score: 86 });
  if (mySats >= 3 && f.prestige < 42) {
    const n = pick(
      rng,
      world.countries.filter((c) => !c.isSuper && !c.patron),
    );
    if (n) scored.push({ type: "broadcast", id: n.id, score: 60 });
  }

  scored.sort((a, b) => b.score - a.score + (rng() - 0.5) * 6);

  for (const s of scored) {
    const cost = OP_COST[s.type];
    if (pc < cost) continue;
    if (s.id === home.id) {
      if (homeUsed >= homeCap) continue;
    } else if (used.has(s.id)) continue;
    if (s.type === "diktat" && f.prestige < 28 && chance(rng, 0.55)) continue;
    ops.push({ side, type: s.type, nationId: s.id, cost });
    if (s.id === home.id) homeUsed += 1;
    else used.add(s.id);
    pc -= cost;
    if (ops.length >= 5 || pc < 2) break;
  }

  if (ops.length === 0) {
    const c: Country =
      world.countries.find((n) => n.rogue && n.patron !== myPatron) ??
      world.countries.find((n) => !n.isSuper && !n.patron) ??
      world.countries[f.homelandId - 1]!;
    const type: OpType = pc >= 3 ? "clandestine" : "broadcast";
    const cost = OP_COST[type];
    if (pc >= cost) ops.push({ side, type, nationId: c.id, cost });
  }

  f.pc = pc;
  return ops;
}
