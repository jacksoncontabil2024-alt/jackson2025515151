import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, MonitorOff, Pause, Play, RotateCcw } from "lucide-react";
import { SLIDES } from "./slides";
import { NOTES, SLIDE_TITLES, TOTAL_SLIDES } from "../data/slidesContent";
import { StaticCtx } from "./bits";
import { CANVAS_W, CANVAS_H } from "./SlideShell";
import { CHANNEL } from "./Deck";
import { LogoLockup } from "./Logo";

export default function Presenter() {
  const [i, setI] = useState(null);
  const [secs, setSecs] = useState(0);
  const [running, setRunning] = useState(true);
  const chRef = useRef(null);

  useEffect(() => {
    document.title = "Apresentador — CPC 51 | IFRS 18";
    let ch = null;
    try {
      ch = new BroadcastChannel(CHANNEL);
      ch.onmessage = (e) => { if (e.data?.t === "state") setI(e.data.i); };
      ch.postMessage({ t: "hello" });
      chRef.current = ch;
      const retry = setInterval(() => ch.postMessage({ t: "hello" }), 2500);
      return () => { clearInterval(retry); ch.close(); };
    } catch (e) { setI(-1); }
  }, []);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    const onKey = (e) => {
      if (["ArrowRight", "ArrowDown", " ", "PageDown"].includes(e.key)) { e.preventDefault(); goto((i ?? 0) + 1); }
      else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); goto((i ?? 0) - 1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i]);

  const goto = (n) => {
    const c = Math.min(TOTAL_SLIDES - 1, Math.max(0, n));
    setI(c);
    try { chRef.current?.postMessage({ t: "goto", i: c }); } catch (e) {}
  };

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  if (i === null || i === -1) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-5 bg-[#04060C] text-center" data-testid="presenter-waiting">
        <MonitorOff size={36} className="text-[#334155]" />
        <p className="font-display text-xl font-bold text-[#F8FAFC]">Aguardando a apresentação principal…</p>
        <p className="max-w-md text-sm text-[#94A3B8]">
          Abra o deck na rota principal e pressione <span className="font-mono2 text-[#00E5FF]">P</span> — esta janela sincroniza automaticamente.
        </p>
      </div>
    );
  }

  const Current = SLIDES[i];
  const Next = i + 1 < TOTAL_SLIDES ? SLIDES[i + 1] : null;

  return (
    <div className="flex h-screen flex-col bg-[#04060C]" data-testid="presenter-root">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-3">
        <LogoLockup compact />
        <p className="font-mono2 text-[11px] uppercase tracking-[0.3em] text-[#64748B]">Console do apresentador</p>
        <div className="flex items-center gap-2" data-testid="presenter-timer">
          <span className="num rounded-lg border border-[rgba(0,229,255,0.3)] bg-[rgba(0,229,255,0.07)] px-3 py-1.5 text-lg font-bold text-[#00E5FF]">
            {mm}:{ss}
          </span>
          <button data-testid="timer-toggle-btn" onClick={() => setRunning((r) => !r)}
            className="flex h-8 w-8 items-center justify-center rounded-full hairline text-[#94A3B8] transition-colors hover:text-[#00E5FF]">
            {running ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button data-testid="timer-reset-btn" onClick={() => setSecs(0)}
            className="flex h-8 w-8 items-center justify-center rounded-full hairline text-[#94A3B8] transition-colors hover:text-[#00E5FF]">
            <RotateCcw size={14} />
          </button>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-[1.25fr_1fr] gap-5 overflow-hidden p-5">
        <div className="flex min-h-0 flex-col gap-4">
          <div className="relative overflow-hidden rounded-xl border border-[rgba(0,229,255,0.35)]" data-testid="presenter-current">
            <div className="aspect-video w-full overflow-hidden bg-[#070A12]">
              <ScaledSlide Slide={Current} width={680} />
            </div>
            <span className="absolute left-3 top-3 rounded bg-black/60 px-2 py-0.5 font-mono2 text-[10px] uppercase tracking-[0.2em] text-[#00E5FF]">
              Slide atual · {String(i + 1).padStart(2, "0")}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-44 shrink-0 overflow-hidden rounded-lg hairline" data-testid="presenter-next">
              {Next ? (
                <div className="aspect-video w-full overflow-hidden bg-[#070A12] opacity-70">
                  <ScaledSlide Slide={Next} width={176} />
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center text-[11px] text-[#64748B]">Fim do deck</div>
              )}
              <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 font-mono2 text-[9px] uppercase tracking-[0.18em] text-[#94A3B8]">A seguir</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-[#F8FAFC]">{SLIDE_TITLES[Math.min(i + 1, TOTAL_SLIDES - 1)]}</p>
              <div className="mt-2 flex items-center gap-2">
                <button data-testid="presenter-prev-btn" onClick={() => goto(i - 1)}
                  className="flex items-center gap-1.5 rounded-full hairline px-4 py-2 text-xs text-[#94A3B8] transition-all hover:border-[rgba(0,229,255,0.4)] hover:text-white active:scale-95">
                  <ChevronLeft size={14} /> Anterior
                </button>
                <button data-testid="presenter-next-btn" onClick={() => goto(i + 1)}
                  className="flex items-center gap-1.5 rounded-full border border-[rgba(0,229,255,0.4)] bg-[rgba(0,229,255,0.12)] px-4 py-2 text-xs font-semibold text-[#00E5FF] transition-all hover:bg-[rgba(0,229,255,0.22)] active:scale-95">
                  Próximo <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
            <div className="h-full bg-gradient-to-r from-[#00E5FF] to-[#38BDF8] transition-all duration-500" style={{ width: `${((i + 1) / TOTAL_SLIDES) * 100}%` }} />
          </div>
        </div>

        <div className="flex min-h-0 flex-col rounded-xl hairline bg-[#0B101E]/80 p-5" data-testid="notes-panel">
          <p className="font-mono2 text-[11px] uppercase tracking-[0.28em] text-[#00E5FF]">Notas do apresentador</p>
          <p className="mt-1 font-mono2 text-[10px] uppercase tracking-[0.2em] text-[#334155]">
            {String(i + 1).padStart(2, "0")} · {SLIDE_TITLES[i]}
          </p>
          <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-2">
            <p className="whitespace-pre-wrap text-[13.5px] leading-[1.75] text-[#CBD5E1]">{NOTES[i]}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScaledSlide({ Slide, width }) {
  const s = width / CANVAS_W;
  return (
    <div style={{ width: CANVAS_W, height: CANVAS_H, transform: `scale(${s})`, transformOrigin: "top left" }}>
      <StaticCtx.Provider value={true}><Slide /></StaticCtx.Provider>
    </div>
  );
}
