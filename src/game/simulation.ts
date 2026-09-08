import { portrayal } from "./flavor";
import {
  blocScore,
  brokenVital,
  campOf,
  coreHealth,
  coreVitalState,
  coupRisk,
  diktatWillSnap,
  factionOf,
  grantIncome,
  homelandOf,
  isSatellite,
  rivalSide,
  warPower,
  worldWeight,
  CORE_BREAK,
  CORE_WARN,
  type CoreVital,
} from "./generateWorld";
import { chance, clamp, pick, randRange, type Rng } from "./rng";
import type { BeatKind, Cable, Country, Ending, Op, OpType, Side, World, YearBeat, YearReport } from "./types";
import { OP_COST, OP_PAIR } from "./types";

function nation(world: World, id: number): Country {
  return world.countries[id - 1]!;
}

function snapOf(c: Country) {
  return {
    morale: c.morale,
    stability: c.stability,
    economy: c.economy,
    alignment: c.alignment,
    unrest: c.unrest,
    loyalty: c.loyalty,
  };
}

function cable(world: World, text: string, tone: Cable["tone"]): Cable {
  return { id: world.cableSeq++, year: world.eraYear + world.year - 1, text, tone };
}

function push(world: World, yearCables: Cable[], text: string, tone: Cable["tone"] = "neutral") {
  const c = cable(world, text, tone);
  world.cables.unshift(c);
  yearCables.push(c);
  if (world.cables.length > 80) world.cables.length = 80;
}

function spyOf(c: Country, side: Side): number {
  return side === "compact" ? c.spyA : c.spyB;
}
function setSpy(c: Country, side: Side, v: number) {
  if (side === "compact") c.spyA = clamp(v, 0, 100);
  else c.spyB = clamp(v, 0, 100);
}
function opinionOf(c: Country, side: Side): number {
  return side === "compact" ? c.opinionA : c.opinionB;
}
function addOpinion(c: Country, side: Side, d: number) {
  if (side === "compact") c.opinionA = clamp(c.opinionA + d, 0, 100);
  else c.opinionB = clamp(c.opinionB + d, 0, 100);
}
function signOf(side: Side): number {
  return side === "compact" ? 1 : -1;
}
function patronOf(side: Side): 1 | 2 {
  return side === "compact" ? 1 : 2;
}

function leanPhrase(n: number): string {
  const a = Math.round(n);
  if (a >= 8) return `Compact +${a}`;
  if (a <= -8) return `Directorate +${-a}`;
  return `even (${a})`;
}

function bindSatellite(c: Country, side: Side): boolean {
  if (c.isSuper) return false;
  const want = patronOf(side);
  if (c.patron === want) return false;
  c.patron = want;
  c.alignment = side === "compact" ? 82 : -82;
  c.loyalty = c.rogue ? 48 : 70;
  c.unrest = clamp(c.unrest + 10, 0, 100);
  c.stability = clamp(c.stability - 6, 8, 100);
  if (side === "compact") c.spyA = Math.max(c.spyA, 10);
  else c.spyB = Math.max(c.spyB, 10);
  return true;
}

function breakSatellite(c: Country): boolean {
  if (c.isSuper || !c.patron) return false;
  const was = c.patron;
  c.patron = 0;
  c.alignment = was === 1 ? 18 : -18;
  c.loyalty = 26;
  c.unrest = clamp(c.unrest, 36, 70);
  c.morale = clamp(c.morale - 6, 8, 100);
  return true;
}

function swayNeutral(c: Country, side: Side, delta: number) {
  if (c.isSuper || c.patron) return;
  const mul = 1 + (100 - c.morale) / 220;
  c.alignment = clamp(c.alignment + delta * mul * signOf(side), -68, 68);
}

function addBeat(
  beats: YearBeat[],
  c: Country,
  kind: BeatKind,
  blocked: boolean,
  title: string,
  detail: string,
  side: Side | undefined,
  snap: { morale: number; stability: number; economy: number; alignment: number; unrest: number; loyalty: number },
) {
  beats.push({
    nationId: c.id,
    name: c.name,
    kind,
    side,
    blocked,
    title,
    detail,
    deltas: {
      morale: Math.round(c.morale - snap.morale) || undefined,
      stability: Math.round(c.stability - snap.stability) || undefined,
      economy: Math.round(c.economy - snap.economy) || undefined,
      alignment: Math.round(c.alignment - snap.alignment) || undefined,
      unrest: Math.round(c.unrest - snap.unrest) || undefined,
      loyalty: Math.round(c.loyalty - snap.loyalty) || undefined,
    },
  });
}

function opinionSat(c: Country): number {
  if (c.patron === 1) return c.opinionA;
  if (c.patron === 2) return c.opinionB;
  return (c.opinionA + c.opinionB) / 2;
}

