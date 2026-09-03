import React from "react";

export function LogoMark({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M24 2 44 12v22L24 46 4 34V12L24 2Z" stroke="#00E5FF" strokeWidth="2.5" fill="rgba(0,229,255,0.08)" />
      <path d="M16 33V15h14" stroke="#F8FAFC" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M16 24h10" stroke="#00E5FF" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="35.5" cy="15" r="2.4" fill="#00E5FF" />
    </svg>
  );
}

export function LogoLockup({ compact = false, light = false }) {
  return (
    <div className="flex items-center gap-3" data-testid="felcont-logo">
      <LogoMark size={compact ? 30 : 42} />
      <div className="leading-none">
        <div
          className="font-display font-extrabold tracking-[0.18em]"
          style={{ fontSize: compact ? 15 : 22, color: light ? "#0E1424" : "#F8FAFC" }}
        >
          FELCONT
        </div>
        {!compact && (
          <div className="font-body text-[10px] tracking-[0.32em] uppercase mt-1.5" style={{ color: "#00B8D4" }}>
            Consultoria Contábil
          </div>
        )}
      </div>
    </div>
  );
}
