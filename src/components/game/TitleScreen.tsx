import { Download, Eye, Globe2, Radio, Shield, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DIFFICULTY_BLURB, DIFFICULTY_LABEL, type Difficulty, type Side } from "@/game/types";
import { useGame } from "@/game/store";
import { cn } from "@/lib/cn";

const SIDES: { id: Side; name: string; short: string; line: string; img: string }[] = [
  {
    id: "compact",
    name: "Atlantic Compact",
    short: "The open hand",
    line: "Radio, credit, fleets. Be believed — then be obeyed.",
    img: "/emblems/compact.jpg",
  },
  {
    id: "directorate",
    name: "Continental Directorate",
    short: "The closed fist",
    line: "Sister republics, one industrial will. Neutrality is a corridor.",
    img: "/emblems/directorate.jpg",
  },
];

const DIFFS: Difficulty[] = ["easy", "medium", "hard"];

const DESK: { label: string; hint: string; href: string }[] = [
  {
    label: "Windows",
    hint: "64-bit · unzip, keep the folder",
    href: "https://github.com/Snadlerer/twilight-meridian/releases/download/v1.0.0/TwilightMeridian-Windows-x64.zip",
  },
  {
    label: "Mac · Apple Silicon",
    hint: "M1–M4 · right-click Open",
    href: "https://github.com/Snadlerer/twilight-meridian/releases/download/v1.0.0/TwilightMeridian-macOS-AppleSilicon.tar.gz",
  },
  {
    label: "Mac · Intel",
    hint: "Intel Mac · right-click Open",
    href: "https://github.com/Snadlerer/twilight-meridian/releases/download/v1.0.0/TwilightMeridian-macOS-Intel.tar.gz",
  },
];

export function TitleScreen() {
  const sideDraft = useGame((s) => s.sideDraft);
  const difficulty = useGame((s) => s.difficulty);
  const seedDraft = useGame((s) => s.seedDraft);
  const hasSave = useGame((s) => s.hasSave);
  const generating = useGame((s) => s.generating);
  const muted = useGame((s) => s.muted);
  const setSideDraft = useGame((s) => s.setSideDraft);
  const setDifficulty = useGame((s) => s.setDifficulty);
  const setSeedDraft = useGame((s) => s.setSeedDraft);
  const startGame = useGame((s) => s.startGame);
  const toggleMute = useGame((s) => s.toggleMute);
  const setBriefing = useGame((s) => s.setBriefing);

  return (
    <div className="relative min-h-dvh overflow-y-auto bg-ink text-parchment">
      <img
        src="/art/title.jpg"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-80"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/55 to-ink" />

      <div className="relative mx-auto flex min-h-dvh max-w-5xl flex-col px-4 py-8 sm:px-8">
        <header className="flex items-start justify-between gap-3">
          <p className="font-mono text-[11px] tracking-[0.22em] text-muted uppercase">Situation room · classified</p>
          <button
            type="button"
            onClick={toggleMute}
            className="flex size-11 items-center justify-center rounded-[var(--radius-md)] border border-parchment/15 text-parchment/80 hover:bg-parchment/8"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
        </header>

        <div className="rise mt-10 max-w-xl sm:mt-16">
          <p className="font-mono text-xs tracking-[0.28em] text-compact uppercase">The long peace</p>
          <h1 className="font-display mt-2 text-5xl leading-[0.95] font-medium tracking-tight sm:text-7xl">
            Twilight
            <br />
            Meridian
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted sm:text-base">
            Two poles on a staff atlas. Each nation has morale, stability, and a price. Neutrals lean. One client is a
            rogue. Strip their last satellite, or break their homeland, and the era is yours. Do not let your own core
            fail.
          </p>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {SIDES.map((s) => {
            const on = sideDraft === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSideDraft(s.id)}
                className={cn(
                  "flex min-h-[7.5rem] items-center gap-4 rounded-[var(--radius-xl)] border p-4 text-left transition-colors",
                  on ? (s.id === "compact" ? "border-compact bg-compact/15" : "border-directorate bg-directorate/15") : "border-parchment/15 bg-ink/40",
                )}
              >
                <img src={s.img} alt="" className="size-16 rounded-full object-cover sm:size-20" />
                <span>
                  <span className="font-display block text-xl">{s.name}</span>
                  <span className="mt-1 block text-xs tracking-wide text-muted uppercase">{s.short}</span>
                  <span className="mt-2 block text-sm text-parchment/80">{s.line}</span>
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-8 font-mono text-[10px] tracking-[0.2em] text-muted uppercase">Opening balance</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {DIFFS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              className={cn(
                "rounded-[var(--radius-md)] border px-3 py-3 text-left",
                difficulty === d ? "border-parchment/50 bg-parchment/10" : "border-parchment/12 bg-ink/30",
              )}
            >
              <span className="block text-sm font-medium">{DIFFICULTY_LABEL[d]}</span>
              <span className="mt-1 block text-xs text-muted">{DIFFICULTY_BLURB[d]}</span>
            </button>
          ))}
        </div>

        <label className="mt-6 block max-w-xs text-xs tracking-wide text-muted uppercase">
          World seed
          <input
            value={seedDraft}
            onChange={(e) => setSeedDraft(e.target.value.toUpperCase())}
            className="mt-1 w-full rounded-[var(--radius-sm)] border border-parchment/15 bg-ink/50 px-3 py-2 font-mono text-sm text-parchment uppercase"
          />
        </label>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button size="lg" className="min-w-48" disabled={generating} onClick={() => startGame()}>
            {generating ? "Charting the meridian…" : "Begin the era"}
          </Button>
          {hasSave ? (
            <Button variant="ghost" size="lg" disabled={generating} onClick={() => startGame({ resume: true })}>
              Resume cable
            </Button>
          ) : null}
          <button
            type="button"
            className="text-sm text-muted underline-offset-4 hover:text-parchment hover:underline"
            onClick={() => setBriefing(true)}
          >
            How the room works
          </button>
        </div>

        <section className="mt-10 rounded-[var(--radius-xl)] border border-parchment/15 bg-ink/55 p-4">
          <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-muted uppercase">
            <Download className="size-3.5" />
            Desk library
          </p>
          <p className="mt-1 text-xs text-muted">Same atlas, own window. Offline. Saves stay on that machine.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {DESK.map((d) => (
              <a
                key={d.href}
                href={d.href}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-12 items-center justify-between gap-2 rounded-[var(--radius-md)] border border-parchment/15 bg-parchment/5 px-3 py-2 text-sm text-parchment hover:border-parchment/40 hover:bg-parchment/10"
              >
                <span>
                  <span className="block font-medium">{d.label}</span>
                  <span className="block text-[11px] text-muted">{d.hint}</span>
                </span>
                <Download className="size-4 shrink-0 text-compact" />
              </a>
            ))}
          </div>
        </section>

        <ul className="mt-10 mb-6 grid gap-3 text-sm text-muted sm:grid-cols-4">
          <li className="flex gap-2">
            <Radio className="mt-0.5 size-4 shrink-0 text-compact" />
            Soft power — be the good side.
          </li>
          <li className="flex gap-2">
            <Shield className="mt-0.5 size-4 shrink-0 text-warn" />
            Arms — a war you cannot win is a confession.
          </li>
          <li className="flex gap-2">
            <Eye className="mt-0.5 size-4 shrink-0 text-directorate" />
            Espionage — steal the year they thought they had.
          </li>
          <li className="flex gap-2">
            <Globe2 className="mt-0.5 size-4 shrink-0 text-parchment" />
            Neutrals — the map is won in the middle.
          </li>
        </ul>
      </div>
    </div>
  );
}
