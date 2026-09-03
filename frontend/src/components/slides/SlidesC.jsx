import React from "react";
import { ArrowRight, Waves, Flag, CalendarClock, Wrench } from "lucide-react";
import { SlideShell } from "../SlideShell";
import { Reveal, Selo, CatBadge, Card } from "../bits";
import { MAP_ROWS } from "../../data/slidesContent";

/* ---------------- 11 · DFC ---------------- */
export function S11() {
  const regras = [
    ["Juros recebidos", "Investimento", "investimento"],
    ["Dividendos recebidos", "Investimento", "investimento"],
    ["Juros pagos", "Financiamento", "financiamento"],
    ["Dividendos pagos", "Financiamento", "financiamento"],
  ];
  return (
    <SlideShell n={11} total={20} kicker="Demonstração dos fluxos de caixa" title={["Impactos na DFC"]}
      subtitle="O método indireto ganha novo ponto de partida — e acaba a liberdade de classificar juros e dividendos.">
      <div className="grid flex-1 grid-cols-[1fr_1.15fr] gap-8 pt-2">
        <div className="flex flex-col justify-center gap-4">
          <Reveal delay={0.3}>
            <div className="rounded-xl hairline bg-[#0E1424]/80 p-5">
              <p className="font-mono2 text-[11px] uppercase tracking-[0.24em] text-[#64748B]">Ponto de partida (método indireto)</p>
              <div className="mt-3 flex items-center gap-3 text-[13px]">
                <span className="rounded-lg border border-white/10 px-3 py-2 text-[#64748B] line-through decoration-[#F43F5E]/60">Lucro antes dos tributos</span>
                <ArrowRight size={15} className="shrink-0 text-[#00E5FF]" />
                <span className="rounded-lg border border-[#00E5FF] bg-[rgba(0,229,255,0.10)] px-3 py-2 font-semibold text-[#F8FAFC]">Lucro operacional</span>
              </div>
              <p className="mt-3 text-[12.5px] leading-relaxed text-[#94A3B8]">
                Menos ajustes artificiais: a reconciliação parte do subtotal que já exclui financiamento e tributos.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.5}>
            <p className="flex items-center gap-2 text-[12px] text-[#64748B]">
              <Waves size={14} className="text-[#00E5FF]" />
              Entidades com atividade principal financeira seguem regras próprias de classificação.
            </p>
          </Reveal>
        </div>
        <Reveal delay={0.45} className="flex flex-col justify-center">
          <div className="overflow-hidden rounded-xl hairline">
            <table className="w-full text-left" data-testid="dfc-table">
              <thead>
                <tr className="bg-[#0E1424]">
                  <th className="px-5 py-3 font-mono2 text-[10.5px] uppercase tracking-[0.18em] text-[#64748B]">Fluxo</th>
                  <th className="px-5 py-3 font-mono2 text-[10.5px] uppercase tracking-[0.18em] text-[#64748B]">Classificação na DFC</th>
                </tr>
              </thead>
              <tbody>
                {regras.map(([t, d, cat], i) => (
                  <tr key={i} className="border-t border-white/5 transition-colors hover:bg-white/[0.03]">
                    <td className="px-5 py-3.5 text-[13.5px] text-[#CBD5E1]">{t}</td>
                    <td className="px-5 py-3.5"><CatBadge cat={cat} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[12px] text-[#64748B]">
            Antes: discricionário (operacional, investimento ou financiamento). Agora: regra única — reparametrização obrigatória no sistema.
          </p>
        </Reveal>
      </div>
    </SlideShell>
  );
}

/* ---------------- 12 · BRASIL ---------------- */
export function S12() {
  const marcos = [
    { org: "CPC", doc: "CPC 51", d: "Pronunciamento técnico que substitui o CPC 26 (R1) — Apresentação das Demonstrações Contábeis." },
    { org: "CFC", doc: "NBC TG 51", d: "Norma brasileira de contabilidade publicada pelo Conselho Federal de Contabilidade em novembro de 2025." },
    { org: "CVM", doc: "Resolução nº 237", d: "Aprova o CPC 51 para companhias abertas e revoga as Resoluções CVM nº 106 e nº 156." },
    { org: "CVM", doc: "Resolução nº 238", d: "Torna obrigatório o Documento de Revisão nº 28, atualizando CPC 03, 06, 15 e outros em coerência." },
  ];
  return (
    <SlideShell n={12} total={20} kicker="Cenário regulatório" title={["Brasil — CPC 51 · NBC TG 51 · CVM 237"]}
      subtitle="Não é “norma de fora”: já é norma brasileira, com cadeia completa de regulação.">
      <div className="grid flex-1 grid-cols-2 gap-4 pt-2">
        {marcos.map((m, i) => (
          <Reveal key={m.doc} delay={0.25 + i * 0.1} className="h-full">
            <Card className="flex h-full items-start gap-4">
              <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg border border-[rgba(0,229,255,0.3)] bg-[rgba(0,229,255,0.08)]">
                <span className="font-display text-[12px] font-extrabold text-[#00E5FF]">{m.org}</span>
              </div>
              <div>
                <p className="text-[14px] font-bold text-[#F8FAFC]">{m.doc}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-[#94A3B8]">{m.d}</p>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>
      <Reveal delay={0.75}>
        <div className="mt-4 flex items-center justify-between gap-4 rounded-xl hairline bg-[#0E1424]/70 px-5 py-3.5">
          <p className="flex items-center gap-2.5 text-[12.5px] text-[#CBD5E1]">
            <Flag size={15} className="shrink-0 text-[#10B981]" />
            Adaptações brasileiras mantidas: <span className="text-[#F8FAFC] font-semibold">DVA</span> (Lei 6.404/76) e particularidades da Lei das S.A.
          </p>
          <span className="flex items-center gap-3">
            <span className="text-[11.5px] text-[#64748B]">Alcance da obrigatoriedade varia por tipo de entidade — validar cliente a cliente</span>
            <Selo tipo="confirmar" />
          </span>
        </div>
      </Reveal>
    </SlideShell>
  );
}

/* ---------------- 13 · VIGÊNCIA ---------------- */
export function S13() {
  const pontos = [
    { ano: "abr/2024", t: "Emissão da IFRS 18", d: "IASB publica a norma; início do debate global.", on: false },
    { ano: "2025", t: "CPC 51 · NBC TG 51 · CVM 237", d: "Convergência brasileira formalizada.", on: false },
    { ano: "2026", t: "Ano de preparação", d: "Mapeamento, de-para, pilotos — e o ano que virará comparativo reexpresso.", on: true },
    { ano: "2027", t: "Adoção obrigatória", d: "Exercícios iniciados em ou após 01/01/2027. Aplicação retrospectiva integral.", on: true },
  ];
  return (
    <SlideShell n={13} total={20} kicker="Vigência e transição" title={["2026 prepara · 2027 adota"]}
      subtitle="Aplicação antecipada é permitida (com divulgação). A transição é retrospectiva: o comparativo de 2026 entra no novo formato.">
      <div className="relative flex flex-1 items-center pt-2">
        <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-[rgba(0,229,255,0.4)] to-transparent" />
        <div className="grid w-full grid-cols-4 gap-5">
          {pontos.map((p, i) => (
            <Reveal key={p.ano} delay={0.25 + i * 0.14} className="relative">
              <div className={`mx-auto mb-4 h-3 w-3 rounded-full border-2 ${p.on ? "border-[#00E5FF] bg-[#00E5FF]" : "border-[#334155] bg-[#0E1424]"}`} style={p.on ? { boxShadow: "0 0 18px rgba(0,229,255,0.7)" } : {}} />
              <div className={`rounded-xl p-4 text-center ${p.on ? "border border-[rgba(0,229,255,0.35)] bg-[rgba(0,229,255,0.07)]" : "hairline bg-[#0E1424]/70"}`}>
                <p className={`num text-[15px] font-bold ${p.on ? "text-[#00E5FF]" : "text-[#94A3B8]"}`}>{p.ano}</p>
                <p className="mt-1 text-[13px] font-bold text-[#F8FAFC]">{p.t}</p>
                <p className="mt-1.5 text-[11.5px] leading-snug text-[#94A3B8]">{p.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
      <Reveal delay={0.9}>
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.07)] px-5 py-3">
          <CalendarClock size={16} className="shrink-0 text-[#F59E0B]" />
          <p className="text-[13px] text-[#CBD5E1]">
            <span className="font-semibold text-[#F8FAFC]">Por que 2026 importa:</span> o comparativo publicado em 2027 é o exercício de 2026 —
            quem não reexpressar durante o ano vai reconstruir 12 meses de classificação sob pressão de prazo.
          </p>
        </div>
      </Reveal>
    </SlideShell>
  );
}

/* ---------------- 14 · QUESTOR ---------------- */
export function S14() {
  return (
    <SlideShell n={14} total={20} kicker="Sistemas · ERP Questor" title={["“Precisamos mudar o plano de contas?”"]}
      subtitle="Resposta ponderada: não automaticamente. A norma exige classificação e apresentação — não necessariamente contas novas."
      right={<Selo tipo="confirmar" />}>
      <div className="grid flex-1 grid-cols-2 gap-6 pt-2">
        <Reveal delay={0.3}>
          <Card className="h-full border-[rgba(16,185,129,0.35)]" glow="rgba(16,185,129,0.12)">
            <p className="font-mono2 text-[11px] uppercase tracking-[0.24em] text-[#10B981]">Caminho provável — sem quebrar histórico</p>
            <ul className="mt-3 space-y-2.5 text-[13px] leading-relaxed text-[#CBD5E1]">
              <li className="flex gap-2"><span className="text-[#10B981]">—</span>Tabela de de-para: conta existente × categoria CPC 51.</li>
              <li className="flex gap-2"><span className="text-[#10B981]">—</span>Parametrização no Questor por conta ou centro de resultado.</li>
              <li className="flex gap-2"><span className="text-[#10B981]">—</span>Relatórios DRE/DFC remontados a partir do de-para.</li>
              <li className="flex gap-2"><span className="text-[#10B981]">—</span>Histórico e comparabilidade interna preservados.</li>
            </ul>
          </Card>
        </Reveal>
        <Reveal delay={0.45}>
          <Card className="h-full border-[rgba(245,158,11,0.35)]" glow="rgba(245,158,11,0.10)">
            <p className="font-mono2 text-[11px] uppercase tracking-[0.24em] text-[#F59E0B]">Quando pode exigir contas novas</p>
            <ul className="mt-3 space-y-2.5 text-[13px] leading-relaxed text-[#CBD5E1]">
              <li className="flex gap-2"><span className="text-[#F59E0B]">—</span>Contas “guarda-chuva” (ex.: outras despesas genéricas) precisam de desdobramento.</li>
              <li className="flex gap-2"><span className="text-[#F59E0B]">—</span>Despesas por função exigem rateio de natureza rastreável.</li>
              <li className="flex gap-2"><span className="text-[#F59E0B]">—</span>MPMs pedem campos/tags para reconciliação automática.</li>
              <li className="flex gap-2"><span className="text-[#F59E0B]">—</span>Decisão final depende do roadmap do fornecedor.</li>
            </ul>
          </Card>
        </Reveal>
      </div>
      <Reveal delay={0.7}>
        <p className="mt-4 flex items-center gap-2.5 text-[13px] text-[#CBD5E1]">
          <Wrench size={15} className="shrink-0 text-[#00E5FF]" />
          Conduta Felcont: <span className="font-semibold text-[#F8FAFC]">primeiro o chamado formal ao Questor</span>, depois qualquer alteração de plano de contas — nunca antes.
        </p>
      </Reveal>
    </SlideShell>
  );
}

/* ---------------- 15 · MAPEAMENTO ---------------- */
export function S15() {
  return (
    <SlideShell n={15} total={20} kicker="De-para · exemplo" title={["Tabela de mapeamento de contas"]}
      right={
        <span className="flex flex-col items-end gap-2">
          <Selo tipo="ficticio" />
          <Selo tipo="confirmar" />
        </span>
      }>
      <Reveal delay={0.3} className="flex-1">
        <div className="overflow-hidden rounded-xl hairline">
          <table className="w-full text-left" data-testid="mapping-table">
            <thead>
              <tr className="bg-[#0E1424]">
                {["Conta", "Descrição", "Categoria CPC 51", "Relatório", "Ação"].map((h) => (
                  <th key={h} className="px-4 py-3 font-mono2 text-[10.5px] uppercase tracking-[0.18em] text-[#64748B]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MAP_ROWS.map((r, i) => (
                <tr key={i} className="border-t border-white/5 transition-colors hover:bg-white/[0.03]">
                  <td className="px-4 py-[9px]"><span className="num text-[12px] text-[#00E5FF]">{r.conta}</span></td>
                  <td className="px-4 py-[9px] text-[12.5px] text-[#CBD5E1]">{r.desc}</td>
                  <td className="px-4 py-[9px]"><CatBadge cat={r.cat} short /></td>
                  <td className="px-4 py-[9px] font-mono2 text-[11px] uppercase tracking-wider text-[#64748B]">{r.relatorio}</td>
                  <td className="px-4 py-[9px] text-[12px] text-[#94A3B8]">{r.acao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
      <Reveal delay={0.6}>
        <p className="mt-3 text-[11.5px] text-[#64748B]">
          Recorte ilustrativo — o de-para real nasce do plano de contas de cada cliente, validado com a parametrização do Questor.
        </p>
      </Reveal>
    </SlideShell>
  );
}