function resolveOp(
  world: World,
  op: Op,
  cancelled: Set<string>,
  yearCables: Cable[],
  beats: YearBeat[],
  rng: Rng,
) {
  const c = nation(world, op.nationId);
  const pair = OP_PAIR[op.type];
  const f = factionOf(world, op.side);
  const rival = rivalSide(op.side);
  const you = op.side === world.playerSide;
  const beforeAlign = c.alignment;
  const snap = snapOf(c);
  const rogueBit = c.rogue ? " Rogue client — the lock is cheap." : "";

  if (pair && cancelled.has(`${op.nationId}:${op.type}`)) {
    const ownCoreRadio = op.type === "broadcast" && c.isSuper === patronOf(op.side);
    if (!ownCoreRadio) {
      const title = `${c.name} — jammed`;
      const detail = `Their ${pair} on this desk cancelled the ${op.type}.`;
      push(world, yearCables, `${c.name.toUpperCase()} — ${detail}`, "alert");
      addBeat(beats, c, op.type, true, title, detail, op.side, snap);
      return;
    }
  }

  switch (op.type) {
    case "blackout": {
      cancelled.add(`${c.id}:broadcast`);
      const hit = c.isSuper ? 5 : 4;
      c.morale = clamp(c.morale - hit, 0, 100);
      addOpinion(c, rival, -4);
      const detail = c.isSuper
        ? `Homeland radio dies. Morale ${Math.round(c.morale)}.`
        : "Their radio dies on this desk.";
      push(
        world,
        yearCables,
        `${c.name.toUpperCase()} — Transmitters jammed. ${c.isSuper ? detail : "Their Broadcast on this capital is paper."}`,
        op.side,
      );
      addBeat(beats, c, "blackout", false, `${c.name} — blackout`, detail, op.side, snap);
      break;
    }
    case "defy": {
      cancelled.add(`${c.id}:diktat`);
      c.stability = clamp(c.stability + (c.isSuper ? 8 : 6), 0, 100);
      c.morale = clamp(c.morale + (c.isSuper ? 4 : 3), 0, 100);
      addOpinion(c, op.side, 5);
      push(
        world,
        yearCables,
        `${c.name.toUpperCase()} — The note is refused. A Diktat on this capital will not land.`,
        op.side,
      );
      addBeat(beats, c, "defy", false, `${c.name} — defies`, "The demarche is sent back unopened.", op.side, snap);
      break;
    }
    case "embargo": {
      cancelled.add(`${c.id}:arm`);
      if (c.isSuper) {
        c.economy = clamp(c.economy - 7, 8, 100);
        c.morale = clamp(c.morale - 2, 0, 100);
        c.stability = clamp(c.stability - 1, 8, 100);
      } else {
        c.economy = clamp(c.economy - 10, 8, 100);
        c.morale = clamp(c.morale - 5, 0, 100);
      }
      world.tension = clamp(world.tension + (c.isSuper ? 3.2 : 2.4), 0, 100);
      const d = c.isSuper
        ? `Siege at the homeland docks. Economy ${Math.round(c.economy)}. Morale ${Math.round(c.morale)}.`
        : `Shops empty. Economy ${Math.round(c.economy)}.`;
      push(
        world,
        yearCables,
        `${c.name.toUpperCase()} — Crates stop at the harbour. ${d} Arms will not land.`,
        "alert",
      );
      addBeat(beats, c, "embargo", false, `${c.name} — embargo`, d, op.side, snap);
      break;
    }
    case "counterintel": {
      const before = spyOf(c, rival);
      setSpy(c, rival, before - 22);
      setSpy(c, op.side, spyOf(c, op.side) + 5);
      if (c.patron === patronOf(op.side)) c.loyalty = clamp(c.loyalty + 6, 0, 100);
      c.stability = clamp(c.stability + 3, 0, 100);
      const jammed = c.isSuper || (before > 28 && spyOf(c, rival) < 22);
      if (jammed) {
        cancelled.add(`${c.id}:clandestine`);
        world.intelOnRival = clamp(world.intelOnRival + 8, 0, 100);
        const d = c.isSuper
          ? "Homeland security shuts the door. Their Clandestine here is burnt paper."
          : `A courier is turned. Their Clandestine here is burnt paper. Net ${Math.round(before)} → ${Math.round(spyOf(c, rival))}.`;
        push(world, yearCables, `${c.name.toUpperCase()} — ${d}`, "good");
        addBeat(beats, c, "counterintel", false, `${c.name} — cell rolled up`, d, op.side, snap);
      } else {
        if (you) {
          push(
            world,
            yearCables,
            `${c.name.toUpperCase()} — Watchers on the watchers. Foreign net ${Math.round(before)} → ${Math.round(spyOf(c, rival))}.`,
            op.side,
          );
        }
        addBeat(beats, c, "counterintel", false, `${c.name} — watchers`, `Foreign net ${Math.round(spyOf(c, rival))}.`, op.side, snap);
      }
      break;
    }
    case "broadcast": {
      const bonus = f.prestige / 28 + opinionOf(c, op.side) / 40 + (100 - c.morale) / 50;
      addOpinion(c, op.side, 14 + bonus * 0.4);
      addOpinion(c, rival, -5);
      let leanBit: string;
      if (c.isSuper) {
        if (c.isSuper === patronOf(op.side)) {
          c.morale = clamp(c.morale + 8, 0, 100);
          c.economy = clamp(c.economy + 4, 8, 100);
          c.unrest = clamp(c.unrest - 6, 0, 100);
          f.prestige = clamp(f.prestige + 2, 0, 100);
          leanBit = `Homeland quieted. Morale ${Math.round(c.morale)}. Economy ${Math.round(c.economy)}.`;
        } else {
          c.morale = clamp(c.morale - 3, 0, 100);
          c.stability = clamp(c.stability - 1, 8, 100);
          addOpinion(c, op.side, -8);
          world.tension = clamp(world.tension + 1.6, 0, 100);
          leanBit = `Hostile radio over a homeland. Morale ${Math.round(c.morale)}.`;
        }
      } else {
        c.morale = clamp(c.morale + (c.patron === patronOf(op.side) ? 8 : 6), 0, 100);
        if (c.patron === patronOf(op.side)) {
          c.unrest = clamp(c.unrest - 14, 0, 100);
          c.loyalty = clamp(c.loyalty + 12, 0, 100);
        } else if (c.patron) {
          c.unrest = clamp(c.unrest + 5, 0, 100);
        } else {
          swayNeutral(c, op.side, 22 + bonus * 0.35);
          c.unrest = clamp(c.unrest - 6, 0, 100);
        }
        const moved = Math.round(c.alignment - beforeAlign);
        leanBit = c.patron
          ? c.patron === patronOf(op.side)
            ? `Client quieted. Loyalty ${Math.round(c.loyalty)}. Morale ${Math.round(c.morale)}.`
            : "The cabinet does not move. The street listens."
          : `Lean ${leanPhrase(beforeAlign)} → ${leanPhrase(c.alignment)}${moved ? ` (${moved > 0 ? "+" : ""}${moved})` : ""}. Morale ${Math.round(c.morale)}.`;
      }
      f.prestige = clamp(f.prestige + 1.6, 0, 100);
      world.tension = clamp(world.tension - (c.isSuper && c.isSuper !== patronOf(op.side) ? 0 : 0.8), 0, 100);
      if (you || spyOf(c, world.playerSide) > 18) {
        push(world, yearCables, `${c.name.toUpperCase()} — Cultural mission. ${leanBit} “${portrayal(c, op.side).split(".")[0]}.”`, op.side);
      }
      addBeat(beats, c, "broadcast", false, `${c.name} — on the air`, leanBit, op.side, snap);
      break;
    }
    case "diktat": {
      if (c.isSuper) {
        push(world, yearCables, `${c.name.toUpperCase()} — A demarche at a homeland desk. The core does not blink.`, "alert");
        addBeat(beats, c, "diktat", true, `${c.name} — core holds`, "A homeland does not take dictation.", op.side, snap);
        break;
      }
      addOpinion(c, op.side, -16);
      c.unrest = clamp(c.unrest + 12, 0, 100);
      c.morale = clamp(c.morale - 8, 0, 100);
      f.prestige = clamp(f.prestige - 3.6, 0, 100);
      world.tension = clamp(world.tension + 5.2, 0, 100);
      if (c.patron === patronOf(op.side)) {
        c.loyalty = clamp(c.loyalty - 10, 12, 100);
        c.stability = clamp(c.stability - 4, 8, 100);
        const d = `Conditions on your own client. Loyalty ${Math.round(c.loyalty)}.`;
        push(world, yearCables, `${c.name.toUpperCase()} — ${d}`, "alert");
        addBeat(beats, c, "diktat", false, `${c.name} — browbeaten`, d, op.side, snap);
      } else if (c.patron) {
        const hit = c.rogue ? 28 : 16;
        c.loyalty = clamp(c.loyalty - hit, 0, 100);
        c.stability = clamp(c.stability - (c.rogue ? 12 : 6), 8, 100);
        c.unrest = clamp(c.unrest + 8, 0, 100);
        if (c.loyalty < (c.rogue ? 40 : 28)) {
          breakSatellite(c);
          bindSatellite(c, op.side);
          const d = `The old patron is shown the door.${rogueBit} Now a ${f.short} satellite.`;
          push(world, yearCables, `${c.name.toUpperCase()} — ${d}`, "alert");
          addBeat(beats, c, "diktat", false, `${c.name} — letterhead changes`, d, op.side, snap);
        } else {
          const d = `Demarche at a locked capital. Loyalty ${Math.round(c.loyalty)}. Stability ${Math.round(c.stability)}. Not enough.`;
          push(world, yearCables, `${c.name.toUpperCase()} — ${d}`, "alert");
          addBeat(beats, c, "diktat", false, `${c.name} — holds the treaty`, d, op.side, snap);
        }
      } else if (diktatWillSnap(c)) {
        bindSatellite(c, op.side);
        const d = `Forced into the ${f.short} column. Stability was ${Math.round(snap.stability)}. Satellite.`;
        push(world, yearCables, `${c.name.toUpperCase()} — ${d}`, "alert");
        addBeat(beats, c, "diktat", false, `${c.name} — snapped`, d, op.side, snap);
      } else {
        swayNeutral(c, op.side, 10);
        c.stability = clamp(c.stability - 8, 8, 100);
        const d = `The cabinet refuses the note. Stability ${Math.round(c.stability)} still too firm to snap. Lean ${leanPhrase(c.alignment)}.`;
        push(world, yearCables, `${c.name.toUpperCase()} — ${d}`, "alert");
        addBeat(beats, c, "diktat", false, `${c.name} — resists`, d, op.side, snap);
      }
      if (f.prestige < 34) {
        for (const n of world.countries) {
          if (!n.patron && !n.isSuper) addOpinion(n, op.side, -2);
        }
      }
      break;
    }
    case "clandestine": {
      setSpy(c, op.side, spyOf(c, op.side) + 18);
      const net = spyOf(c, op.side);
      const detect =
        0.08 + spyOf(c, rival) / 260 + factionOf(world, rival).prestige / 420 + (c.gov === "party-state" ? 0.04 : 0);
      if (chance(rng, detect)) {
        f.prestige = clamp(f.prestige - 8, 0, 100);
        addOpinion(c, op.side, -14);
        setSpy(c, op.side, net * 0.45);
        world.tension = clamp(world.tension + 3.5, 0, 100);
        if (op.side === "compact") c.exposedA = true;
        else c.exposedB = true;
        push(world, yearCables, `SCANDAL — ${c.capital} names a ${f.short} rezidentura. A cultural attaché is declared persona non grata.`, "alert");
        addBeat(beats, c, "clandestine", true, `${c.name} — scandal`, "A Minox on a night desk. The papers have the name.", op.side, snap);
        break;
      }
      if (c.isSuper) {
        if (c.isSuper === patronOf(op.side)) {
          c.stability = clamp(c.stability + 2, 0, 100);
          if (you) push(world, yearCables, `${c.name.toUpperCase()} — Watchers in the homeland. The ministries stay watched.`, op.side);
          addBeat(beats, c, "clandestine", false, `${c.name} — watched`, "Watchers among the ministries.", op.side, snap);
        } else {
          c.stability = clamp(c.stability - 4, 8, 100);
          c.morale = clamp(c.morale - 1, 0, 100);
          if (op.side === world.playerSide) world.intelOnRival = clamp(world.intelOnRival + 6, 0, 100);
          const d = `A cell in the ministries. Stability ${Math.round(c.stability)}. Morale ${Math.round(c.morale)}.`;
          if (you) push(world, yearCables, `${c.name.toUpperCase()} — ${d}`, op.side);
          addBeat(beats, c, "clandestine", false, `${c.name} — a cell`, d, op.side, snap);
        }
        break;
      }
      const ripe = coupRisk(c) === "ripe";
      if (ripe && !c.isSuper) {
        runCoup(world, c, op.side, rng, yearCables, beats, snap);
        break;
      }
      if (c.patron && c.patron !== patronOf(op.side)) {
        const hit = c.rogue ? 34 : 24;
        c.unrest = clamp(c.unrest + (c.rogue ? 20 : 14), 0, 100);
        c.loyalty = clamp(c.loyalty - hit, 0, 100);
        c.morale = clamp(c.morale - 6, 0, 100);
        c.stability = clamp(c.stability - (c.rogue ? 10 : 4), 8, 100);
        if (op.side === world.playerSide) world.intelOnRival = clamp(world.intelOnRival + 5, 0, 100);
        const lock = c.rogue ? 42 : 34;
        if (c.loyalty <= lock && net > 28) {
          breakSatellite(c);
          const d = `The lock gives.${rogueBit} ${c.name} slips to non-aligned (lean ${leanPhrase(c.alignment)}).`;
          push(world, yearCables, `${c.name.toUpperCase()} — ${d}`, "alert");
          addBeat(beats, c, "clandestine", false, `${c.name} — slips the leash`, d, op.side, snap);
        } else {
          const d = `Cells in the unions. Loyalty ${Math.round(c.loyalty)}. Unrest ${Math.round(c.unrest)}.${rogueBit}`;
          if (you || spyOf(c, world.playerSide) > 24) push(world, yearCables, `${c.name.toUpperCase()} — ${d}`, op.side);
          addBeat(beats, c, "clandestine", false, `${c.name} — a network thickens`, d, op.side, snap);
        }
      } else if (c.patron === patronOf(op.side)) {
        setSpy(c, op.side, spyOf(c, op.side) + 6);
        if (you) push(world, yearCables, `${c.name.toUpperCase()} — Watchers among friends. The client stays watched.`, op.side);
        addBeat(beats, c, "clandestine", false, `${c.name} — watched`, "Watchers among friends.", op.side, snap);
      } else {
        swayNeutral(c, op.side, 16 + net / 20);
        c.stability = clamp(c.stability - 5, 8, 100);
        if (op.side === world.playerSide) world.intelOnRival = clamp(world.intelOnRival + 4, 0, 100);
        const d = `Quiet work. Lean ${leanPhrase(beforeAlign)} → ${leanPhrase(c.alignment)}. Network ${Math.round(net)}.`;
        if (you || spyOf(c, world.playerSide) > 20) push(world, yearCables, `${c.name.toUpperCase()} — ${d}`, op.side);
        addBeat(beats, c, "clandestine", false, `${c.name} — quiet work`, d, op.side, snap);
      }
      break;
    }
    case "arm": {
      if (c.isSuper === patronOf(op.side)) {
        f.forces = clamp(f.forces + 8, 0, 100);
        if (f.forces > 62) f.nuclear = clamp(f.nuclear + 4, 0, 100);
        f.stability = clamp(f.stability - 2.2, 0, 100);
        world.tension = clamp(world.tension + 5, 0, 100);
        push(world, yearCables, `${f.short.toUpperCase()} — New formations, new silos. Forces ${Math.round(f.forces)}.`, "alert");
        addBeat(beats, c, "arm", false, `${c.name} — rearming`, `Homeland forces ${Math.round(f.forces)}.`, op.side, snap);
      } else if (c.isSuper) {
        push(world, yearCables, `${c.name.toUpperCase()} — Arms cannot be landed in the other pole's core.`, "alert");
        addBeat(beats, c, "arm", true, `${c.name} — closed harbour`, "You cannot arm their core.", op.side, snap);
      } else {
        c.military = clamp(c.military + 11, 0, 100);
        c.economy = clamp(c.economy - 4, 8, 100);
        if (c.patron === patronOf(op.side)) c.loyalty = clamp(c.loyalty + 10, 0, 100);
        else if (!c.patron) swayNeutral(c, op.side, 10);
        world.tension = clamp(world.tension + 3.4, 0, 100);
        if (coupRisk(c) === "ripe" && c.economy < 40 && chance(rng, 0.45)) {
          runCoup(world, c, op.side, rng, yearCables, beats, snap);
        } else {
          const d = `Crates marked agricultural equipment. Local forces ${Math.round(c.military)}. Economy ${Math.round(c.economy)}.`;
          push(world, yearCables, `${c.name.toUpperCase()} — ${d}`, op.side);
          addBeat(beats, c, "arm", false, `${c.name} — the crates`, d, op.side, snap);
        }
      }
      break;
    }
  }
}

