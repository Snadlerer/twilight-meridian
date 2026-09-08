import { useEffect, useRef } from "react";
import { ATLAS, COMPASS, MAP_H, MAP_W, RIVERS, nationAt } from "@/game/atlas";
import { COL, mix3, nationRgb, rgb } from "@/game/colors";
import { coreVitalState } from "@/game/generateWorld";
import type { Country, Op, OpType, Side, World, YearBeat } from "@/game/types";
import { useGame } from "@/game/store";

function pathRings(ctx: CanvasRenderingContext2D, rings: number[][][]) {
  ctx.beginPath();
  for (const ring of rings) {
    if (!ring.length) continue;
    ctx.moveTo(ring[0]![0]!, ring[0]![1]!);
    for (let i = 1; i < ring.length; i++) ctx.lineTo(ring[i]![0]!, ring[i]![1]!);
    ctx.closePath();
  }
}

function fillNation(ctx: CanvasRenderingContext2D, rings: number[][][]) {
  pathRings(ctx, rings);
  ctx.fill("evenodd");
}

function pathAllLand(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  for (const a of ATLAS) {
    for (const ring of a.polygons) {
      if (!ring.length) continue;
      ctx.moveTo(ring[0]![0]!, ring[0]![1]!);
      for (let i = 1; i < ring.length; i++) ctx.lineTo(ring[i]![0]!, ring[i]![1]!);
      ctx.closePath();
    }
  }
}

function atlasFill(c: Country): [number, number, number] {
  const pol = nationRgb(c);
  const paper: [number, number, number] = [204, 190, 162];
  if (c.isSuper) return mix3(paper, pol, 0.78);
  if (c.patron) return mix3(paper, c.rogue ? mix3(pol, COL.gold, 0.35) : pol, 0.5);
  return mix3(paper, pol, 0.28);
}

const oceanBuf = { current: null as HTMLCanvasElement | null };
const landBuf = { current: null as HTMLCanvasElement | null };
const landKey = { current: "" };

function bakeOcean(ocean: HTMLImageElement | null, atlas: HTMLImageElement | null): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = MAP_W;
  c.height = MAP_H;
  const g = c.getContext("2d")!;
  const grd = g.createLinearGradient(0, 0, 0, MAP_H);
  grd.addColorStop(0, "rgb(48, 78, 82)");
  grd.addColorStop(0.18, "rgb(28, 62, 68)");
  grd.addColorStop(0.55, "rgb(16, 42, 48)");
  grd.addColorStop(1, "rgb(12, 30, 36)");
  g.fillStyle = grd;
  g.fillRect(0, 0, MAP_W, MAP_H);
  if (atlas && atlas.complete && atlas.naturalWidth) {
    g.globalAlpha = 0.28;
    g.drawImage(atlas, 0, 0, MAP_W, MAP_H);
    g.globalAlpha = 1;
    g.fillStyle = "rgba(8, 28, 34, 0.32)";
    g.fillRect(0, 0, MAP_W, MAP_H);
  } else if (ocean && ocean.complete && ocean.naturalWidth) {
    g.globalAlpha = 0.42;
    g.drawImage(ocean, 0, 0, MAP_W, MAP_H);
    g.globalAlpha = 1;
    g.fillStyle = "rgba(10, 32, 38, 0.28)";
    g.fillRect(0, 0, MAP_W, MAP_H);
  }
  g.strokeStyle = "rgba(210, 224, 220, 0.09)";
  g.lineWidth = 1;
  for (let y = 70; y < MAP_H; y += 70) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(MAP_W, y);
    g.stroke();
  }
  for (let x = 80; x < MAP_W; x += 80) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, MAP_H);
    g.stroke();
  }
  const ice = g.createLinearGradient(0, 0, 0, 160);
  ice.addColorStop(0, "rgba(220, 228, 230, 0.38)");
  ice.addColorStop(1, "rgba(220, 228, 230, 0)");
  g.fillStyle = ice;
  g.fillRect(0, 0, MAP_W, 160);
  g.fillStyle = "rgba(8, 22, 26, 0.18)";
  g.fillRect(0, MAP_H - 90, MAP_W, 90);
  return c;
}

