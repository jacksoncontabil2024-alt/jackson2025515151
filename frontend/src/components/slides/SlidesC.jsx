import React from "react";
import { ArrowRight, Waves, Flag, CalendarClock, Wrench, Wallet, ArrowLeftRight, ShieldCheck, Percent, Building2 } from "lucide-react";
import { SlideShell } from "../SlideShell";
import { Reveal, Selo, CatBadge, Card } from "../bits";
import { MAP_ROWS } from "../../data/slidesContent";

/* ---------------- DFC ---------------- */
export function S11() {
  const regras = [
    ["Juros recebidos", "investimento"],
    ["Dividendos recebidos", "investimento"],
    ["Juros pagos", "financiamento"],
    ["Dividendos pagos", "financiamento"],
  ];
  return (
    <SlideShell kicker="Demonstração dos fluxos de caixa" title={["Impactos na DFC"]}
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
                {regras.map(([t, cat], i) => (
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

/* ---------------- TESOURARIA (novo — base: IFRS 18 Efeitos da Tesouraria na DRE) ---------------- */
export function S12B() {
  const cards = [
    {
      icon: Wallet,
      color: "#10B981",
      t: "Caixa e aplicações financeiras",
      d: "Rendimentos de caixa e equivalentes → Investimento. A variação cambial do caixa em moeda estrangeira também vai para Investimento — atenção ao descasamento com a dívida em moeda, que é Financiamento.",
      badge: "investimento",
    },
    {
      icon: ArrowLeftRight,
      color: "#00E5FF",
      t: "Variações cambiais",
      d: "Seguem a categoria do item de origem: contas a receber de clientes em dólar → Operacional; empréstimo em moeda estrangeira → Financiamento.",
      badge: null,
    },
    {
      icon: ShieldCheck,
      color: "#38BDF8",
      t: "Hedge e derivativos",
      d: "Mesma categoria do risco protegido. Se um único derivativo cobre riscos de categorias diferentes (ex.: receita + juros), a regra do “grossing up” joga o resultado no Operacional.",
      badge: null,
    },
    {
      icon: Percent,
      color: "#8B5CF6",
      t: "Juros e arrendamentos",
      d: "Juros de empréstimos e de arrendamentos (CPC 06) → Financiamento. Mas a depreciação do direito de uso fica no Operacional — DRE e DFC podem divergir.",
      badge: "financiamento",
    },
  ];
  return (
    <SlideShell kicker="Tesouraria · classificação fina" title={["Juros, câmbio e hedge na nova DRE"]}
      subtitle="Onde a classificação mais pega na prática — regras extraídas do material oficial de efeitos da tesouraria na IFRS 18.">
      <div className="grid flex-1 grid-cols-2 grid-rows-2 gap-3.5 pt-1">
        {cards.map((c, i) => (
          <Reveal key={c.t} delay={0.25 + i * 0.09} className="h-full">
            <div className="flex h-full flex-col rounded-xl hairline bg-[#0E1424]/80 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(0,229,255,0.3)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border" style={{ borderColor: `${c.color}55`, background: `${c.color}14` }}>
                    <c.icon size={15} style={{ color: c.color }} />
                  </span>
                  <h3 className="font-display text-[13.5px] font-bold text-[#F8FAFC]">{c.t}</h3>
                </div>
                {c.badge && <CatBadge cat={c.badge} short />}
              </div>
              <p className="mt-2.5 text-[11.5px] leading-relaxed text-[#94A3B8]">{c.d}</p>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal delay={0.75}>
        <div className="mt-3.5 flex items-center gap-3 rounded-xl border border-[rgba(139,92,246,0.35)] bg-[rgba(139,92,246,0.07)] px-5 py-3">
          <Building2 size={16} className="shrink-0 text-[#8B5CF6]" />
          <p className="text-[12px] leading-snug text-[#CBD5E1]">
            <span className="font-semibold text-[#F8FAFC]">Serviços financeiros:</span> bancos e seguradoras (atividade principal de financiar/investir) classificam juros e resultado de investimentos no{" "}
            <span className="text-[#00E5FF]">Operacional</span> — ex.: a receita líquida de juros de um banco é receita operacional.
          </p>
        </div>
      </Reveal>
    </SlideShell>
  );
}

/* ---------------- BRASIL ---------------- */
export function S12() {
  const marcos = [
    { org: "CPC", doc: "CPC 51", d: "Pronunciamento técnico que substitui o CPC 26 (R1) — Apresentação das Demonstrações Contábeis." },
    { org: "CFC", doc: "NBC TG 51", d: "Norma brasileira de contabilidade publicada pelo Conselho Federal de Contabilidade em novembro de 2025." },
    { org: "CVM", doc: "Resolução nº 237", d: "Aprova o CPC 51 para companhias abertas e revoga as Resoluções CVM nº 106 e nº 156." },
    { org: "CVM", doc: "Resolução nº 238", d: "Torna obrigatório o Documento de Revisão nº 28, atualizando CPC 03, 06, 15 e outros em coerência." },
  ];
  return (
    <SlideShell kicker="Cenário regulatório" title={["Brasil — CPC 51 · NBC TG 51 · CVM 237"]}
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
        <div className="mt-4 rounded-xl hairline bg-[#0E1424]/70 px-5 py-3">
          <p className="flex items-center gap-2.5 text-[12px] text-[#CBD5E1]">
            <Flag size={15} className="shrink-0 text-[#10B981]" />
            Adaptações brasileiras mantidas: <span className="text-[#F8FAFC] font-semibold">DVA</span> (Lei 6.404/76) e particularidades da Lei das S.A.
            <span className="text-[#64748B]">· Alcance varia por tipo de entidade — validar cliente a cliente.</span>
          </p>
          <div className="mt-2"><Selo tipo="confirmar" /></div>
        </div>
      </Reveal>
    </SlideShell>
  );
}

/* ---------------- VIGÊNCIA ---------------- */
export function S13() {
  const pontos = [
    { ano: "abr/2024", t: "Emissão da IFRS 18", d: "IASB publica a norma; início do debate global.", on: false },
    { ano: "2025", t: "CPC 51 · NBC TG 51 · CVM 237", d: "Convergência brasileira formalizada.", on: false },
    { ano: "2026", t: "Ano de preparação", d: "Mapeamento, de-para, pilotos — e o ano que virará comparativo reexpresso.", on: true },
    { ano: "2027", t: "Adoção obrigatória", d: "Exercícios a partir de 01/01/2027 + reconciliação linha a linha do comparativo (IAS 1 → CPC 51).", on: true },
  ];
  return (
    <SlideShell kicker="Vigência e transição" title={["2026 prepara · 2027 adota"]}
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
          <p className="text-[12.5px] text-[#CBD5E1]">
            <span className="font-semibold text-[#F8FAFC]">Por que 2026 importa:</span> o comparativo publicado em 2027 é o exercício de 2026 — quem não reexpressar durante o ano vai reconstruir 12 meses sob pressão.
            Primeiras interinas no novo formato: <span className="text-[#F8FAFC]">mar/2027</span> · anuais completas: <span className="text-[#F8FAFC]">dez/2027</span>.
          </p>
        </div>
      </Reveal>
    </SlideShell>
  );
}

/* ---------------- QUESTOR ---------------- */
export function S14() {
  return (
    <SlideShell kicker="Sistemas · ERP Questor" title={["“Precisamos mudar o plano de contas?”"]}
      subtitle="Resposta ponderada: não automaticamente. A norma exige classificação e apresentação — não necessariamente contas novas."
      right={<Selo tipo="confirmar" />}>
      <div className="grid flex-1 grid-cols-2 gap-6 pt-2">
        <Reveal delay={0.3}>
          <Card className="h-full border-[rgba(16,185,129,0.35)]" glow="rgba(16,185,129,0.12)">
            <p className="font-mono2 text-[11px] uppercase tracking-[0.24em] text-[#10B981]">O que já existe no Questor hoje</p>
            <ul className="mt-3 space-y-2.5 text-[12.5px] leading-relaxed text-[#CBD5E1]">
              <li className="flex gap-2"><span className="text-[#10B981]">—</span>Rotina <span className="text-[#F8FAFC]">“Optante pelo IFRS”</span>: Operações › Contabilidade › Contabilidade Geral.</li>
              <li className="flex gap-2"><span className="text-[#10B981]">—</span>Modelos de adoção: <span className="text-[#F8FAFC]">Normal (completa), PME e ITG</span>, com histórico por período.</li>
              <li className="flex gap-2"><span className="text-[#10B981]">—</span><span className="text-[#F8FAFC]">“Controla Atividades”</span> já gera a DRE por atividade, em colunas separadas.</li>
              <li className="flex gap-2"><span className="text-[#10B981]">—</span>Data de adoção é <span className="text-[#F8FAFC]">irreversível</span> — exige exercício anterior fechado e relatórios emitidos.</li>
            </ul>
          </Card>
        </Reveal>
        <Reveal delay={0.45}>
          <Card className="h-full border-[rgba(245,158,11,0.35)]" glow="rgba(245,158,11,0.10)">
            <p className="font-mono2 text-[11px] uppercase tracking-[0.24em] text-[#F59E0B]">O que ainda precisamos confirmar</p>
            <ul className="mt-3 space-y-2.5 text-[12.5px] leading-relaxed text-[#CBD5E1]">
              <li className="flex gap-2"><span className="text-[#F59E0B]">—</span>As <span className="text-[#F8FAFC]">5 categorias do CPC 51</span> nativas e o de-para conta × categoria.</li>
              <li className="flex gap-2"><span className="text-[#F59E0B]">—</span>Subtotais obrigatórios automáticos na DRE (operacional; antes de financiamento e tributos).</li>
              <li className="flex gap-2"><span className="text-[#F59E0B]">—</span>DFC reparametrizada (juros/dividendos) e MPMs com reconciliação.</li>
              <li className="flex gap-2"><span className="text-[#F59E0B]">—</span>Comparativos de 2026 reexpressos e exportação do de-para.</li>
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

/* ---------------- MAPEAMENTO ---------------- */
export function S15() {
  return (
    <SlideShell kicker="De-para · exemplo" title={["Tabela de mapeamento de contas"]}
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