function runCoup(
  world: World,
  c: Country,
  toward: Side,
  rng: Rng,
  yearCables: Cable[],
  beats: YearBeat[],
  snap: ReturnType<typeof snapOf>,
) {
  void rng;
  c.gov = "junta";
  c.unrest = 28;
  c.morale = clamp(c.morale + 8, 0, 100);
  c.stability = clamp(20 + (100 - snap.stability) * 0.2, 18, 48);
  const f = factionOf(world, toward);
  if (c.patron && c.patron !== patronOf(toward)) {
    breakSatellite(c);
    bindSatellite(c, toward);
    const d = `Colonels at dawn. The old patron is out. ${c.name} is now a ${f.short} satellite.`;
    push(world, yearCables, `${c.name.toUpperCase()} — ${d}`, "alert");
    addBeat(beats, c, "coup", false, `${c.name} — a coup`, d, toward, snap);
  } else if (!c.patron) {
    swayNeutral(c, toward, 24);
    if (c.stability < 38) bindSatellite(c, toward);
    const d = c.patron
      ? `A junta signs with the ${f.short}. Satellite.`
      : `Overnight, the palace changes hands. Lean ${leanPhrase(c.alignment)}.`;
    push(world, yearCables, `${c.name.toUpperCase()} — ${d}`, "alert");
    addBeat(beats, c, "coup", false, `${c.name} — a coup`, d, toward, snap);
  } else {
    c.loyalty = clamp(c.loyalty + 8, 0, 100);
    push(world, yearCables, `${c.name.toUpperCase()} — Colonels replace the cabinet. The patron still holds the treaty.`, "alert");
    addBeat(beats, c, "coup", false, `${c.name} — palace coup`, "The patron still holds the treaty.", toward, snap);
  }
}

