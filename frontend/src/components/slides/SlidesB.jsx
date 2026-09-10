import React from "react";
import { Sigma, FileText, SplitSquareHorizontal, Table2, ArrowDown } from "lucide-react";
import { SlideShell } from "../SlideShell";
import { Reveal, Selo, CatBadge, Card, Num, CATS } from "../bits";
import { DRE_ROWS, DESAGREGACAO, fmtBRL } from "../../data/slidesContent";

/* ---------------- LAFT ---------------- */
export function S6() {
  return (
    <SlideShell kicker="Subtotal obrigatório nº 2" title={["Lucro antes de financiamento e tributos"]}
      subtitle="Lucro operacional + resultado da categoria de investimento — o desempenho antes da estrutura de capital e dos tributos.">
      <div className="grid flex-1 grid-cols-2 gap-8 pt-2">
        <div className="flex flex-col justify-center gap-4">
          <Reveal delay={0.3}>
            <div className="space-y-2.5">
              <div className="cat-chip cat-operacional flex items-center justify-between rounded-xl border px-5 py-3.5">
                <span className="text-[14px] font-semibold text-[#F8FAFC]">Lucro operacional</span>
                <CatBadge cat="operacional" />
              </div>
              <div className="flex justify-center"><span className="font-display text-xl text-[#64748B]">+</span></div>
              <div className="cat-chip cat-investimento flex items-center justify-between rounded-xl border px-5 py-3.5">
                <span className="text-[14px] font-semibold text-[#F8FAFC]">Categoria de investimento</span>
                <CatBadge cat="investimento" />
              </div>
              <div className="flex justify-center"><ArrowDown size={16} className="text-[#64748B]" /></div>
              <div className="flex items-center justify-between rounded-xl border-2 border-[#00E5FF] bg-[rgba(0,229,255,0.10)] px-5 py-4" style={{ boxShadow: "0 0 44px -10px rgba(0,229,255,0.35)" }}>
                <span className="font-display text-[15px] font-extrabold text-[#F8FAFC]">Lucro antes de financiamento e tributos</span>
                <Sigma size={18} className="text-[#00E5FF]" />
              </div>
            </div>
          </Reveal>
        </div>
        <Reveal delay={0.5} className="flex flex-col justify-center">
          <div className="space-y-4">
            <Card>
              <p className="text-[14px] leading-relaxed text-[#CBD5E1]">
                É o equivalente padronizado do <span className="text-[#F8FAFC] font-semibold">“EBIT”</span> que
                analistas calculavam por conta própria — agora exigido, com regra única de composição.
              </p>
            </Card>
            <Card>
              <p className="text-[14px] leading-relaxed text-[#CBD5E1]">
                Permite comparar empresas com <span className="text-[#F8FAFC] font-semibold">estruturas de capital
                diferentes</span>: uma alavancada e outra sem dívida passam a ser comparáveis na operação e no investimento.
              </p>
            </Card>
            <p className="font-mono2 text-[11px] uppercase tracking-[0.22em] text-[#64748B]">
              Depois dele entram: financiamento → impostos sobre a renda → operações descontinuadas
            </p>
          </div>
        </Reveal>
      </div>
    </SlideShell>
  );
}

