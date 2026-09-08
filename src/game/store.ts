import { create } from "zustand";
import { planAiOps } from "./ai";
import { resumeAudio, setMusic as setMusicVol, setMuted, setSfx as setSfxVol, setTension, sfxClick, sfxLose, sfxStamp, sfxWin } from "./audio";
import { generateWorld, seedLabel } from "./generateWorld";
import { rngFrom } from "./rng";
import { clearSave, hasSave as peekSave, loadGame, persistGame } from "./save";
import { refundOp, resolveYear, spendAndQueue } from "./simulation";
import type { Difficulty, Ending, Op, OpType, Phase, Side, World, YearReport } from "./types";

interface GameState {
  phase: Phase;
  world: World | null;
  ops: Op[];
  selectedId: number | null;
  hoverId: number | null;
  briefing: boolean;
  ending: Ending | null;
  report: YearReport | null;
  beatIndex: number;
  muted: boolean;
  music: number;
  sfx: number;
  settingsOpen: boolean;
  sideDraft: Side;
  difficulty: Difficulty;
  seedDraft: string;
  hasSave: boolean;
  generating: boolean;
  boot: () => void;
  startGame: (opts?: { resume?: boolean }) => void;
  select: (id: number | null) => void;
  hover: (id: number | null) => void;
  queue: (type: OpType, nationId: number) => void;
  cancelOp: (index: number) => void;
  endYear: () => void;
  advanceBeat: () => void;
  skipPlayback: () => void;
  dismissReport: () => void;
  toTitle: () => void;
  toggleMute: () => void;
  setMusic: (v: number) => void;
  setSfx: (v: number) => void;
  setSettingsOpen: (v: boolean) => void;
  setBriefing: (v: boolean) => void;
  setSideDraft: (s: Side) => void;
  setDifficulty: (d: Difficulty) => void;
  setSeedDraft: (s: string) => void;
}

export const useGame = create<GameState>((set, get) => ({
  phase: "title",
  world: null,
  ops: [],
  selectedId: null,
  hoverId: null,
  briefing: false,
  ending: null,
  report: null,
  beatIndex: 0,
  muted: false,
  music: 0.45,
  sfx: 0.7,
  settingsOpen: false,
  sideDraft: "compact",
  difficulty: "medium",
  seedDraft: seedLabel(),
  hasSave: false,
  generating: false,

  boot: () => {
    set({ hasSave: peekSave() });
  },

  startGame: (opts) => {
    resumeAudio();
    sfxStamp();
    if (opts?.resume) {
      const save = loadGame();
      if (save) {
        setTension(save.world.tension);
        set({
          world: save.world,
          ops: save.ops,
          phase: "playing",
          selectedId: save.world.playerSide === "compact" ? save.world.compact.homelandId : save.world.directorate.homelandId,
          briefing: false,
          ending: null,
          report: null,
          beatIndex: 0,
          hasSave: true,
        });
        return;
      }
    }
    set({ generating: true });
    window.setTimeout(() => {
      const { sideDraft, difficulty, seedDraft } = get();
      const world = generateWorld(seedDraft.trim() || seedLabel(), difficulty, sideDraft);
      persistGame(world, []);
      setTension(world.tension);
      set({
        world,
        ops: [],
        phase: "playing",
        selectedId: world.playerSide === "compact" ? world.compact.homelandId : world.directorate.homelandId,
        generating: false,
        beatIndex: 0,
        ending: null,
        briefing: true,
        hasSave: true,
        report: null,
      });
    }, 40);
  },

  select: (id) => {
    sfxClick();
    set({ selectedId: id });
  },
  hover: (id) => set({ hoverId: id }),

  queue: (type, nationId) => {
    const { world, ops } = get();
    if (!world || get().phase !== "playing") return;
    const next = spendAndQueue(world, ops, type, nationId);
    if (!next) return;
    sfxClick();
    persistGame(world, next);
    set({ world: { ...world }, ops: next });
  },

  cancelOp: (index) => {
    const { world, ops } = get();
    if (!world) return;
    const next = refundOp(world, ops, index);
    persistGame(world, next);
    set({ world: { ...world }, ops: next });
  },

  endYear: () => {
    const { world, ops } = get();
    if (!world || get().phase !== "playing") return;
    sfxStamp();
    const rng = rngFrom(world.seed, 0xa11e ^ world.year * 7919);
    const ai = planAiOps(world, rng);
    const { world: next, report, ending } = resolveYear(world, ops, ai, rng);
    setTension(next.tension);
    persistGame(next, []);
    if (ending && ending.kind !== "war" && report.beats.length === 0) {
      if (ending.winner === next.playerSide) sfxWin();
      else sfxLose();
      clearSave();
      set({ world: next, ops: [], report, ending, phase: "ended", hasSave: false, beatIndex: 0 });
      return;
    }
    if (ending) clearSave();
    set({
      world: next,
      ops: [],
      report,
      ending,
      phase: report.beats.length ? "playback" : ending ? "ended" : "report",
      beatIndex: 0,
      hasSave: !ending,
      selectedId: get().selectedId,
    });
  },

  advanceBeat: () => {
    const { report, beatIndex, ending } = get();
    if (!report) return;
    if (beatIndex + 1 >= report.beats.length) {
      if (ending) {
        if (ending.winner === get().world?.playerSide) sfxWin();
        else sfxLose();
        set({ phase: "ended" });
      } else set({ phase: "report" });
      return;
    }
    set({ beatIndex: beatIndex + 1 });
  },

  skipPlayback: () => {
    const { ending } = get();
    if (ending) {
      if (ending.winner === get().world?.playerSide) sfxWin();
      else sfxLose();
      set({ phase: "ended" });
    } else set({ phase: "report" });
  },

  dismissReport: () => set({ phase: "playing", report: null }),

  toTitle: () => {
    set({
      phase: "title",
      world: null,
      ops: [],
      ending: null,
      report: null,
      briefing: false,
      settingsOpen: false,
      hasSave: peekSave(),
      seedDraft: seedLabel(),
    });
  },

  toggleMute: () => {
    const next = !get().muted;
    setMuted(next);
    set({ muted: next });
  },
  setMusic: (v) => {
    setMusicVol(v);
    set({ music: v });
  },
  setSfx: (v) => {
    setSfxVol(v);
    set({ sfx: v });
  },
  setSettingsOpen: (v) => set({ settingsOpen: v }),
  setBriefing: (v) => set({ briefing: v }),
  setSideDraft: (s) => set({ sideDraft: s }),
  setDifficulty: (d) => set({ difficulty: d }),
  setSeedDraft: (s) => set({ seedDraft: s }),
}));