function passive(world: World, rng: Rng, yearCables: Cable[], beats: YearBeat[]) {
  for (const c of world.countries) {
    if (c.isSuper) {
      c.morale = clamp(c.morale + 1.2, 0, 100);
      c.economy = clamp(c.economy + 0.8, 8, 100);
      c.stability = clamp(c.stability + 0.8, 0, 100);
      continue;
    }
    c.economy = clamp(c.economy + (c.stability - 50) * 0.04, 8, 100);
    c.morale = clamp(c.morale + (c.economy - 45) * 0.03 - c.unrest * 0.02, 8, 100);
    c.stability = clamp(c.stability + (c.morale - 50) * 0.03 - (c.unrest > 60 ? 2 : 0), 8, 100);
    if (!c.patron) {
      let pull = 0;
      let n = 0;
      for (const nid of c.neighbors) {
        const o = nation(world, nid);
        if (o.isSuper) pull += o.alignment * 0.55;
        else if (o.patron) pull += o.alignment * 0.35;
        else pull += o.alignment * 0.2;
        n++;
      }
      if (n) {
        const avg = pull / n;
        c.alignment = clamp(c.alignment + (avg - c.alignment) * 0.05, -68, 68);
      }
      c.unrest = clamp(c.unrest - 1, 0, 100);
    } else {
      const leak = c.rogue ? 6 : 4;
      c.unrest = clamp(c.unrest + (opinionSat(c) < 40 ? leak : -1), 0, 100);
      c.loyalty = clamp(c.loyalty - (c.unrest > 55 ? leak : 0) + (c.unrest < 25 ? 2 : 0), 0, 100);
      if (c.unrest > (c.rogue ? 62 : 80) && c.loyalty < (c.rogue ? 28 : 22) && chance(rng, c.rogue ? 0.28 : 0.16)) {
        const was = c.patron === 1 ? "Compact" : "Directorate";
        const snap = snapOf(c);
        breakSatellite(c);
        const d = `The ${was} client slips its leash.${c.rogue ? " The rogue walks." : ""} Non-aligned.`;
        push(world, yearCables, `${c.name.toUpperCase()} — ${d}`, "alert");
        addBeat(beats, c, "event", false, `${c.name} — slips`, d, undefined, snap);
      }
    }
  }
}

