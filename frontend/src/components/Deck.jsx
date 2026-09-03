import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Grid3X3, Maximize, Printer, Presentation, X } from "lucide-react";
import { SLIDES } from "./slides";
import { TOTAL_SLIDES } from "../data/slidesContent";
import { StaticCtx, SlideNumCtx } from "./bits";
import { CANVAS_W, CANVAS_H } from "./SlideShell";

export const CHANNEL = "felcont-cpc51-deck";

function useScale() {
  const [s, setS] = useState(1);
  useEffect(() => {
    const f = () => setS(Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H));
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  return s;
}

const readHash = () => {
  const n = parseInt(window.location.hash.replace("#", ""), 10);
  return Number.isFinite(n) && n >= 1 && n <= TOTAL_SLIDES ? n - 1 : 0;
};

export default function Deck() {
  const [i, setI] = useState(readHash);
  const [overview, setOverview] = useState(false);
  const [bare] = useState(() => new URLSearchParams(window.location.search).has("bare"));
  const scale = useScale();
  const chRef = useRef(null);

  const go = useCallback((n) => {
    setI((c) => Math.min(TOTAL_SLIDES - 1, Math.max(0, typeof n === "number" ? n : c + n)));
  }, []);

  useEffect(() => {
    let ch = null;
    try {
      ch = new BroadcastChannel(CHANNEL);
      ch.onmessage = (e) => {
        if (e.data?.t === "goto") setI(Math.min(TOTAL_SLIDES - 1, Math.max(0, e.data.i)));
        if (e.data?.t === "hello") ch.postMessage({ t: "state", i: readHash() });
      };
      chRef.current = ch;
    } catch (e) { /* sem suporte */ }
    return () => ch && ch.close();
  }, []);

  useEffect(() => {
    window.history.replaceState(null, "", `#${i + 1}`);
    try { chRef.current?.postMessage({ t: "state", i }); } catch (e) {}
  }, [i]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      const k = e.key;
      if (["ArrowRight", "ArrowDown", " ", "PageDown"].includes(k)) { e.preventDefault(); overview ? setOverview(false) : go(1); }
      else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(k)) { e.preventDefault(); go(-1); }
      else if (k === "Home") go(-TOTAL_SLIDES);
      else if (k === "End") go(TOTAL_SLIDES);
      else if (k.toLowerCase() === "o" || k === "Escape") setOverview((o) => !o);
      else if (k.toLowerCase() === "f") {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen().catch(() => {});
      }
      else if (k.toLowerCase() === "p") window.open("/apresentador", "_blank", "width=1180,height=760");
      else if (k.toLowerCase() === "m") window.open("/imprimir", "_blank");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, overview]);

  useEffect(() => {
    const onHash = () => setI(readHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const Slide = SLIDES[i];

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#04060C]" data-testid="deck-root">
      {/* progress */}
      {!bare && (
      <div className="absolute left-0 right-0 top-0 z-40 h-[3px] bg-white/5" data-testid="progress-bar">
        <motion.div
          className="h-full bg-gradient-to-r from-[#00E5FF] to-[#38BDF8]"
          animate={{ width: `${((i + 1) / TOTAL_SLIDES) * 100}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      )}

      {/* click zones */}
      {!bare && (<>
      <button aria-label="Anterior" data-testid="zone-prev" onClick={() => go(-1)}
        className="absolute bottom-16 left-0 top-0 z-20 w-[12%] cursor-w-resize opacity-0" />
      <button aria-label="Próximo" data-testid="zone-next" onClick={() => go(1)}
        className="absolute bottom-16 right-0 top-0 z-20 w-[12%] cursor-e-resize opacity-0" />
      </>)}

      {/* slide */}
      <div className="flex h-full w-full items-center justify-center">
        <div style={{ width: CANVAS_W, height: CANVAS_H, transform: `scale(${scale})` }} className="relative shrink-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              className="absolute inset-0 overflow-hidden rounded-xl border border-white/10 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]"
              initial={{ opacity: 0, x: 48, scale: 0.985 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -48, scale: 0.985 }}
              transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            >
              <SlideNumCtx.Provider value={{ n: i + 1, total: TOTAL_SLIDES }}>
                <Slide />
              </SlideNumCtx.Provider>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* dock */}
      {!bare && (
      <div className="absolute bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1.5 rounded-full glass px-3 py-2" data-testid="deck-dock">
        <DockBtn tid="prev-slide-btn" onClick={() => go(-1)} label="Anterior (←)"><ChevronLeft size={16} /></DockBtn>
        <div className="mx-1 font-mono2 text-[11px] tracking-[0.2em] text-[#64748B]" data-testid="slide-counter">
          <span className="text-[#00E5FF]">{String(i + 1).padStart(2, "0")}</span> / {TOTAL_SLIDES}
        </div>
        <DockBtn tid="next-slide-btn" onClick={() => go(1)} label="Próximo (→)"><ChevronRight size={16} /></DockBtn>
        <span className="mx-1.5 h-4 w-px bg-white/10" />
        <DockBtn tid="overview-btn" onClick={() => setOverview(true)} label="Visão geral (O)"><Grid3X3 size={14} /></DockBtn>
        <DockBtn tid="presenter-mode-btn" onClick={() => window.open("/apresentador", "_blank", "width=1180,height=760")} label="Modo apresentador (P)"><Presentation size={14} /></DockBtn>
        <DockBtn tid="print-btn" onClick={() => window.open("/imprimir", "_blank")} label="Imprimir / PDF (M)"><Printer size={14} /></DockBtn>
        <DockBtn tid="fullscreen-btn" onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {}))} label="Tela cheia (F)"><Maximize size={14} /></DockBtn>
      </div>
      )}

      {/* overview grid */}
      <AnimatePresence>
        {overview && (
          <motion.div
            className="absolute inset-0 z-50 overflow-y-auto bg-[#04060C]/97 p-10 backdrop-blur-xl"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            data-testid="overview-grid"
          >
            <div className="mb-8 flex items-center justify-between">
              <p className="font-mono2 text-xs uppercase tracking-[0.3em] text-[#00E5FF]">Visão geral · {TOTAL_SLIDES} slides</p>
              <button data-testid="overview-close-btn" onClick={() => setOverview(false)}
                className="flex items-center gap-2 rounded-full hairline px-4 py-2 text-xs text-[#94A3B8] transition-colors hover:border-[rgba(0,229,255,0.4)] hover:text-white">
                <X size={14} /> Fechar (Esc)
              </button>
            </div>
            <div className="grid grid-cols-4 gap-5 xl:grid-cols-5">
              {SLIDES.map((S, idx) => (
                <button
                  key={idx}
                  data-testid={`overview-thumb-${idx + 1}`}
                  onClick={() => { setI(idx); setOverview(false); }}
                  className={`group relative overflow-hidden rounded-lg border text-left transition-all duration-300 hover:-translate-y-1 ${
                    idx === i ? "border-[#00E5FF] shadow-[0_0_28px_-6px_rgba(0,229,255,0.5)]" : "border-white/10 hover:border-[rgba(0,229,255,0.4)]"
                  }`}
                >
                  <div className="pointer-events-none aspect-video w-full overflow-hidden bg-[#070A12]">
                    <div style={{ width: CANVAS_W, height: CANVAS_H, transform: "scale(0.238)", transformOrigin: "top left" }}>
                      <StaticCtx.Provider value={true}>
                        <SlideNumCtx.Provider value={{ n: idx + 1, total: TOTAL_SLIDES }}>
                          <S />
                        </SlideNumCtx.Provider>
                      </StaticCtx.Provider>
                    </div>
                  </div>
                  <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 font-mono2 text-[10px] text-[#00E5FF]">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DockBtn({ children, onClick, label, tid }) {
  return (
    <button
      data-testid={tid}
      title={label}
      aria-label={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-full text-[#94A3B8] transition-all duration-200 hover:bg-[rgba(0,229,255,0.12)] hover:text-[#00E5FF] active:scale-90"
    >
      {children}
    </button>
  );
}
