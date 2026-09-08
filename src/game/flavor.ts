import {
  CORE_BREAK,
  blocScore,
  campOf,
  coreVitalState,
  factionOf,
  homelandOf,
  rivalSide,
  stanceOf,
  warPower,
} from "./generateWorld";
import type { Country, Side, World } from "./types";

export function portrayal(c: Country, side: Side): string {
  const op = side === "compact" ? c.opinionA : c.opinionB;
  const mine = campOf(c) === side;
  if (c.isSuper === (side === "compact" ? 1 : 2)) {
    return "Homeland papers treat policy as weather: inevitable, argued, endured. The bloc stands or it falls.";
  }
  if (c.isSuper) {
    return "Their official press describes you as the other pole of a dangerous world. The core will not be talked out of itself.";
  }
  if (c.patron && mine && op >= 62) {
    return "Communiqués hail you as a fraternal partner. The portraits are already up.";
  }
  if (c.patron && mine && op < 40) {
    return "The cabinet complies. Murals in the side streets call it occupation.";
  }
  if (c.patron && !mine) {
    return c.rogue
      ? "A rogue client of the other pole. The lock is cheap. Courtesy at the door; the street is already shopping."
      : "A client of the other pole. Courtesy at the door; the lock is theirs.";
  }
  if (c.morale < 34 && c.stability < 40) {
    return "Morale is spent and the cabinet cannot hold a room. Colonels are taking tea with someone.";
  }
  if (c.alignment * (side === "compact" ? 1 : -1) >= 28 && op >= 58) {
    return "Editorials name you the safer patron. That is not the same as a treaty.";
  }
  if (c.alignment * (side === "compact" ? 1 : -1) <= -28 && op < 35) {
    return "State radio paints you as the principal threat to sovereignty.";
  }
  if ((side === "compact" ? c.spyA : c.spyB) > 42) {
    return "Ministers smile in public and change locks after dusk.";
  }
  if (c.unrest > 58) {
    return "Cabinets fall. Crowds gather. Everyone is shopping for a sponsor.";
  }
  if (op > 60) {
    return "Your ambassador is received at the front stair. The other side uses the tradesman's.";
  }
  return "The foreign ministry receives both blocs with identical, exhausting courtesy.";
}

export function tensionStage(t: number): { label: string; idx: number } {
  if (t < 20) return { label: "Détente", idx: 0 };
  if (t < 40) return { label: "Frost", idx: 1 };
  if (t < 62) return { label: "Crisis", idx: 2 };
  if (t < 85) return { label: "Brink", idx: 3 };
  return { label: "War fuse", idx: 4 };
}

export function warOutlook(player: number, rival: number, intel: number): string {
  if (intel < 18) return "Estimates are thin. Do not bet a civilization on this.";
  const r = player / Math.max(8, rival);
  if (r >= 1.35) return "If the fuse burns, the staff thinks you hold the field.";
  if (r >= 1.12) return "A conventional war would likely lean your way — at ruinous cost.";
  if (r >= 0.9) return "The boards are even. A hot war would be a coin toss soaked in blood.";
  if (r >= 0.72) return "The other side would probably take the opening campaigns.";
  return "A war tonight would go badly. Deterrence is not a slogan. Build it.";
}

export function statusLine(c: Country): string {
  const stance = stanceOf(c);
  if (stance === "core") return c.isSuper === 1 ? "Compact core territory" : "Directorate core territory";
  if (c.patron === 1) return c.rogue ? "Compact satellite · rogue" : "Compact satellite";
  if (c.patron === 2) return c.rogue ? "Directorate satellite · rogue" : "Directorate satellite";
  const a = Math.round(c.alignment);
  if (a >= 18) return `Non-aligned · leans Compact ${a}`;
  if (a <= -18) return `Non-aligned · leans Directorate ${-a}`;
  return "Non-aligned";
}

export function leanCaption(c: Country): string {
  if (c.isSuper) {
    const st = coreVitalState(c);
    if (st === "break") return "The homeland is failing. The bloc cannot hold.";
    if (st === "warn") return "The homeland is creaking. One of the three numbers is the era.";
    return `A monolithic homeland. If morale, stability, or the shops fall to ${CORE_BREAK.morale}/${CORE_BREAK.stability}/${CORE_BREAK.economy}, the bloc falls.`;
  }
  if (c.patron) {
    return c.rogue
      ? `Rogue client of the ${c.patron === 1 ? "Compact" : "Directorate"}. Loyalty is a rumour.`
      : `Client of the ${c.patron === 1 ? "Compact" : "Directorate"}. Robust — until pried.`;
  }
  const a = Math.round(c.alignment);
  if (Math.abs(a) < 8) return "Even. A Broadcast will show.";
  return a > 0 ? `Lean Compact ${a}` : `Lean Directorate ${-a}`;
}

export function deskOutlook(world: World): string {
  const you = world.playerSide;
  const home = homelandOf(world, you);
  const sats = blocScore(world, you).sats;
  const st = coreVitalState(home);
  if (st === "warn" || st === "break") {
    return `Homeland ${st === "break" ? "failing" : "creaking"} — morale ${Math.round(home.morale)}, stability ${Math.round(home.stability)}, economy ${Math.round(home.economy)}. Below the floor, the era ends.`;
  }
  if (sats === 1) return "Last satellite. If they walk, you stand alone.";
  const theirSats = blocScore(world, rivalSide(you)).sats;
  if (theirSats === 1) return "They have one client left. Pry it and they stand alone.";
  return warOutlook(warPower(world, you), warPower(world, rivalSide(you)), world.intelOnRival);
}

export function sideName(world: World, side: Side): string {
  return factionOf(world, side).name;
}