function events(world: World, rng: Rng, yearCables: Cable[], beats: YearBeat[]) {
  const neutrals = world.countries.filter((c) => !c.isSuper && !c.patron);
  const republics = world.countries.filter(
    (c) => !c.isSuper && !c.patron && (c.gov === "republic" || c.gov === "assembly" || c.gov === "federation"),
  );
  if (chance(rng, 0.42) && republics.length) {
    const c = pick(rng, republics)!;
    const snap = snapOf(c);
    const swing = randRange(rng, -14, 14);
    c.alignment = clamp(c.alignment + swing, -68, 68);
    c.unrest = clamp(c.unrest + Math.abs(swing) * 0.3, 0, 100);
    const d = `Ballots in ${c.capital}. Lean ${leanPhrase(snap.alignment)} → ${leanPhrase(c.alignment)}.`;
    push(world, yearCables, `${c.name.toUpperCase()} — ${d}`, "neutral");
    addBeat(beats, c, "election", false, `${c.name} — an election`, d, undefined, snap);
  }
  if (chance(rng, 0.28)) {
    const restless = world.countries.filter((c) => !c.isSuper && (c.unrest > 48 || coupRisk(c) !== "firm"));
    const c = pick(rng, restless.length ? restless : world.countries.filter((n) => !n.isSuper));
    if (c) {
      const snap = snapOf(c);
      c.unrest = clamp(c.unrest + randRange(rng, 6, 14), 0, 100);
      c.morale = clamp(c.morale - 4, 8, 100);
      const d = `Strikes in the yards. Unrest ${Math.round(c.unrest)}.`;
      push(world, yearCables, `${c.name.toUpperCase()} — ${d}`, "alert");
      addBeat(beats, c, "event", false, `${c.name} — unrest`, d, undefined, snap);
    }
  }
  if (chance(rng, 0.22) && neutrals.length) {
    const c = pick(rng, neutrals)!;
    const snap = snapOf(c);
    c.economy = clamp(c.economy + randRange(rng, 4, 10), 8, 100);
    c.morale = clamp(c.morale + 3, 8, 100);
    const d = `A fat harvest. Economy ${Math.round(c.economy)}.`;
    push(world, yearCables, `${c.name.toUpperCase()} — ${d}`, "good");
    addBeat(beats, c, "event", false, `${c.name} — harvest`, d, undefined, snap);
  }
}

