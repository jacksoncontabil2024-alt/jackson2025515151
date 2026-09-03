import React, { useEffect, useState } from "react";
import Lenis from "lenis";
import { Printer, X } from "lucide-react";
import { SLIDES } from "./slides";
import { SLIDE_TITLES, TOTAL_SLIDES } from "../data/slidesContent";
import { StaticCtx } from "./bits";
import { CANVAS_W, CANVAS_H } from "./SlideShell";

export default function PrintView() {
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    document.title = "Imprimir — CPC 51 | IFRS 18 · Felcont";
    const lenis = new Lenis({ lerp: 0.09 });
    let raf;
    const loop = (t) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    const fit = () => setScale(Math.min(1, (window.innerWidth - 96) / CANVAS_W));
    fit();
    window.addEventListener("resize", fit);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); window.removeEventListener("resize", fit); };
  }, []);

  return (
    <div className="min-h-screen bg-[#04060C]" data-testid="print-root">
      <div className="print-toolbar sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-[#04060C]/90 px-8 py-4 backdrop-blur-xl">
        <div>
          <p className="font-display text-sm font-bold text-[#F8FAFC]">Exportar PDF — {TOTAL_SLIDES} slides em paisagem</p>
          <p className="mt-0.5 text-[11.5px] text-[#64748B]">
            Na janela de impressão: destino “Salvar como PDF”, margens “Nenhuma”, ative “Gráficos de plano de fundo”.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            data-testid="print-action-btn"
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-full border border-[rgba(0,229,255,0.4)] bg-[rgba(0,229,255,0.12)] px-5 py-2.5 font-mono2 text-[11px] uppercase tracking-[0.16em] text-[#00E5FF] transition-all hover:bg-[rgba(0,229,255,0.22)] active:scale-95"
          >
            <Printer size={14} /> Imprimir / Salvar PDF
          </button>
          <button
            data-testid="print-close-btn"
            onClick={() => window.close()}
            className="flex h-10 w-10 items-center justify-center rounded-full hairline text-[#94A3B8] transition-colors hover:text-white"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="mx-auto flex flex-col items-center gap-10 py-12" style={{ width: CANVAS_W * scale + 48 }}>
        {SLIDES.map((S, idx) => (
          <div key={idx} className="print-sheet w-full" data-testid={`print-slide-${idx + 1}`}>
            <div className="overflow-hidden rounded-lg border border-white/10 shadow-2xl" style={{ width: CANVAS_W * scale, height: CANVAS_H * scale }}>
              <div className="print-canvas" style={{ transform: `scale(${scale})` }}>
                <StaticCtx.Provider value={true}><S /></StaticCtx.Provider>
              </div>
            </div>
            <p className="print-toolbar mt-2 font-mono2 text-[10px] uppercase tracking-[0.24em] text-[#334155]">
              {String(idx + 1).padStart(2, "0")} · {SLIDE_TITLES[idx]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
