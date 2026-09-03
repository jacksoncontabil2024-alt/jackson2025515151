import React from "react";

export function LogoMark({ size = 40 }) {
  return (
    <img
      src="/brand/emblem.png"
      alt="Emblema Felcont"
      style={{ height: size, width: size, objectFit: "contain" }}
    />
  );
}

export function LogoLockup({ compact = false }) {
  return (
    <div className="flex items-center gap-3" data-testid="felcont-logo">
      <img
        src="/brand/emblem.png"
        alt="Emblema Felcont"
        style={{ height: compact ? 28 : 42, width: "auto", objectFit: "contain" }}
      />
      <div className="leading-none">
        <div
          className="font-display font-extrabold tracking-wide text-[#F8FAFC]"
          style={{ fontSize: compact ? 17 : 24 }}
        >
          Felcont
        </div>
        {!compact && (
          <div className="font-body mt-1.5 text-[9.5px] uppercase tracking-[0.26em] text-[#2DD4BF]">
            Contabilidade, Finanças e Auditoria
          </div>
        )}
      </div>
    </div>
  );
}
