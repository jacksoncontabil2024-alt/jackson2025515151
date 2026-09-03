import React, { useState } from "react";
import { HelpCircle, ClipboardCopy, Check, Rocket, AlertOctagon, ArrowRight } from "lucide-react";
import { SlideShell } from "../SlideShell";
import { Reveal, Selo, Card, Marquee } from "../bits";
import { LogoLockup } from "../Logo";
import { QUESTOR_QUESTIONS, TICKET_TEXTO, STEPS, RISKS } from "../../data/slidesContent";

/* ---------------- 16 · PERGUNTAS QUESTOR ---------------- */
export function S16() {
  return (
    <SlideShell n={16} total={20} kicker="Fornecedor · preparação" title={["Perguntas a fazer ao suporte Questor"]}
      subtitle="Perguntas objetivas, por escrito — a resposta documentada vira evidência de planejamento."
      right={<Selo tipo="confirmar" />}>
      <div className="flex flex-1 flex-col justify-center gap-2.5 pt-1">
        {QUESTOR_QUESTIONS.map((q, i) => (
          <Reveal key={i} delay={0.2 + i * 0.07}>
            <div className="flex items-start gap-4 rounded-xl hairline bg-[#0E1424]/70 px-5 py-[9px] transition-colors hover:border-[rgba(0,229,255,0.3)]">
              <span className="num mt-0.5 text-[12px] font-bold text-[#00E5FF]">{String(i + 1).padStart(2, "0")}</span>
              <p className="text-[12.5px] leading-relaxed text-[#CBD5E1]">{q}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal delay={0.85}>
        <p className="mt-3 flex items-center gap-2 text-[12px] text-[#64748B]">
          <HelpCircle size={14} className="text-[#00E5FF]" />
          Regra da casa: nada de telefone — chamado formal, com protocolo e resposta por escrito.
        </p>
      </Reveal>
    </SlideShell>
  );
}

/* ---------------- 17 · MODELO DE CHAMADO ---------------- */
export function S17() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(TICKET_TEXTO);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (e) { /* clipboard indisponível em contexto inseguro */ }
  };
  return (
    <SlideShell n={17} total={20} kicker="Pronto para usar" title={["Modelo de chamado ao Questor"]}
      subtitle="Troque os colchetes pelos dados do cliente e envie. Um chamado por cliente — ou um chamado-mãe da Felcont."
      right={
        <button
          data-testid="copy-ticket-btn"
          onClick={copy}
          className="flex items-center gap-2 rounded-full border border-[rgba(0,229,255,0.4)] bg-[rgba(0,229,255,0.10)] px-4 py-2 font-mono2 text-[11px] uppercase tracking-[0.16em] text-[#00E5FF] transition-all hover:bg-[rgba(0,229,255,0.2)] active:scale-95"
        >
          {copied ? <Check size={13} /> : <ClipboardCopy size={13} />}
          {copied ? "Copiado!" : "Copiar texto"}
        </button>
      }>
      <Reveal delay={0.3} className="flex-1">
        <div className="h-full overflow-hidden rounded-xl hairline bg-[#0B101E]/90 p-6" data-testid="ticket-model">
          <pre className="whitespace-pre-wrap font-body text-[12px] leading-[1.65] text-[#94A3B8]">{TICKET_TEXTO}</pre>
        </div>
      </Reveal>
    </SlideShell>
  );
}

/* ---------------- 18 · PLANO 10 PASSOS ---------------- */
export function S18() {
  return (
    <SlideShell n={18} total={20} kicker="Execução" title={["Plano de ação Felcont 2026 — 10 passos"]}
      subtitle="Governança → diagnóstico → fornecedor → piloto → go-live. Cada passo com dono e prazo.">
      <div className="flex flex-1 flex-col justify-center gap-5 pt-1" data-testid="flowchart-10-steps">
        {[STEPS.slice(0, 5), STEPS.slice(5, 10)].map((row, r) => (
          <div key={r} className="relative grid grid-cols-5 gap-3">
            {r === 0 && (
              <div className="pointer-events-none absolute left-[10%] right-[10%] top-1/2 h-px bg-gradient-to-r from-[rgba(0,229,255,0.35)] via-[rgba(0,229,255,0.15)] to-[rgba(0,229,255,0.35)]" />
            )}
            {row.map((s, i) => (
              <Reveal key={s.n} delay={0.2 + (r * 5 + i) * 0.07} className="relative">
                <div className="group h-full rounded-xl hairline bg-[#0E1424]/85 p-3.5 transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(0,229,255,0.4)]">
                  <span className="num text-[15px] font-bold text-[#00E5FF] transition-shadow group-hover:text-glow">{s.n}</span>
                  <p className="mt-1.5 text-[12px] font-bold leading-tight text-[#F8FAFC]">{s.t}</p>
                  <p className="mt-1 text-[10.5px] leading-snug text-[#94A3B8]">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        ))}
      </div>
      <Reveal delay={0.95}>
        <p className="mt-4 flex items-center gap-2 text-[12px] text-[#64748B]">
          <Rocket size={14} className="text-[#00E5FF]" />
          Piloto recomendado: um cliente simples + um com arrendamentos e aplicações — cobre ~90% dos cenários da carteira.
        </p>
      </Reveal>
    </SlideShell>
  );
}

/* ---------------- 19 · RISCOS ---------------- */
export function S19() {
  return (
    <SlideShell n={19} total={20} kicker="Gestão de riscos" title={["O custo de deixar para a última hora"]}
      subtitle="O maior risco não é a norma ser difícil — é o tempo.">
      <div className="grid flex-1 grid-cols-3 gap-4 pt-2">
        {RISKS.map((r, i) => (
          <Reveal key={r.t} delay={0.2 + i * 0.08} className="h-full">
            <div className={`h-full rounded-xl border p-4 transition-transform duration-300 hover:-translate-y-1 ${
              r.nivel === "Alto"
                ? "border-[rgba(244,63,94,0.4)] bg-[rgba(244,63,94,0.06)]"
                : "border-[rgba(245,158,11,0.4)] bg-[rgba(245,158,11,0.06)]"
            }`}>
              <div className="flex items-center justify-between">
                <AlertOctagon size={16} className={r.nivel === "Alto" ? "text-[#F43F5E]" : "text-[#F59E0B]"} />
                <span className={`rounded-full border px-2.5 py-0.5 font-mono2 text-[10px] uppercase tracking-[0.14em] ${
                  r.nivel === "Alto" ? "border-[rgba(244,63,94,0.5)] text-[#F43F5E]" : "border-[rgba(245,158,11,0.5)] text-[#F59E0B]"
                }`}>{r.nivel}</span>
              </div>
              <p className="mt-2.5 text-[13px] font-bold leading-snug text-[#F8FAFC]">{r.t}</p>
              <p className="mt-1.5 text-[11.5px] leading-snug text-[#94A3B8]">{r.d}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal delay={0.85}>
        <p className="mt-4 text-[12.5px] text-[#64748B]">
          Uma glosa de auditoria em março de 2027 custa mais caro — em retrabalho e prazo regulatório — do que as horas de mapeamento em 2026.
        </p>
      </Reveal>
    </SlideShell>
  );
}

/* ---------------- 20 · CONCLUSÃO ---------------- */
export function S20() {
  const passos = ["Questor", "Orientação técnica", "Mapeamento", "Testes", "Implementação"];
  return (
    <SlideShell n={20} total={20} kicker="Fechamento" title={["Conclusão e próximos passos"]}
      subtitle="Transformar exigência regulatória em diferencial consultivo para os clientes.">
      <div className="grid flex-1 grid-cols-[1.1fr_1fr] gap-10 pt-2">
        <div className="flex flex-col justify-center gap-3.5">
          {[
            ["A norma já existe e tem data", "2027 obrigatória, com comparativo de 2026 reexpresso — retrospectiva integral."],
            ["A resposta é método, não pânico", "De-para, validação com o Questor e piloto — não plano de contas novo às cegas."],
            ["A Felcont sai na frente", "Quem orienta o cliente em 2026 vende tranquilidade — não retrabalho em 2027."],
          ].map(([t, d], i) => (
            <Reveal key={t} delay={0.25 + i * 0.12}>
              <div className="flex items-start gap-4 rounded-xl hairline bg-[#0E1424]/75 px-5 py-3.5">
                <span className="num mt-0.5 text-[13px] font-bold text-[#00E5FF]">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p className="text-[14px] font-bold text-[#F8FAFC]">{t}</p>
                  <p className="mt-0.5 text-[12.5px] text-[#94A3B8]">{d}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.55} className="flex flex-col justify-center">
          <div className="rounded-2xl border border-[rgba(0,229,255,0.3)] bg-[rgba(0,229,255,0.05)] p-6" style={{ boxShadow: "0 0 60px -18px rgba(0,229,255,0.35)" }}>
            <p className="font-mono2 text-[11px] uppercase tracking-[0.26em] text-[#00E5FF]">Cadeia de execução</p>
            <div className="mt-4 flex flex-col gap-2">
              {passos.map((p, i) => (
                <div key={p} className="flex items-center gap-3">
                  <div className="flex flex-1 items-center justify-between rounded-lg hairline bg-[#0E1424]/80 px-4 py-2.5">
                    <span className="text-[13px] font-semibold text-[#F8FAFC]">{p}</span>
                    <span className="num text-[11px] text-[#64748B]">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  {i < passos.length - 1 && <ArrowRight size={13} className="shrink-0 rotate-90 text-[#00E5FF]" />}
                </div>
              ))}
            </div>
            <div className="mt-5 border-t border-white/10 pt-4">
              <LogoLockup compact />
            </div>
          </div>
        </Reveal>
      </div>
      <div className="mt-4">
        <Marquee items={["Obrigado", "Felcont Consultoria Contábil", "CPC 51 · IFRS 18", "Preparação 2026 → Adoção 2027", "Dúvidas: fale com o comitê interno"]} />
      </div>
    </SlideShell>
  );
}
