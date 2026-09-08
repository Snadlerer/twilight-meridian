export type Difficulty = "easy" | "medium" | "hard";
export type Side = "compact" | "directorate";
export type Gov =
  | "republic"
  | "federation"
  | "kingdom"
  | "junta"
  | "assembly"
  | "party-state"
  | "mandate";

export type OpType =
  | "broadcast"
  | "blackout"
  | "diktat"
  | "defy"
  | "clandestine"
  | "counterintel"
  | "arm"
  | "embargo";

export type Phase = "title" | "playing" | "playback" | "report" | "brink" | "ended";

export interface Country {
  id: number;
  name: string;
  adjective: string;
  capital: string;
  cx: number;
  cy: number;
  area: number;
  pop: number;
  industry: number;
  gov: Gov;
  alignment: number;
  opinionA: number;
  opinionB: number;
  loyalty: number;
  unrest: number;
  military: number;
  spyA: number;
  spyB: number;
  exposedA: boolean;
  exposedB: boolean;
  isSuper: 0 | 1 | 2;
  patron: 0 | 1 | 2;
  rogue: boolean;
  morale: number;
  stability: number;
  economy: number;
  neighbors: number[];
}

export interface Faction {
  side: Side;
  name: string;
  short: string;
  doctrine: string;
  homelandId: number;
  pc: number;
  prestige: number;
  forces: number;
  nuclear: number;
  stability: number;
}

export interface Cable {
  id: number;
  year: number;
  text: string;
  tone: "neutral" | "compact" | "directorate" | "alert" | "good";
}

export interface Op {
  side: Side;
  type: OpType;
  nationId: number;
  cost: number;
}

export type BeatKind = OpType | "coup" | "election" | "event" | "quiet";

export interface YearBeat {
  nationId: number;
  name: string;
  kind: BeatKind;
  side?: Side;
  blocked: boolean;
  title: string;
  detail: string;
  deltas: {
    morale?: number;
    stability?: number;
    economy?: number;
    alignment?: number;
    unrest?: number;
    loyalty?: number;
  };
}

export interface World {
  seed: string;
  difficulty: Difficulty;
  playerSide: Side;
  year: number;
  maxYear: number;
  eraYear: number;
  width: number;
  height: number;
  countries: Country[];
  compact: Faction;
  directorate: Faction;
  tension: number;
  intelOnRival: number;
  consecutiveLead: number;
  cables: Cable[];
  cableSeq: number;
}

export type EndingKind = "influence" | "collapse" | "hollow" | "core" | "war" | "mad" | "clock" | "detente";

export interface Ending {
  kind: EndingKind;
  winner: Side | "none";
  title: string;
  body: string;
}

export interface YearReport {
  year: number;
  cables: Cable[];
  beats: YearBeat[];
  flips: {
    id: number;
    name: string;
    before: number;
    after: number;
    beforePatron: 0 | 1 | 2;
    afterPatron: 0 | 1 | 2;
  }[];
  ledger: string[];
  tensionBefore: number;
  tensionAfter: number;
  playerPc: number;
  brink: boolean;
}

export const OP_COST: Record<OpType, number> = {
  broadcast: 2,
  blackout: 2,
  diktat: 2,
  defy: 2,
  clandestine: 3,
  counterintel: 2,
  arm: 3,
  embargo: 2,
};

export const OP_LABEL: Record<OpType, string> = {
  broadcast: "Broadcast",
  blackout: "Blackout",
  diktat: "Diktat",
  defy: "Defy",
  clandestine: "Clandestine",
  counterintel: "Counter-intel",
  arm: "Arms",
  embargo: "Embargo",
};

export const OP_HINT: Record<OpType, string> = {
  broadcast: "Swing a neutral. Brittle morale listens harder.",
  blackout: "Jam their radio. Counters Broadcast on this capital.",
  diktat: "Force a letterhead. Low stability snaps. High stability resists.",
  defy: "Refuse the note. Counters Diktat on this capital.",
  clandestine: "Steal lean, or pry a client. Weak morale invites a coup.",
  counterintel: "Hunt their cell. Counters Clandestine here.",
  arm: "Guns for a client — or the core. Empty shops make colonels ambitious.",
  embargo: "Stop the crates. Counters Arms. Bites their economy.",
};

export const OP_PAIR: Record<OpType, OpType | null> = {
  broadcast: "blackout",
  blackout: "broadcast",
  diktat: "defy",
  defy: "diktat",
  clandestine: "counterintel",
  counterintel: "clandestine",
  arm: "embargo",
  embargo: "arm",
};

export const PRESSURES: OpType[] = ["broadcast", "diktat", "clandestine", "arm"];
export const COUNTERS: OpType[] = ["blackout", "defy", "counterintel", "embargo"];

export const GOV_LABEL: Record<Gov, string> = {
  republic: "Republic",
  federation: "Federation",
  kingdom: "Kingdom",
  junta: "Junta",
  assembly: "Assembly",
  "party-state": "Party-state",
  mandate: "Mandate",
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Advantage",
  medium: "Parity",
  hard: "Underdog",
};

export const DIFFICULTY_BLURB: Record<Difficulty, string> = {
  easy: "You hold the upper hand — more industry, more clients. Their rogue is leaking.",
  medium: "The meridian is even. Wesfeld is the rogue client. Either pole can take it.",
  hard: "They already own the room. Your rogue will be the first door they try.",
};
