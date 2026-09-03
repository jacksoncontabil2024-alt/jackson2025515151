import React, { useContext } from "react";
import { Reveal, MaskedTitle, Kicker, SlideNumCtx } from "./bits";
import { LogoMark } from "./Logo";

export const CANVAS_W = 1280;
export const CANVAS_H = 720;

export function SlideShell({ n: nProp, total: totalProp, kicker, title, subtitle, children, right, tone }) {
  const ctx = useContext(SlideNumCtx);
  const n = ctx?.n ?? nProp;
  const total = ctx?.total ?? totalProp;
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#070A12]" data-testid="slide-canvas">
      <div className="deck-grid-bg pointer-events-none absolute inset-0 opacity-60" />
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full"
        style={{ background: `radial-gradient(circle, ${tone || "rgba(0,229,255,0.10)"} 0%, transparent 65%)` }}
      />
      <header className="relative z-10 flex items-start justify-between px-14 pt-10">
        <div className="max-w-[880px]">
          <Reveal delay={0.05}>
            <Kicker>{kicker}</Kicker>
          </Reveal>
          <MaskedTitle
            lines={title}
            className="mt-4 text-[34px] font-extrabold leading-[1.06] tracking-tight text-[#F8FAFC]"
          />
          {subtitle && (
            <Reveal delay={0.5}>
              <p className="mt-3 max-w-[760px] text-[15px] leading-relaxed text-[#94A3B8]">{subtitle}</p>
            </Reveal>
          )}
        </div>
        <Reveal delay={0.35} className="shrink-0 pt-1 text-right">
          {right || (
            <div className="font-mono2 text-xs text-[#64748B]">
              <span className="text-[#00E5FF]">{String(n).padStart(2, "0")}</span>
              <span className="mx-1 text-[#334155]">/</span>
              {String(total).padStart(2, "0")}
            </div>
          )}
        </Reveal>
      </header>
      <main className="relative z-10 flex flex-1 flex-col px-14 pb-16 pt-6">{children}</main>
      <footer className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between px-14 pb-5">
        <div className="flex items-center gap-2 opacity-70">
          <LogoMark size={16} />
          <span className="font-mono2 text-[10px] uppercase tracking-[0.28em] text-[#64748B]">
            Felcont · CPC 51 | IFRS 18
          </span>
        </div>
        <span className="font-mono2 text-[10px] uppercase tracking-[0.28em] text-[#334155]">
          Material interno · 2026
        </span>
      </footer>
    </div>
  );
}
