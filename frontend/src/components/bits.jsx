import React, { createContext, useContext } from "react";
import { motion } from "framer-motion";

export const StaticCtx = createContext(false);
export const SlideNumCtx = createContext(null);

export const EASE = [0.16, 1, 0.3, 1];

export function Reveal({ children, delay = 0, y = 24, className = "" }) {
  const isStatic = useContext(StaticCtx);
  if (isStatic) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export function MaskedTitle({ lines, className = "", baseDelay = 0.2, as: Tag = "h2" }) {
  const isStatic = useContext(StaticCtx);
  const arr = Array.isArray(lines) ? lines : [lines];
  return (
    <Tag className="font-display" data-testid="slide-title" style={{ margin: 0 }}>
      {arr.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
          {isStatic ? (
            <span className={`block ${className}`}>{line}</span>
          ) : (
            <motion.span
              className={`block ${className}`}
              initial={{ y: "112%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 0.8, delay: baseDelay + i * 0.13, ease: EASE }}
            >
              {line}
            </motion.span>
          )}
        </span>
      ))}
    </Tag>
  );
}

export function Kicker({ children }) {
  return (
    <div className="flex items-center gap-3" data-testid="slide-kicker">
      <span className="h-px w-10 bg-[#00E5FF]" />
      <span className="font-mono2 text-[11px] md:text-xs uppercase tracking-[0.3em] text-[#00E5FF]">{children}</span>
    </div>
  );
}

export function Selo({ tipo = "ficticio" }) {
  const conf = {
    ficticio: {
      label: "Valores fictícios · uso didático",
      cls: "border-[rgba(59,130,246,0.45)] bg-[rgba(59,130,246,0.12)] text-[#60A5FA]",
      dot: "#60A5FA",
    },
    confirmar: {
      label: "Confirmar na fonte / com o fornecedor",
      cls: "border-[rgba(245,158,11,0.45)] bg-[rgba(245,158,11,0.12)] text-[#FBBF24]",
      dot: "#FBBF24",
    },
  }[tipo];
  return (
    <span
      data-testid={`selo-${tipo}`}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono2 text-[10px] uppercase tracking-[0.14em] ${conf.cls}`}
    >
      <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: conf.dot }} />
      {conf.label}
    </span>
  );
}

export const CATS = {
  operacional: { nome: "Operacional", hex: "#00E5FF", cls: "cat-operacional" },
  investimento: { nome: "Investimento", hex: "#10B981", cls: "cat-investimento" },
  financiamento: { nome: "Financiamento", hex: "#8B5CF6", cls: "cat-financiamento" },
  impostos: { nome: "Impostos sobre a renda", hex: "#F59E0B", cls: "cat-impostos" },
  descontinuadas: { nome: "Op. descontinuadas", hex: "#F43F5E", cls: "cat-descontinuadas" },
};

export function CatBadge({ cat, short = false }) {
  const c = CATS[cat];
  return (
    <span
      data-testid={`badge-${cat}`}
      className={`cat-chip ${c.cls} inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono2 text-[10px] uppercase tracking-[0.12em] whitespace-nowrap`}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.hex }} />
      {short ? c.nome.split(" ")[0] : c.nome}
    </span>
  );
}

export function Card({ children, className = "", glow }) {
  return (
    <div
      className={`relative rounded-xl bg-[#0E1424]/80 hairline p-5 transition-colors duration-300 hover:border-[rgba(0,229,255,0.25)] ${className}`}
      style={glow ? { boxShadow: `0 0 40px -12px ${glow}` } : undefined}
    >
      {children}
    </div>
  );
}

export function Marquee({ items }) {
  const row = (
    <div className="flex shrink-0 items-center">
      {items.map((t, i) => (
        <span key={i} className="flex items-center">
          <span className="font-mono2 text-[11px] uppercase tracking-[0.34em] text-[#64748B] px-6">{t}</span>
          <span className="text-[#00E5FF] text-[10px]">◆</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="overflow-hidden border-t border-b border-white/5 py-3" data-testid="editorial-marquee">
      <div className="marquee-track">
        {row}
        {row}
      </div>
    </div>
  );
}

export function Num({ children, className = "" }) {
  return <span className={`num ${className}`}>{children}</span>;
}