function ledgerLine(
  c: Country,
  before: { alignment: number; patron: 0 | 1 | 2; morale: number; stability: number; economy: number },
): string {
  if (c.isSuper) {
    const st = coreVitalState(c);
    const tag = st === "break" ? "FAILING" : st === "warn" ? "creaking" : "firm";
    return `${c.name}: core ${tag}. Morale ${Math.round(c.morale)} · stability ${Math.round(c.stability)} · economy ${Math.round(c.economy)}.`;
  }
  const camp = campOf(c);
  const moved = Math.round(c.alignment - before.alignment);
  const flip = before.patron !== c.patron ? " LETTERHEAD CHANGED." : "";
  return `${c.name}: ${camp}${c.rogue ? " rogue" : ""}. Lean ${Math.round(c.alignment)}${moved ? ` (${moved > 0 ? "+" : ""}${moved})` : ""}. M ${Math.round(c.morale)} · S ${Math.round(c.stability)} · E ${Math.round(c.economy)}.${flip}`;
}

export function resolveYear(world: World, playerOps: Op[], aiOps: Op[], rng: Rng): { world: World; report: YearReport; ending: Ending | null } {
  const next: World = structuredClone(world);
  const yearCables: Cable[] = [];
  const beats: YearBeat[] = [];
  const before = new Map(
    next.countries.map((c) => [
      c.id,
      { alignment: c.alignment, patron: c.patron, morale: c.morale, stability: c.stability, economy: c.economy },
    ]),
  );
  const tensionBefore = next.tension;
  const cancelled = new Set<string>();

  const all = [...playerOps, ...aiOps];
  for (const op of all) {
    const pair = OP_PAIR[op.type];
    if (pair && ["blackout", "defy", "counterintel", "embargo"].includes(op.type)) {
      cancelled.add(`${op.nationId}:${pair}`);
    }
  }

  const order: OpType[] = ["blackout", "defy", "embargo", "counterintel", "clandestine", "broadcast", "arm", "diktat"];
  for (const type of order) {
    for (const op of all) {
      if (op.type === type) resolveOp(next, op, cancelled, yearCables, beats, rng);
    }
  }

  passive(next, rng, yearCables, beats);
  events(next, rng, yearCables, beats);
  creakHomelands(next, before, yearCables, beats);

  const flips = next.countries
    .filter((c) => {
      const b = before.get(c.id);
      return Boolean(b && b.patron !== c.patron);
    })
    .map((c) => {
      const b = before.get(c.id)!;
      return {
        id: c.id,
        name: c.name,
        before: b.alignment,
        after: c.alignment,
        beforePatron: b.patron,
        afterPatron: c.patron,
      };
    });

  const ledger = next.countries.map((c) => ledgerLine(c, before.get(c.id)!));

  next.year += 1;
  next.tension = clamp(Math.round(next.tension), 0, 100);
  grantIncome(next);

  const brink = next.tension >= 100;
  let ending: Ending | null = null;
  if (brink) ending = resolveWar(next, yearCables);
  else ending = checkVictory(next);

  const player = factionOf(next, next.playerSide);
  const report: YearReport = {
    year: next.eraYear + next.year - 2,
    cables: yearCables,
    beats,
    flips,
    ledger,
    tensionBefore,
    tensionAfter: next.tension,
    playerPc: player.pc,
    brink,
  };
  return { world: next, report, ending };
}