function bakeLand(world: World, paper: HTMLImageElement | null, atlas: HTMLImageElement | null): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = MAP_W;
  c.height = MAP_H;
  const g = c.getContext("2d")!;
  for (const a of ATLAS) {
    const ctry = world.countries[a.id - 1];
    if (!ctry) continue;
    g.fillStyle = rgb(atlasFill(ctry));
    fillNation(g, a.polygons);
    if (paper && paper.complete && paper.naturalWidth) {
      g.save();
      pathRings(g, a.polygons);
      g.clip("evenodd");
      g.globalAlpha = 0.32;
      g.drawImage(paper, 0, 0, MAP_W, MAP_H);
      g.restore();
    }
    if (ctry.patron && !ctry.isSuper) {
      g.save();
      pathRings(g, a.polygons);
      g.clip("evenodd");
      g.strokeStyle = "rgba(18,16,14,0.22)";
      g.lineWidth = 1.4;
      for (let x = -MAP_H; x < MAP_W + MAP_H; x += 7) {
        g.beginPath();
        g.moveTo(x, 0);
        g.lineTo(x + MAP_H, MAP_H);
        g.stroke();
      }
      g.restore();
    }
  }
  g.lineJoin = "round";
  g.lineCap = "round";
  g.strokeStyle = "rgba(140, 186, 180, 0.38)";
  g.lineWidth = 11;
  pathAllLand(g);
  g.stroke();
  g.strokeStyle = "rgba(232, 214, 168, 0.95)";
  g.lineWidth = 3.4;
  pathAllLand(g);
  g.stroke();
  g.strokeStyle = "rgba(18, 16, 14, 0.72)";
  g.lineWidth = 1.15;
  for (const a of ATLAS) {
    pathRings(g, a.polygons);
    g.stroke();
  }
  g.strokeStyle = "rgba(12, 14, 16, 0.92)";
  g.lineWidth = 2.4;
  for (const a of ATLAS) {
    const ctry = world.countries[a.id - 1];
    if (!ctry?.isSuper) continue;
    pathRings(g, a.polygons);
    g.stroke();
  }
  g.setLineDash([8, 5]);
  g.strokeStyle = rgb(COL.gold, 0.95);
  g.lineWidth = 2.2;
  for (const a of ATLAS) {
    const ctry = world.countries[a.id - 1];
    if (!ctry?.rogue) continue;
    pathRings(g, a.polygons);
    g.stroke();
  }
  g.setLineDash([]);
  if (atlas && atlas.complete && atlas.naturalWidth) {
    g.save();
    pathAllLand(g);
    g.clip();
    g.globalAlpha = 0.32;
    g.globalCompositeOperation = "multiply";
    g.drawImage(atlas, 0, 0, MAP_W, MAP_H);
    g.restore();
  }
  g.strokeStyle = "rgba(36, 72, 78, 0.72)";
  g.lineWidth = 1.6;
  g.lineCap = "round";
  for (const river of RIVERS) {
    if (river.length < 2) continue;
    g.beginPath();
    g.moveTo(river[0]![0]!, river[0]![1]!);
    for (let i = 1; i < river.length; i++) g.lineTo(river[i]![0]!, river[i]![1]!);
    g.stroke();
  }
  return c;
}

