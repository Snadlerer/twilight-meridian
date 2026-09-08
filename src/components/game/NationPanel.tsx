import { Button } from "@/components/ui/button";
import { leanCaption, portrayal, statusLine } from "@/game/flavor";
import { CORE_BREAK, CORE_WARN, coreVitalState, coupRisk, diktatWillSnap, factionOf, rivalSide, stanceOf } from "@/game/generateWorld";
import { COUNTERS, GOV_LABEL, OP_COST, OP_HINT, OP_LABEL, PRESSURES, type Country, type OpType } from "@/game/types";
import { useGame } from "@/game/store";
import { cn } from "@/lib/cn";

export function NationPanel() {
  const world = useGame((s) => s.world);
  const selectedId = useGame((s) => s.selectedId);
  const ops = useGame((s) => s.ops);
  const queue = useGame((s) => s.queue);
  const cancelOp = useGame((s) => s.cancelOp);
  const phase = useGame((s) => s.phase);
  const select = useGame((s) => s.select);
  if (!world || !selectedId) {
    return (
      <aside className="hud-panel hidden h-full overflow-y-auto rounded-[var(--radius-lg)] p-4 lg:block">
        <p className="font-display text-lg">Select a nation</p>
        <p className="mt-2 text-sm text-muted">Tap the atlas. Read morale, stability, and the shops before you press.</p>
      </aside>
    );
  }
  const c = world.countries[selectedId - 1];
  if (!c) return null;
  const you = world.playerSide;
  const rival = rivalSide(you);
  const f = factionOf(world, you);
  const queuedHere = ops
    .map((o, i) => ({ o, i }))
    .filter(({ o }) => o.nationId === c.id && o.side === you);
  const alignPct = (c.alignment + 100) / 2;
  const spyYou = you === "compact" ? c.spyA : c.spyB;
  const spyThem = you === "compact" ? c.spyB : c.spyA;
  const knowThem = spyYou > 22 || (you === "compact" ? c.exposedB : c.exposedA);
  const stance = stanceOf(c);
  const youPatron = you === "compact" ? 1 : 2;
  const risk = coupRisk(c);
  const playing = phase === "playing";

  return (
    <aside className="hud-panel flex max-h-full min-h-0 flex-col overflow-hidden rounded-[var(--radius-lg)]">
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <p className="font-mono text-[10px] tracking-[0.22em] text-muted uppercase">{statusLine(c)}</p>
        <h2 className="font-display mt-1 text-2xl leading-tight">{c.name}</h2>
        <p className="text-sm text-muted">
          {c.capital} · {GOV_LABEL[c.gov]}
          {c.rogue ? " · Rogue client" : ""}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-parchment/80">{leanCaption(c)}</p>

        {risk === "ripe" ? (
          <p className="mt-2 rounded-[var(--radius-xs)] border border-crisis/40 bg-crisis/10 px-2 py-1.5 text-xs text-crisis">
            Ripe for a coup — morale and stability are both soft. Clandestine or Arms can topple the palace.
          </p>
        ) : risk === "unsteady" ? (
          <p className="mt-2 text-xs text-warn">Unsteady. A hard year could open the door.</p>
        ) : null}

        {c.isSuper ? <CoreBanner c={c} youPatron={youPatron} /> : null}
        {stance === "satellite" && c.patron === youPatron && world.countries.filter((n) => n.patron === youPatron && !n.isSuper).length === 1 ? (
          <p className="mt-2 rounded-[var(--radius-xs)] border border-crisis/40 bg-crisis/10 px-2 py-1.5 text-xs text-crisis">
            Last satellite. If they walk, you stand alone and the era is lost.
          </p>
        ) : null}

        <div className="mt-4">
          <div className="mb-1 flex justify-between font-mono text-[10px] tracking-wider text-muted uppercase">
            <span>Compact</span>
            <span>{stance === "neutral" ? `Lean ${Math.round(c.alignment)}` : stance === "core" ? "Core" : c.rogue ? "Rogue" : "Locked"}</span>
            <span>Directorate</span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-line">
            <div className="absolute inset-y-0 left-0 bg-compact" style={{ width: `${alignPct}%` }} />
            <div className="absolute inset-y-0 bg-directorate" style={{ left: `${alignPct}%`, right: 0 }} />
            <div className="absolute top-[-3px] h-3.5 w-0.5 bg-parchment" style={{ left: `calc(${alignPct}% - 1px)` }} />
          </div>
        </div>

        <blockquote className="mt-4 border-l-2 border-parchment/20 pl-3 text-sm leading-relaxed text-parchment/85 italic">
          {portrayal(c, you)}
        </blockquote>

        <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <Stat label="Morale" value={`${Math.round(c.morale)}`} warn={c.morale <= (c.isSuper ? CORE_WARN.morale : 36)} />
          <Stat label="Stability" value={`${Math.round(c.stability)}`} warn={c.stability <= (c.isSuper ? CORE_WARN.stability : 40)} />
          <Stat label="Economy" value={`${Math.round(c.economy)}`} warn={c.economy <= (c.isSuper ? CORE_WARN.economy : 36)} />
        </dl>
        <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <Stat label="Opinion of you" value={`${Math.round(you === "compact" ? c.opinionA : c.opinionB)}`} />
          <Stat label="Unrest" value={`${Math.round(c.unrest)}`} warn={c.unrest > 55} />
          <Stat label="Loyalty" value={c.patron ? `${Math.round(c.loyalty)}` : "—"} />
          <Stat label="Local forces" value={`${Math.round(c.military)}`} />
          <Stat label="Your network" value={`${Math.round(spyYou)}`} />
          <Stat label="Their network" value={knowThem ? `${Math.round(spyThem)}` : "unknown"} />
        </dl>

        {queuedHere.length ? (
          <div className="mt-4 space-y-1">
            {queuedHere.map(({ o, i }) => (
              <div
                key={`${o.type}-${i}`}
                className="flex items-center justify-between rounded-[var(--radius-sm)] border border-parchment/15 px-3 py-2 text-sm"
              >
                <span>Queued: {OP_LABEL[o.type]}</span>
                <button type="button" className="text-muted hover:text-parchment" onClick={() => cancelOp(i)}>
                  Recall
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <p className="mt-5 font-mono text-[10px] tracking-[0.2em] text-muted uppercase">
          Pressure · {f.pc} influence left
        </p>
        <div className="mt-2 flex flex-col gap-2">
          {PRESSURES.map((type) => (
            <OpButton key={type} type={type} c={c} youPatron={youPatron} disabled={!playing || f.pc < OP_COST[type]} onQueue={() => queue(type, c.id)} />
          ))}
        </div>
        <p className="mt-4 font-mono text-[10px] tracking-[0.2em] text-muted uppercase">Counter</p>
        <p className="mt-1 text-[11px] text-subtle">Play on the same capital they will touch. Their pressure dies here.</p>
        <div className="mt-2 flex flex-col gap-2">
          {COUNTERS.map((type) => (
            <OpButton key={type} type={type} c={c} youPatron={youPatron} disabled={!playing || f.pc < OP_COST[type]} onQueue={() => queue(type, c.id)} />
          ))}
        </div>
        <p className="mt-3 text-[11px] text-subtle">
          {factionOf(world, rival).short} will move in secret when you close the year.
        </p>
      </div>
      <div className="border-t border-parchment/10 p-3 lg:hidden">
        <Button className="w-full" variant="ghost" onClick={() => select(null)}>
          Close
        </Button>
      </div>
    </aside>
  );
}

function OpButton({
  type,
  c,
  youPatron,
  disabled,
  onQueue,
}: {
  type: OpType;
  c: Country;
  youPatron: number;
  disabled: boolean;
  onQueue: () => void;
}) {
  const homeOnlyArm = type === "arm" && c.isSuper !== 0 && c.isSuper !== youPatron;
  const noDiktatCore = type === "diktat" && c.isSuper !== 0;
  return (
    <button
      type="button"
      disabled={disabled || homeOnlyArm || noDiktatCore}
      onClick={onQueue}
      className={cn(
        "rounded-[var(--radius-sm)] border border-parchment/12 bg-ink-2 px-3 py-2.5 text-left transition-colors",
        "hover:border-parchment/30 disabled:opacity-40",
      )}
    >
      <span className="flex items-center justify-between text-sm font-medium">
        {OP_LABEL[type]}
        <span className="font-mono text-xs text-muted">{OP_COST[type]}</span>
      </span>
      <span className="mt-0.5 block text-xs leading-snug text-muted">{hintFor(type, c, youPatron)}</span>
    </button>
  );
}

function CoreBanner({ c, youPatron }: { c: Country; youPatron: number }) {
  const st = coreVitalState(c);
  const yours = c.isSuper === youPatron;
  if (st === "warn" || st === "break") {
    return (
      <p className="mt-2 rounded-[var(--radius-xs)] border border-crisis/40 bg-crisis/10 px-2 py-1.5 text-xs text-crisis">
        {yours ? "Your" : "Their"} homeland is {st === "break" ? "failing" : "creaking"}. Floors: morale {CORE_BREAK.morale} ·
        stability {CORE_BREAK.stability} · economy {CORE_BREAK.economy}. One number through the floor ends the era.
      </p>
    );
  }
  return (
    <p className="mt-2 text-xs text-subtle">
      Homeland floors: morale {CORE_BREAK.morale} · stability {CORE_BREAK.stability} · economy {CORE_BREAK.economy}. Press
      the three numbers, or defend them.
    </p>
  );
}

function hintFor(type: OpType, c: Country, youPatron: number): string {
  if (type === "broadcast" && c.isSuper) {
    return c.isSuper === youPatron
      ? "Quiet the homeland. Morale and shops recover."
      : "Hostile radio over their core. Cuts morale — a win condition.";
  }
  if (type === "broadcast" && !c.patron && !c.isSuper) {
    return c.morale < 40 ? "Morale is soft. They will listen." : "Swing this capital. The khaki will tint.";
  }
  if (type === "broadcast" && c.patron === youPatron) return "Quiet your client. Morale up, unrest down.";
  if (type === "blackout" && c.isSuper) {
    return c.isSuper === youPatron ? "Jam your own radio? Their Broadcast on this desk dies." : "Jam the homeland. Morale falls. Their state radio still speaks.";
  }
  if (type === "blackout") return "Jam this desk. Counters their Broadcast here.";
  if (type === "diktat" && !c.patron && !c.isSuper) {
    return diktatWillSnap(c)
      ? `Stability ${Math.round(c.stability)} — a demarche will snap them.`
      : `Stability ${Math.round(c.stability)} is still firm. Soften it first, or they refuse.`;
  }
  if (type === "diktat" && c.rogue) return "The rogue lock is cheap. A hard note may turn them.";
  if (type === "diktat" && c.isSuper) return "A core does not take dictation.";
  if (type === "defy" && c.isSuper) return c.isSuper === youPatron ? "Brace the ministries. Stability up." : "Refuse the note on their core.";
  if (type === "defy") return "Refuse the note. Counters Diktat on this capital.";
  if (type === "clandestine" && c.isSuper) {
    return c.isSuper === youPatron
      ? "Watchers in the ministries."
      : "A cell in their core. Cuts stability — a win condition.";
  }
  if (type === "clandestine" && coupRisk(c) === "ripe") return "Ripe for a coup. The colonels are already talking.";
  if (type === "clandestine" && c.rogue) return "The rogue is leaking. One good year can pry it.";
  if (type === "clandestine" && c.patron && c.patron !== youPatron) return "Pry this client. Two good years usually open a firm lock.";
  if (type === "counterintel" && c.isSuper) return "Shut the ministries. Counters Clandestine on the homeland this year.";
  if (type === "counterintel") return "Hunt their cell. Counters Clandestine here.";
  if (type === "arm" && c.isSuper) return c.isSuper === youPatron ? "Steel for the homeland." : "You cannot arm their core.";
  if (type === "embargo" && c.isSuper) {
    return c.isSuper === youPatron
      ? "Stop crates at your own harbour? Counters Arms here, bites the shops."
      : "Siege their shops. Economy is a win condition.";
  }
  if (type === "embargo") return "Stop the crates. Counters Arms. Bites their economy.";
  return OP_HINT[type];
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-[var(--radius-xs)] bg-ink-2 px-2 py-1.5">
      <div className="text-[10px] tracking-wide text-muted uppercase">{label}</div>
      <div className={cn("font-mono text-sm tabular-nums", warn && "text-crisis")}>{value}</div>
    </div>
  );
}