function creakHomelands(
  world: World,
  before: Map<number, { morale: number; stability: number; economy: number }>,
  yearCables: Cable[],
  beats: YearBeat[],
) {
  for (const side of ["compact", "directorate"] as const) {
    const c = homelandOf(world, side);
    const prev = before.get(c.id);
    if (!prev) continue;
    const wasWarn =
      prev.morale <= CORE_WARN.morale || prev.stability <= CORE_WARN.stability || prev.economy <= CORE_WARN.economy;
    const now = coreVitalState(c);
    if (now === "warn" && !wasWarn) {
      const snap = { morale: prev.morale, stability: prev.stability, economy: prev.economy, alignment: c.alignment, unrest: c.unrest, loyalty: c.loyalty };
      const d = `${c.name} creaks. Morale ${Math.round(c.morale)} · stability ${Math.round(c.stability)} · economy ${Math.round(c.economy)}. Below the floor, the bloc falls.`;
      push(world, yearCables, `${c.name.toUpperCase()} — ${d}`, "alert");
      addBeat(beats, c, "event", false, `${c.name} — the homeland creaks`, d, undefined, snap);
    }
  }
}

function checkVictory(world: World): Ending | null {
  const you = world.playerSide;
  const them = rivalSide(you);
  const homeYou = homelandOf(world, you);
  const homeThem = homelandOf(world, them);
  const p = blocScore(world, you);
  const r = blocScore(world, them);

  const breakYou = brokenVital(homeYou);
  const breakThem = brokenVital(homeThem);
  if (breakYou && breakThem) {
    const hy = coreHealth(homeYou);
    const ht = coreHealth(homeThem);
    if (Math.abs(hy - ht) < 12 && p.sats === r.sats) {
      return endingOf(
        world,
        "core",
        "none",
        "Both homelands fail",
        "Two cores, two empty streets. There is no meridian left to hold.",
      );
    }
    const loser = hy < ht ? you : them;
    return coreBreakEnding(world, loser, loser === you ? breakYou : breakThem);
  }
  if (breakThem) return coreBreakEnding(world, them, breakThem);
  if (breakYou) return coreBreakEnding(world, you, breakYou);

  if (r.sats === 0 && p.sats === 0) {
    return endingOf(
      world,
      "hollow",
      "none",
      "Two empty rooms",
      "The clients walked. Two homelands remain, and neither owns a world.",
    );
  }
  if (r.sats === 0) return hollowEnding(world, them);
  if (p.sats === 0) return hollowEnding(world, you);

  const total = worldWeight(world);
  const share = p.weight / total;
  const rivalShare = r.weight / total;
  if (share >= 0.58) world.consecutiveLead += 1;
  else world.consecutiveLead = 0;

  if (world.consecutiveLead >= 2) {
    return endingOf(world, "influence", you, "A world that leans", "For two years the greater weight of nations has stood in your column.");
  }
  if (world.year > world.maxYear) {
    if (share >= rivalShare + 0.02) {
      if (world.tension < 28) {
        return endingOf(world, "detente", you, "The fuse unlit", "Twenty winters and no mushroom cloud. You hold the slimmer, colder advantage.");
      }
      return endingOf(world, "clock", you, "The clock runs out", "The era ends with your bloc heavier on the map.");
    }
    if (rivalShare >= share + 0.02) {
      return endingOf(world, "clock", them, "The clock runs out", "The era closes on their terms.");
    }
    return endingOf(world, "detente", "none", "A frozen draw", "Neither bloc owns the meridian.");
  }
  return null;
}