export function WorldMap() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const world = useGame((s) => s.world);
  const selectedId = useGame((s) => s.selectedId);
  const hoverId = useGame((s) => s.hoverId);
  const ops = useGame((s) => s.ops);
  const select = useGame((s) => s.select);
  const hover = useGame((s) => s.hover);
  const phase = useGame((s) => s.phase);
  const report = useGame((s) => s.report);
  const beatIndex = useGame((s) => s.beatIndex);
  const imgs = useRef<{ ocean: HTMLImageElement | null; paper: HTMLImageElement | null; atlas: HTMLImageElement | null }>({
    ocean: null,
    paper: null,
    atlas: null,
  });
  const cam = useRef({ x: 0, y: 0, k: 1 });
  const beatMs = useRef(0);
  const lastT = useRef(0);

  useEffect(() => {
    const load = (src: string) => {
      const im = new Image();
      im.crossOrigin = "anonymous";
      im.src = src;
      im.onload = () => {
        oceanBuf.current = null;
        landBuf.current = null;
        landKey.current = "";
      };
      return im;
    };
    imgs.current.ocean = load("/art/ocean.jpg");
    imgs.current.paper = load("/art/parchment.jpg");
    imgs.current.atlas = load("/art/title.jpg");
  }, []);

  useEffect(() => {
    landBuf.current = null;
    landKey.current = "";
  }, [world?.seed, world?.year]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const ro = new ResizeObserver(() => layout());
    ro.observe(wrap);

    const layout = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const k = Math.min(w / MAP_W, h / MAP_H);
      cam.current.k = k;
      cam.current.x = (w - MAP_W * k) / 2;
      cam.current.y = (h - MAP_H * k) / 2;
    };
    layout();

    const loop = (t: number) => {
      lastT.current = t;
      const wld = useGame.getState().world;
      if (wld) {
        if (!oceanBuf.current) oceanBuf.current = bakeOcean(imgs.current.ocean, imgs.current.atlas);
        const key = wld.countries.map((c) => `${c.patron}:${c.isSuper}:${c.rogue ? 1 : 0}:${Math.round(c.alignment / 3)}`).join("|");
        if (!landBuf.current || landKey.current !== key) {
          landBuf.current = bakeLand(wld, imgs.current.paper, imgs.current.atlas);
          landKey.current = key;
        }
        const st = useGame.getState();
        const beat = st.phase === "playback" && st.report ? st.report.beats[st.beatIndex] ?? null : null;
        draw(ctx, canvas, wld, cam.current, st.selectedId, st.hoverId, st.ops, beat, beatMs.current);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const toMap = (cx: number, cy: number) => {
      const r = canvas.getBoundingClientRect();
      const x = (cx - r.left - cam.current.x) / cam.current.k;
      const y = (cy - r.top - cam.current.y) / cam.current.k;
      return { x, y };
    };

    const onMove = (e: PointerEvent) => {
      const { x, y } = toMap(e.clientX, e.clientY);
      hover(nationAt(x, y));
    };
    const onDown = (e: PointerEvent) => {
      const { x, y } = toMap(e.clientX, e.clientY);
      select(nationAt(x, y));
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", () => hover(null));

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
    };
  }, [select, hover]);

  useEffect(() => {
    beatMs.current = 0;
  }, [beatIndex, phase, report?.year]);

  return (
    <div ref={wrapRef} className="relative h-full min-h-0 w-full overflow-hidden bg-ink">
      <canvas ref={canvasRef} className="block h-full w-full touch-none" />
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  world: World,
  cam: { x: number; y: number; k: number },
  selectedId: number | null,
  hoverId: number | null,
  ops: Op[],
  beat: YearBeat | null,
  beatAge: number,
) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;
  ctx.fillStyle = rgb(COL.ocean);
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.translate(cam.x, cam.y);
  ctx.scale(cam.k, cam.k);
  if (oceanBuf.current) ctx.drawImage(oceanBuf.current, 0, 0);
  if (landBuf.current) ctx.drawImage(landBuf.current, 0, 0);

  const t = performance.now();
  const pulse = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t / 420));

  const outline = (id: number, col: string, width: number) => {
    const a = ATLAS[id - 1];
    if (!a) return;
    pathRings(ctx, a.polygons);
    ctx.strokeStyle = col;
    ctx.lineWidth = width / cam.k;
    ctx.stroke();
  };

  for (const c of world.countries) {
    if (!c.isSuper) continue;
    const st = coreVitalState(c);
    if (st === "firm") continue;
    const a = st === "break" ? 0.85 : 0.45 + pulse * 0.4;
    outline(c.id, `rgba(184,92,74,${a})`, st === "break" ? 6.5 : 4.8);
  }

  if (hoverId) outline(hoverId, "rgba(214,208,196,0.5)", 3);
  if (selectedId) outline(selectedId, `rgba(232,214,168,${0.55 + pulse * 0.4})`, 4);

  if (beat) {
    const age = Math.min(1, beatAge / 1200);
    drawBeatFx(ctx, world, beat, age, cam.k);
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const c of world.countries) {
    drawStar(ctx, c.cx, c.cy - (c.isSuper ? 2 : 0), c.isSuper ? 5.2 : 3.4, cam.k, c.rogue);
    if (!c.patron && !c.isSuper) drawLeanPip(ctx, c, cam.k);
    const lastSat = Boolean(c.patron && !c.isSuper && world.countries.filter((n) => n.patron === c.patron && !n.isSuper).length === 1);
    const show = c.isSuper || c.rogue || lastSat || c.area > 14000 || c.id === selectedId || c.id === hoverId || cam.k > 1.05;
    if (!show) continue;
    const label = c.isSuper ? c.name.toUpperCase() : c.rogue ? `${c.name}` : c.name;
    const size = Math.max(9, (c.isSuper ? 17 : c.rogue ? 13 : 11.5) / Math.sqrt(cam.k));
    ctx.font = `${c.isSuper ? "600 " : ""}${size}px "Cormorant Garamond", serif`;
    ctx.lineWidth = 3.6 / cam.k;
    ctx.strokeStyle = "rgba(14,16,18,0.78)";
    ctx.fillStyle = c.rogue ? rgb(COL.gold) : rgb(COL.parchment);
    ctx.strokeText(label, c.cx, c.cy + 14);
    ctx.fillText(label, c.cx, c.cy + 14);
    if (c.isSuper) {
      ctx.font = `${9 / Math.sqrt(cam.k)}px "IBM Plex Sans", sans-serif`;
      ctx.fillStyle = "rgba(214,208,196,0.78)";
      ctx.fillText(c.isSuper === 1 ? "ATLANTIC COMPACT" : "CONTINENTAL DIRECTORATE", c.cx, c.cy + 28);
    } else if (c.rogue) {
      ctx.font = `${8.5 / Math.sqrt(cam.k)}px "IBM Plex Sans", sans-serif`;
      ctx.fillStyle = rgb(COL.gold, 0.9);
      ctx.fillText("ROGUE CLIENT", c.cx, c.cy + 26);
    } else if (lastSat) {
      ctx.font = `${8.5 / Math.sqrt(cam.k)}px "IBM Plex Sans", sans-serif`;
      ctx.fillStyle = "rgba(184,92,74,0.95)";
      ctx.fillText("LAST SATELLITE", c.cx, c.cy + 26);
    } else if (cam.k > 1.2 || c.id === selectedId) {
      ctx.font = `${8 / Math.sqrt(cam.k)}px "IBM Plex Sans", sans-serif`;
      ctx.fillStyle = "rgba(214,208,196,0.7)";
      ctx.fillText(c.capital, c.cx, c.cy + 26);
    }
  }

  for (const op of ops) {
    const c = world.countries[op.nationId - 1];
    if (!c) continue;
    drawOpGlyph(ctx, c.cx + 16, c.cy - 10, op.type, cam.k, false, op.side);
  }

  if (world.year === 1 && ops.length === 0 && !beat) {
    const home = world.playerSide === "compact" ? world.compact.homelandId : world.directorate.homelandId;
    const rogue = world.countries.find((c) => c.rogue);
    const neu = world.countries.find((c) => !c.isSuper && !c.patron);
    coach(ctx, world.countries[home - 1]!, "Your core", cam.k);
    if (rogue) coach(ctx, rogue, "The rogue — they can take this", cam.k);
    if (neu) coach(ctx, neu, "A neutral. Read morale. Then press.", cam.k);
  }

  drawCompass(ctx, COMPASS[0], COMPASS[1]);
  drawCartouche(ctx, 36, 36);
  drawScale(ctx, 36, 848);
  ctx.restore();
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, k: number, gold: boolean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    const px = Math.cos(a) * rr;
    const py = Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = gold ? rgb(COL.gold) : rgb(COL.parchment);
  ctx.strokeStyle = "rgba(14,16,18,0.7)";
  ctx.lineWidth = 1.2 / k;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawLeanPip(ctx: CanvasRenderingContext2D, c: Country, k: number) {
  const t = (c.alignment + 48) / 96;
  ctx.beginPath();
  ctx.arc(c.cx - 10, c.cy + 4, 3.2 / Math.sqrt(k), 0, Math.PI * 2);
  ctx.fillStyle = rgb(mix3(COL.directorate, COL.compact, Math.max(0, Math.min(1, t))));
  ctx.fill();
}

function drawOpGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, type: OpType, k: number, _blocked: boolean, side: Side) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = side === "compact" ? rgb(COL.compact) : rgb(COL.directorate);
  ctx.strokeStyle = "rgba(14,16,18,0.8)";
  ctx.lineWidth = 1.4 / k;
  ctx.beginPath();
  ctx.arc(0, 0, 8 / Math.sqrt(k), 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = rgb(COL.parchment);
  ctx.font = `${9 / Math.sqrt(k)}px "IBM Plex Sans", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const mark: Record<OpType, string> = {
    broadcast: "B",
    blackout: "K",
    diktat: "D",
    defy: "Y",
    clandestine: "C",
    counterintel: "I",
    arm: "A",
    embargo: "E",
  };
  ctx.fillText(mark[type], 0, 0.5);
  ctx.restore();
}

function drawBeatFx(ctx: CanvasRenderingContext2D, world: World, beat: YearBeat, age: number, k: number) {
  const c = world.countries[beat.nationId - 1];
  if (!c) return;
  const a = ATLAS[c.id - 1];
  if (!a) return;
  ctx.save();
  pathRings(ctx, a.polygons);
  ctx.fillStyle = beat.blocked ? `rgba(184,92,74,${0.18 * (1 - age)})` : `rgba(232,214,168,${0.16 * (1 - age)})`;
  ctx.fill("evenodd");
  ctx.beginPath();
  ctx.arc(c.cx, c.cy, (18 + age * 40) / Math.sqrt(k), 0, Math.PI * 2);
  ctx.strokeStyle = beat.blocked ? `rgba(184,92,74,${0.95 - age * 0.4})` : `rgba(232,214,168,${0.95 - age * 0.3})`;
  ctx.lineWidth = 2.4 / k;
  ctx.stroke();
  ctx.restore();
}

function coach(ctx: CanvasRenderingContext2D, c: Country, text: string, k: number) {
  ctx.save();
  ctx.font = `${10 / Math.sqrt(k)}px "IBM Plex Sans", sans-serif`;
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(18,16,14,0.78)";
  const w = ctx.measureText(text).width + 16;
  ctx.fillRect(c.cx - w / 2, c.cy - 48, w, 18);
  ctx.fillStyle = rgb(COL.gold);
  ctx.fillText(text.toUpperCase(), c.cx, c.cy - 38);
  ctx.restore();
}

function drawCompass(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "rgba(232,214,168,0.55)";
  ctx.fillStyle = "rgba(232,214,168,0.8)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, 28, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.lineTo(6, 4);
  ctx.lineTo(0, 0);
  ctx.lineTo(-6, 4);
  ctx.closePath();
  ctx.fill();
  ctx.font = '9px "IBM Plex Sans", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText("N", 0, -34);
  ctx.restore();
}

function drawCartouche(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.fillStyle = "rgba(18,16,14,0.55)";
  ctx.fillRect(x, y, 210, 78);
  ctx.strokeStyle = "rgba(232,214,168,0.4)";
  ctx.strokeRect(x + 0.5, y + 0.5, 209, 77);
  ctx.fillStyle = rgb(COL.parchment);
  ctx.font = '600 15px "Cormorant Garamond", serif';
  ctx.textAlign = "left";
  ctx.fillText("Twilight Meridian", x + 12, y + 28);
  ctx.font = '10px "IBM Plex Sans", sans-serif';
  ctx.fillStyle = "rgba(214,208,196,0.7)";
  ctx.fillText("Staff atlas · 1947", x + 12, y + 48);
  ctx.fillText("Cores · satellites · neutrals", x + 12, y + 64);
  ctx.restore();
}

function drawScale(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.strokeStyle = "rgba(232,214,168,0.7)";
  ctx.fillStyle = "rgba(232,214,168,0.8)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 120, y);
  ctx.stroke();
  for (let i = 0; i <= 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * 30, y);
    ctx.lineTo(x + i * 30, y - (i % 2 ? 6 : 10));
    ctx.stroke();
  }
  ctx.font = '9px "IBM Plex Sans", sans-serif';
  ctx.fillText("0", x - 2, y + 14);
  ctx.fillText("300 mi", x + 96, y + 14);
  ctx.restore();
}