/* ---------------- DRE FICTÍCIA ---------------- */
export function S7() {
  return (
    <SlideShell kicker="Slide-destaque · demonstração" title={["Exemplo de DRE no novo formato"]}
      right={<Selo tipo="ficticio" />}>
      <Reveal delay={0.3} className="flex-1">
        <div className="overflow-hidden rounded-xl hairline bg-[#0B101E]/90">
          <table className="w-full text-left" data-testid="dre-table">
            <tbody>
              {DRE_ROWS.map((r, i) => (
                <tr
                  key={i}
                  className={`border-b border-white/5 transition-colors hover:bg-white/[0.03] ${
                    r.subtotal ? "bg-[rgba(0,229,255,0.07)]" : ""
                  } ${r.final ? "bg-[rgba(0,229,255,0.14)]" : ""}`}
                >
                  <td className={`px-5 py-[4.5px] text-[12px] ${r.subtotal ? "font-display font-extrabold tracking-wide text-[#F8FAFC]" : "text-[#94A3B8] pl-9"}`}>
                    {r.label}
                  </td>
                  <td className="w-[150px] px-3 py-[4.5px]">
                    {r.cat && !r.subtotal && <CatBadge cat={r.cat} short />}
                    {r.subtotal && r.cat && <CatBadge cat={r.cat} short />}
                  </td>
                  <td className={`w-[170px] px-5 py-[4.5px] text-right text-[12.5px] ${r.subtotal ? "font-bold text-[#00E5FF]" : "text-[#CBD5E1]"}`}>
                    <Num>{fmtBRL(r.valor)}</Num>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
    </SlideShell>
  );
}

/* ---------------- MPMs ---------------- */
export function S8() {
  const regras = [
    ["Nota explicativa única", "Todas as MPMs concentradas em uma única nota das demonstrações."],
    ["Reconciliação obrigatória", "Linha a linha até o subtotal IFRS/CPC mais diretamente comparável."],
    ["Efeitos tributários e de PNCL", "Impostos e participações de não controladores por item reconciliado."],
    ["Por que a medida é útil", "Explicação da visão da administração e de mudanças de critério."],
  ];
  return (
    <SlideShell kicker="Divulgação" title={["MPMs — medidas definidas pela administração"]}
      subtitle="EBITDA ajustado, lucro recorrente, resultado “sem efeitos não recorrentes”: a norma não proíbe — disciplina.">
      <div className="grid flex-1 grid-cols-[1fr_1.1fr] gap-8 pt-2">
        <Reveal delay={0.3} className="flex flex-col justify-center">
          <div className="rounded-xl hairline bg-[#0E1424]/80 p-5">
            <p className="font-mono2 text-[11px] uppercase tracking-[0.24em] text-[#64748B]">O que enquadra uma medida como MPM</p>
            <ul className="mt-3 space-y-2.5 text-[13px] leading-relaxed text-[#CBD5E1]">
              <li className="flex gap-2"><span className="text-[#00E5FF]">1.</span><span>Subtotal de receitas e despesas;</span></li>
              <li className="flex gap-2"><span className="text-[#00E5FF]">2.</span><span>Usado em comunicação pública <span className="text-[#F8FAFC]">fora</span> das demonstrações (releases, apresentações);</span></li>
              <li className="flex gap-2"><span className="text-[#00E5FF]">3.</span><span>Que transmite a visão da administração sobre o desempenho.</span></li>
            </ul>
            <div className="mt-4 rounded-lg border border-[rgba(56,189,248,0.3)] bg-[rgba(56,189,248,0.07)] px-4 py-3">
              <p className="font-mono2 text-[9.5px] uppercase tracking-[0.18em] text-[#38BDF8]">Exemplo ilustrativo oficial IASB · € mil</p>
              <div className="mt-2 space-y-1 text-[11.5px]">
                <div className="flex justify-between gap-3"><span className="text-[#CBD5E1]">“Lucro do negócio principal” (MPM)</span><Num className="text-[#F8FAFC]">45.844</Num></div>
                <div className="flex justify-between gap-3"><span className="text-[#94A3B8]">(−) Coligadas/JVs integrais (MEP)</span><Num className="text-[#94A3B8]">(257)</Num></div>
                <div className="flex justify-between gap-3 border-t border-white/10 pt-1"><span className="font-semibold text-[#F8FAFC]">= Lucro bruto (subtotal IFRS)</span><Num className="font-bold text-[#00E5FF]">45.588</Num></div>
                <p className="pt-1 text-[10px] text-[#64748B]">Comparativo reexpresso 2024: 45.644 → 45.296 · com explicação escrita da visão da administração.</p>
              </div>
            </div>
          </div>
        </Reveal>
        <div className="flex flex-col justify-center gap-3">
          {regras.map(([t, d], i) => (
            <Reveal key={t} delay={0.4 + i * 0.1}>
              <div className="flex items-start gap-4 rounded-xl hairline bg-[#0E1424]/70 px-5 py-3.5 transition-colors hover:border-[rgba(0,229,255,0.3)]">
                <FileText size={16} className="mt-0.5 shrink-0 text-[#00E5FF]" />
                <div>
                  <p className="text-[13.5px] font-semibold text-[#F8FAFC]">{t}</p>
                  <p className="mt-0.5 text-[12.5px] text-[#94A3B8]">{d}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </SlideShell>
  );
}

/* ---------------- AGREGAÇÃO ---------------- */
export function S9() {
  const total = DESAGREGACAO.depois.reduce((a, b) => a + b.valor, 0);
  return (
    <SlideShell kicker="Transparência" title={["Agregação e desagregação"]}
      subtitle="Agregar só o que é semelhante; desagregar o que é relevante. “Outros” vira residual — e precisa se justificar."
      right={<Selo tipo="ficticio" />}>
      <div className="grid flex-1 grid-cols-[1fr_auto_1.4fr] items-center gap-6 pt-2">
        <Reveal delay={0.3}>
          <div className="rounded-xl border border-[rgba(244,63,94,0.35)] bg-[rgba(244,63,94,0.06)] p-5">
            <p className="font-mono2 text-[11px] uppercase tracking-[0.24em] text-[#F43F5E]">Antes</p>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-[15px] text-[#CBD5E1]">{DESAGREGACAO.antes.label}</span>
              <Num className="text-xl font-bold text-[#F8FAFC]">{fmtBRL(DESAGREGACAO.antes.valor)}</Num>
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-[#94A3B8]">
              Uma linha opaca: ninguém sabe o que está dentro — nem o investidor, nem o auditor.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.5}>
          <SplitSquareHorizontal size={26} className="text-[#00E5FF]" />
        </Reveal>
        <Reveal delay={0.55}>
          <div className="rounded-xl border border-[rgba(0,229,255,0.3)] bg-[rgba(0,229,255,0.05)] p-5">
            <p className="font-mono2 text-[11px] uppercase tracking-[0.24em] text-[#00E5FF]">Depois</p>
            <div className="mt-3 space-y-2">
              {DESAGREGACAO.depois.map((r, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="flex-1 text-[13px] text-[#CBD5E1]">{r.label}</span>
                  <div className="h-1.5 rounded-full" style={{ width: `${(r.valor / 900000) * 110}px`, background: i === DESAGREGACAO.depois.length - 1 ? "#334155" : "#00E5FF" }} />
                  <Num className="w-[90px] text-right text-[12.5px] text-[#F8FAFC]">{fmtBRL(r.valor)}</Num>
                </div>
              ))}
              <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
                <span className="text-[12px] font-semibold text-[#F8FAFC]">Total (inalterado)</span>
                <Num className="text-[13px] font-bold text-[#00E5FF]">{fmtBRL(total)}</Num>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
      <Reveal delay={0.8}>
        <p className="mt-4 text-[12.5px] text-[#64748B]">
          O valor total não muda — muda a <span className="text-[#F8FAFC]">qualidade da informação</span>. Linhas “outras” grandes serão questionadas por auditores e reguladores.
        </p>
      </Reveal>
    </SlideShell>
  );
}

/* ---------------- NATUREZA × FUNÇÃO ---------------- */
export function S10() {
  return (
    <SlideShell kicker="Despesas operacionais" title={["Natureza × função × combinação"]}
      subtitle="Na categoria operacional, as despesas seguem o critério mais útil aos usuários — com um dever extra para quem escolher função.">
      <div className="grid flex-1 grid-cols-3 gap-5 pt-2">
        <Reveal delay={0.3}>
          <Card className="h-full">
            <p className="font-mono2 text-[11px] uppercase tracking-[0.24em] text-[#00E5FF]">Por natureza</p>
            <p className="mt-2 text-[12.5px] text-[#94A3B8]">Classifica pelo tipo do gasto:</p>
            <ul className="mt-2 space-y-1.5 text-[12.5px] text-[#CBD5E1]">
              <li>· Matéria-prima e insumos</li>
              <li>· Pessoal e encargos</li>
              <li>· Depreciação e amortização</li>
              <li>· Serviços de terceiros</li>
            </ul>
          </Card>
        </Reveal>
        <Reveal delay={0.45}>
          <Card className="h-full">
            <p className="font-mono2 text-[11px] uppercase tracking-[0.24em] text-[#38BDF8]">Por função</p>
            <p className="mt-2 text-[12.5px] text-[#94A3B8]">Classifica pela área que consome:</p>
            <ul className="mt-2 space-y-1.5 text-[12.5px] text-[#CBD5E1]">
              <li>· CPV / custo dos serviços</li>
              <li>· Despesas com vendas</li>
              <li>· Despesas administrativas</li>
            </ul>
            <p className="mt-3 rounded-lg border border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.08)] px-3 py-2 text-[11.5px] text-[#FBBF24]">
              Dever extra: divulgar em nota depreciação, amortização, benefícios a empregados, impairment e baixas de estoque.
            </p>
          </Card>
        </Reveal>
        <Reveal delay={0.6}>
          <Card className="h-full" glow="rgba(0,229,255,0.15)">
            <p className="font-mono2 text-[11px] uppercase tracking-[0.24em] text-[#10B981]">Combinação</p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-[#CBD5E1]">
              Mista é permitida quando for a mais útil — parte por função, parte por natureza.
            </p>
            <p className="mt-3 text-[12.5px] leading-relaxed text-[#94A3B8]">
              O critério precisa ser <span className="text-[#F8FAFC]">consistente entre períodos</span> e explicado nas notas.
            </p>
            <div className="mt-4 flex items-center gap-2 text-[#64748B]">
              <Table2 size={14} className="text-[#00E5FF]" />
              <span className="text-[11.5px]">Impacto direto no plano de contas e no de-para</span>
            </div>
          </Card>
        </Reveal>
      </div>
      <Reveal delay={0.8}>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl hairline bg-[#0E1424]/70 px-5 py-3">
          <span className="font-mono2 text-[9.5px] uppercase tracking-[0.18em] text-[#64748B]">Exemplo ilustrativo oficial IASB · nota por natureza (€ mil)</span>
          <span className="text-[11.5px] text-[#CBD5E1]">
            Depreciação alocada por função →{" "}
            <Num className="text-[#F8FAFC]">CPV 5.322 · Serviços 1.664 · Vendas 1.890 · Adm 1.188 · P&amp;D 310</Num>
          </span>
        </div>
      </Reveal>
    </SlideShell>
  );
}