function coreBreakEnding(world: World, loser: Side, vital: CoreVital): Ending {
  const winner = rivalSide(loser);
  const core = homelandOf(world, loser);
  const youLose = loser === world.playerSide;
  const titles: Record<CoreVital, [string, string]> = {
    morale: ["The street goes", "Their street goes"],
    stability: ["The ministries empty", "Their ministries empty"],
    economy: ["The shops close", "Their shops close"],
  };
  const [loseTitle, winTitle] = titles[vital];
  const n = Math.round(vital === "morale" ? core.morale : vital === "stability" ? core.stability : core.economy);
  const body = youLose
    ? `${core.name}'s ${vital} has fallen to ${n}. A homeland below ${CORE_BREAK[vital]} cannot hold a bloc. The other pole takes the room.`
    : `${core.name}'s ${vital} has fallen to ${n} — below ${CORE_BREAK[vital]}. Their core cannot hold. The meridian is yours.`;
  return endingOf(world, "core", winner, youLose ? loseTitle : winTitle, body);
}

function hollowEnding(world: World, loser: Side): Ending {
  const winner = rivalSide(loser);
  const core = homelandOf(world, loser);
  const youLose = loser === world.playerSide;
  return endingOf(
    world,
    "hollow",
    winner,
    youLose ? "You stand alone" : "They stand alone",
    youLose
      ? `The last client has walked. ${core.name} is a homeland without a world.`
      : `Their last satellite has walked. ${core.name} stands alone. The map is yours.`,
  );
}

function resolveWar(world: World, yearCables: Cable[]): Ending | null {
  const a = warPower(world, "compact");
  const b = warPower(world, "directorate");
  if (world.compact.nuclear >= 55 && world.directorate.nuclear >= 55 && world.tension >= 100) {
    return endingOf(world, "mad", "none", "Both clocks strike", "Cities become light. There is no meridian.");
  }
  const ratio = a / Math.max(8, b);
  const winner: Side = ratio >= 1 ? "compact" : "directorate";
  const playerWins = winner === world.playerSide;
  if (ratio > 1.32 || ratio < 0.76) {
    return endingOf(
      world,
      "war",
      winner,
      playerWins ? "A war you were ready for" : "A war you could not win",
      playerWins ? "When the fuse finally burned, the staff's maps were not lying." : "Deterrence was a speech. The other side had the divisions.",
    );
  }
  world.tension = 68;
  world.compact.forces = clamp(world.compact.forces - 16, 8, 100);
  world.directorate.forces = clamp(world.directorate.forces - 16, 8, 100);
  push(world, yearCables, "CEASEFIRE — The opening campaigns stall over the same river. Ambassadors sign in a hurry.", "alert");
  return null;
}

function endingOf(world: World, kind: Ending["kind"], winner: Ending["winner"], title: string, body: string): Ending {
  void world;
  return { kind, winner, title, body };
}

export function spendAndQueue(world: World, ops: Op[], type: Op["type"], nationId: number): Op[] | null {
  const cost = OP_COST[type];
  const f = factionOf(world, world.playerSide);
  if (f.pc < cost) return null;
  f.pc -= cost;
  return [...ops, { side: world.playerSide, type, nationId, cost }];
}

export function refundOp(world: World, ops: Op[], index: number): Op[] {
  const op = ops[index];
  if (!op || op.side !== world.playerSide) return ops;
  factionOf(world, world.playerSide).pc += op.cost;
  return ops.filter((_, i) => i !== index);
}

export { portrayal };
