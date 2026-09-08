import { useEffect, type ReactNode } from "react";
import { Menu, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NationPanel } from "@/components/game/NationPanel";
import { TitleScreen } from "@/components/game/TitleScreen";
import { WorldMap } from "@/components/game/WorldMap";
import { deskOutlook, tensionStage } from "@/game/flavor";
import { blocScore, CORE_BREAK, coreVitalState, factionOf, homelandOf, rivalSide, worldWeight } from "@/game/generateWorld";
import { persistGame } from "@/game/save";
import { resumeAudio } from "@/game/audio";
import { useGame } from "@/game/store";
import { OP_LABEL, type EndingKind, type YearBeat } from "@/game/types";
import { cn } from "@/lib/cn";

export function GameApp() {
  const phase = useGame((s) => s.phase);
  const boot = useGame((s) => s.boot);
  const briefing = useGame((s) => s.briefing);
  const selectedId = useGame((s) => s.selectedId);
  const advanceBeat = useGame((s) => s.advanceBeat);

  useEffect(() => {
    boot();
    const unlock = () => resumeAudio();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    const onVis = () => {
      if (document.visibilityState === "visible") resumeAudio();
      const { world, ops, phase: p } = useGame.getState();
      if (world && p !== "title") persistGame(world, ops);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [boot]);

  useEffect(() => {
    if (phase !== "playback") return;
    const id = window.setInterval(() => advanceBeat(), 1300);
    return () => window.clearInterval(id);
  }, [phase, advanceBeat]);

  if (phase === "title") {
    return (
      <>
        <TitleScreen />
        {briefing ? <BriefingModal /> : null}
      </>
    );
  }

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-ink text-parchment">
      <TopBar />
      <div className="relative grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="relative min-h-0 min-w-0">
          <WorldMap />
          <div className="pointer-events-none absolute inset-x-3 top-3 z-[1] lg:inset-x-4">
            <BlocMeter />
          </div>
          {phase === "playback" ? <PlaybackBanner /> : null}
          {selectedId ? (
            <div className="absolute inset-x-0 bottom-0 z-10 max-h-[72%] lg:hidden">
              <NationPanel />
            </div>
          ) : null}
        </div>
        <div className="hidden min-h-0 lg:block">
          <NationPanel />
        </div>
      </div>
      <BottomBar />
      {phase === "report" ? <ReportModal /> : null}
      {phase === "ended" ? <EndingModal /> : null}
      {briefing && phase === "playing" ? <BriefingModal /> : null}
      <SettingsDrawer />
    </div>
  );
}

function TopBar() {
  const world = useGame((s) => s.world)!;
  const muted = useGame((s) => s.muted);
  const toggleMute = useGame((s) => s.toggleMute);
  const setSettingsOpen = useGame((s) => s.setSettingsOpen);
  const you = factionOf(world, world.playerSide);
  const rival = factionOf(world, rivalSide(world.playerSide));
  const stage = tensionStage(world.tension);
  const outlook = deskOutlook(world);
  const home = homelandOf(world, world.playerSide);
  const homeWarn = coreVitalState(home) !== "firm";

  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-parchment/10 bg-ink-2 px-3 py-2 sm:px-4">
      <img
        src={world.playerSide === "compact" ? "/emblems/compact.jpg" : "/emblems/directorate.jpg"}
        alt=""
        className="size-8 rounded-full object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <h1 className="font-display truncate text-lg leading-none">Twilight Meridian</h1>
          <span className="font-mono hidden text-[11px] text-muted sm:inline">
            {world.eraYear + world.year - 1} · Y{world.year}/{world.maxYear}
          </span>
        </div>
        <p className={cn("truncate text-[11px]", homeWarn ? "text-crisis" : "text-muted")}>{outlook}</p>
      </div>
      <div className="hidden items-center gap-4 md:flex">
        <Meter label="Influence" value={you.pc} max={12} />
        <Meter label="Prestige" value={Math.round(you.prestige)} max={100} />
        <Meter label="Forces" value={Math.round(you.forces)} max={100} />
        <Meter label={stage.label} value={Math.round(world.tension)} max={100} danger={world.tension > 62} />
      </div>
      <button
        type="button"
        className="flex size-11 items-center justify-center rounded-[var(--radius-sm)] border border-parchment/15"
        onClick={toggleMute}
        aria-label={muted ? "Unmute" : "Mute"}
      >
        {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
      </button>
      <button
        type="button"
        className="flex size-11 items-center justify-center rounded-[var(--radius-sm)] border border-parchment/15"
        onClick={() => setSettingsOpen(true)}
        aria-label="Menu"
      >
        <Menu className="size-4" />
      </button>
      <span className="sr-only">Rival forces {Math.round(rival.forces)}</span>
    </header>
  );
}

function Meter({ label, value, max, danger }: { label: string; value: number; max: number; danger?: boolean }) {
  return (
    <div className="w-24">
      <div className="flex justify-between font-mono text-[10px] tracking-wide text-muted uppercase">
        <span>{label}</span>
        <span className="tabular-nums text-parchment">{value}</span>
      </div>
      <div className="meter mt-1">
        <span className={danger ? "bg-crisis" : "bg-parchment/70"} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
      </div>
    </div>
  );
}

function BlocMeter() {
  const world = useGame((s) => s.world);
  if (!world) return null;
  const aScore = blocScore(world, "compact");
  const bScore = blocScore(world, "directorate");
  const total = worldWeight(world);
  const a = aScore.weight;
  const b = bScore.weight;
  const ap = (a / total) * 100;
  const bp = (b / total) * 100;
  const np = 100 - ap - bp;
  return (
    <div className="pointer-events-auto hud-panel rounded-[var(--radius-md)] px-3 py-2">
      <div className="mb-1 flex justify-between font-mono text-[10px] tracking-wider text-muted uppercase">
        <span>Compact {Math.round(ap)}% · {aScore.sats} sat</span>
        <span>Unaligned {Math.round(np)}%</span>
        <span>Directorate {Math.round(bp)}% · {bScore.sats} sat</span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full">
        <div className="bg-compact" style={{ width: `${ap}%` }} />
        <div className="bg-parchment/25" style={{ width: `${np}%` }} />
        <div className="bg-directorate" style={{ width: `${bp}%` }} />
      </div>
      <ul className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-parchment/80">
        <li className="flex items-center gap-1.5">
          <span className="inline-flex overflow-hidden rounded-[2px] border border-parchment/25">
            <span className="block size-2.5 bg-compact-deep" />
            <span className="block size-2.5 bg-directorate-deep" />
          </span>
          Core
        </li>
        <li className="flex items-center gap-1.5">
          <span className="inline-flex overflow-hidden rounded-[2px] border border-parchment/25">
            <span className="hatch-swatch block size-2.5 bg-compact" />
            <span className="hatch-swatch block size-2.5 bg-directorate" />
          </span>
          Satellite
        </li>
        <li className="flex items-center gap-1.5">
          <span className="block size-2.5 rounded-[2px] border border-parchment/25 bg-neutral-land" />
          Neutral
        </li>
        <li className="flex items-center gap-1.5">
          <span className="block size-2.5 rounded-[2px] border border-dashed border-warn bg-warn/40" />
          Rogue
        </li>
      </ul>
    </div>
  );
}

function BottomBar() {
  const world = useGame((s) => s.world)!;
  const ops = useGame((s) => s.ops);
  const endYear = useGame((s) => s.endYear);
  const skipPlayback = useGame((s) => s.skipPlayback);
  const phase = useGame((s) => s.phase);
  const you = factionOf(world, world.playerSide);
  const stage = tensionStage(world.tension);
  return (
    <footer className="flex shrink-0 items-center gap-3 border-t border-parchment/10 bg-ink-2 px-3 py-2 sm:px-4">
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[11px] text-muted">
          {phase === "playback"
            ? "The year is landing on the map."
            : `${ops.length} op${ops.length === 1 ? "" : "s"} queued · ${you.pc} influence held`}
        </p>
        <p className="truncate text-xs text-subtle md:hidden">
          {stage.label} {Math.round(world.tension)} · Forces {Math.round(you.forces)}
        </p>
      </div>
      {phase === "playback" ? (
        <Button size="lg" className="shrink-0 whitespace-nowrap" variant="ghost" onClick={skipPlayback}>
          Skip to cables
        </Button>
      ) : (
        <Button size="lg" className="shrink-0 whitespace-nowrap" disabled={phase !== "playing"} onClick={endYear}>
          Close the year
        </Button>
      )}
    </footer>
  );
}

function PlaybackBanner() {
  const report = useGame((s) => s.report);
  const beatIndex = useGame((s) => s.beatIndex);
  const skipPlayback = useGame((s) => s.skipPlayback);
  const beat = report?.beats[beatIndex];
  if (!beat) return null;
  return (
    <div className="pointer-events-auto absolute inset-x-3 bottom-3 z-[2] lg:inset-x-4">
      <button type="button" onClick={skipPlayback} className="hud-panel w-full rounded-[var(--radius-md)] px-4 py-3 text-left">
        <p className="font-mono text-[10px] tracking-[0.2em] text-muted uppercase">
          {beat.blocked ? "Blocked" : beatKindLabel(beat)} · {beatIndex + 1}/{report.beats.length}
        </p>
        <p className="font-display mt-0.5 text-xl leading-tight">{beat.title}</p>
        <p className="mt-1 text-sm text-parchment/80">{beat.detail}</p>
        <DeltaRow beat={beat} />
      </button>
    </div>
  );
}

function beatKindLabel(b: YearBeat): string {
  if (b.kind === "coup") return "Coup";
  if (b.kind === "election") return "Election";
  if (b.kind === "event") return "Incident";
  return OP_LABEL[b.kind as keyof typeof OP_LABEL] ?? b.kind;
}

function DeltaRow({ beat }: { beat: YearBeat }) {
  const d = beat.deltas;
  const bits = [
    d.alignment != null ? `lean ${fmt(d.alignment)}` : null,
    d.morale != null ? `morale ${fmt(d.morale)}` : null,
    d.stability != null ? `stability ${fmt(d.stability)}` : null,
    d.economy != null ? `economy ${fmt(d.economy)}` : null,
    d.loyalty != null ? `loyalty ${fmt(d.loyalty)}` : null,
    d.unrest != null ? `unrest ${fmt(d.unrest)}` : null,
  ].filter(Boolean);
  if (!bits.length) return null;
  return <p className="mt-1 font-mono text-[11px] text-muted">{bits.join(" · ")}</p>;
}

function fmt(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}

function ReportModal() {
  const report = useGame((s) => s.report);
  const dismissReport = useGame((s) => s.dismissReport);
  if (!report) return null;
  return (
    <Modal onClose={dismissReport}>
      <p className="font-mono text-[11px] tracking-[0.22em] text-muted uppercase">Year closed · {report.year}</p>
      <h2 className="font-display mt-1 text-3xl">The year in full</h2>
      <p className="mt-1 text-sm text-muted">
        Tension {Math.round(report.tensionBefore)} → {Math.round(report.tensionAfter)} · Influence restored to {report.playerPc}
      </p>
      {report.flips.length ? (
        <p className="mt-3 text-sm">
          The map moved:{" "}
          {report.flips
            .map((f) => {
              const to =
                f.afterPatron === 1 ? "a Compact satellite" : f.afterPatron === 2 ? "a Directorate satellite" : "non-aligned";
              return `${f.name} is now ${to}`;
            })
            .join("; ")}
          .
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted">No capitals changed letterheads.</p>
      )}
      <p className="mt-4 font-mono text-[10px] tracking-[0.2em] text-muted uppercase">Every desk</p>
      <ul className="mt-2 max-h-[28vh] space-y-1 overflow-y-auto text-xs leading-snug text-parchment/80">
        {(report.ledger ?? []).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className="mt-4 font-mono text-[10px] tracking-[0.2em] text-muted uppercase">Cables</p>
      <ul className="mt-2 max-h-[22vh] space-y-2 overflow-y-auto font-mono text-xs leading-relaxed">
        {report.cables.length === 0 ? <li className="text-muted">A quiet year. That is not nothing.</li> : null}
        {report.cables.map((c) => (
          <li
            key={c.id}
            className={cn(
              "border-l-2 pl-3",
              c.tone === "alert" && "border-crisis",
              c.tone === "good" && "border-parchment",
              c.tone === "compact" && "border-compact",
              c.tone === "directorate" && "border-directorate",
              c.tone === "neutral" && "border-parchment/30",
            )}
          >
            {c.text}
          </li>
        ))}
      </ul>
      <Button className="mt-6 w-full" onClick={dismissReport}>
        Return to the board
      </Button>
    </Modal>
  );
}

const KIND_LABEL: Record<EndingKind, string> = {
  hollow: "Last satellite",
  core: "Homeland collapse",
  influence: "Weight of nations",
  collapse: "Collapse",
  war: "Hot war",
  mad: "Both clocks",
  clock: "The clock",
  detente: "Détente",
};

function EndingModal() {
  const ending = useGame((s) => s.ending);
  const world = useGame((s) => s.world);
  const toTitle = useGame((s) => s.toTitle);
  if (!ending || !world) return null;
  const youWin = ending.winner === world.playerSide;
  const you = world.playerSide;
  const them = rivalSide(you);
  const p = blocScore(world, you);
  const r = blocScore(world, them);
  const hy = homelandOf(world, you);
  const ht = homelandOf(world, them);
  return (
    <Modal onClose={toTitle}>
      <p className="font-mono text-[11px] tracking-[0.22em] text-muted uppercase">
        {youWin ? "You hold the meridian" : ending.winner === "none" ? "No winner" : "The era is lost"}
        {" · "}
        {KIND_LABEL[ending.kind]}
      </p>
      <h2 className="font-display mt-2 text-4xl">{ending.title}</h2>
      <p className="mt-4 text-sm leading-relaxed text-parchment/85">{ending.body}</p>
      <p className="mt-4 font-mono text-xs text-muted">
        You {p.sats} sat · they {r.sats} sat. {hy.name} {Math.round(hy.morale)}/{Math.round(hy.stability)}/{Math.round(hy.economy)} ·{" "}
        {ht.name} {Math.round(ht.morale)}/{Math.round(ht.stability)}/{Math.round(ht.economy)}. Floors {CORE_BREAK.morale}/{CORE_BREAK.stability}/
        {CORE_BREAK.economy}.
      </p>
      <div className="mt-6">
        <BlocMeter />
      </div>
      <Button className="mt-6 w-full" onClick={toTitle}>
        Return to the room
      </Button>
    </Modal>
  );
}

function BriefingModal() {
  const setBriefing = useGame((s) => s.setBriefing);
  return (
    <Modal onClose={() => setBriefing(false)}>
      <p className="font-mono text-[11px] tracking-[0.22em] text-muted uppercase">Standing orders</p>
      <h2 className="font-display mt-1 text-3xl">How the room works</h2>
      <ol className="mt-4 list-decimal space-y-3 pl-4 text-sm leading-relaxed text-parchment/85">
        <li>
          This is a staff atlas, not a generated scribble. Deep ink is a <strong className="text-parchment">core</strong>.
          Hatch is a <strong className="text-parchment">satellite</strong>. Khaki is a <strong className="text-parchment">neutral</strong>{" "}
          with its own sympathy. Gold dashed border is the <strong className="text-parchment">rogue</strong> — a client the other pole can steal.
        </li>
        <li>
          Every nation has <strong className="text-parchment">morale, stability, and an economy</strong>. Soft morale
          listens to Broadcast. Soft stability snaps to Diktat. Both soft, plus empty shops, invites a coup.
        </li>
        <li>
          Every pressure has a counter on the same capital: Broadcast / Blackout, Diktat / Defy, Clandestine /
          Counter-intel, Arms / Embargo. Play the counter where you think they will strike.
        </li>
        <li>
          The era ends two ways. A bloc with <strong className="text-parchment">no satellites</strong> stands
          alone and loses. A homeland whose <strong className="text-parchment">morale, stability, or economy</strong>{" "}
          falls through the floor ({CORE_BREAK.morale} / {CORE_BREAK.stability} / {CORE_BREAK.economy}) takes the whole
          pole with it. The other pole wins.
        </li>
        <li>
          Close the year. Pressures land on the map first — then the cables, then a desk-by-desk ledger of every
          nation.
        </li>
      </ol>
      <Button className="mt-6 w-full" onClick={() => setBriefing(false)}>
        Understood
      </Button>
    </Modal>
  );
}

function SettingsDrawer() {
  const open = useGame((s) => s.settingsOpen);
  const setSettingsOpen = useGame((s) => s.setSettingsOpen);
  const music = useGame((s) => s.music);
  const sfx = useGame((s) => s.sfx);
  const setMusic = useGame((s) => s.setMusic);
  const setSfx = useGame((s) => s.setSfx);
  const toTitle = useGame((s) => s.toTitle);
  const world = useGame((s) => s.world);
  if (!open) return null;
  return (
    <Modal onClose={() => setSettingsOpen(false)}>
      <h2 className="font-display text-3xl">The desk</h2>
      <label className="mt-5 block text-sm">
        Orchestra
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={music}
          onChange={(e) => setMusic(Number(e.target.value))}
          className="mt-2 w-full accent-parchment"
        />
      </label>
      <label className="mt-4 block text-sm">
        Signals
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={sfx}
          onChange={(e) => setSfx(Number(e.target.value))}
          className="mt-2 w-full accent-parchment"
        />
      </label>
      {world ? (
        <p className="mt-4 font-mono text-xs text-muted">
          Seed {world.seed} · {world.difficulty} · {world.playerSide}
        </p>
      ) : null}
      <div className="mt-6 flex flex-col gap-2">
        <Button variant="ghost" onClick={() => setSettingsOpen(false)}>
          Resume
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setSettingsOpen(false);
            toTitle();
          }}
        >
          Abandon the board
        </Button>
      </div>
    </Modal>
  );
}

function Modal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 p-3 sm:items-center">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Dismiss" onClick={onClose} />
      <div className="hud-panel relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-[var(--radius-xl)] p-5 sm:p-7">
        <button
          type="button"
          className="absolute top-3 right-3 flex size-10 items-center justify-center text-muted hover:text-parchment"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
        {children}
      </div>
    </div>
  );
}
