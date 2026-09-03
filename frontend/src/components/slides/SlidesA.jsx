import React, { useContext } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Scale, Layers, Globe2, Landmark, AlertTriangle } from "lucide-react";
import { LogoLockup } from "../Logo";
import { SlideShell } from "../SlideShell";
import { Reveal, MaskedTitle, Selo, CatBadge, Card, Marquee, Num, StaticCtx, EASE, CATS } from "../bits";

/* ---------------- 1 · CAPA ---------------- */
export function S1() {
  const isStatic = useContext(StaticCtx);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 50, damping: 20 });
  const sy = useSpring(my, { stiffness: 50, damping: 20 });
  const ox = useTransform(sx, [-1, 1], [-26, 26]);
  const oy = useTransform(sy, [-1, 1], [-18, 18]);
  const gx = useTransform(sx, [-1, 1], [14, -14]);
  const gy = useTransform(sy, [-1, 1], [10, -10]);

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden bg-[#070A12]"
      data-testid="slide-capa"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
        my.set(((e.clientY - r.top) / r.height) * 2 - 1);
      }}
    >
      <motion.div className="deck-grid-bg absolute inset-0" style={isStatic ? {} : { x: gx, y: gy }} />
      <motion.div
        className="pointer-events-none absolute right-[-160px] top-[-160px] h-[560px] w-[560px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(0,229,255,0.16) 0%, transparent 62%)",
          ...(isStatic ? {} : { x: ox, y: oy }),
        }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-[60px] left-[38%] h-[320px] w-[320px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(56,189,248,0.10) 0%, transparent 60%)",
          ...(isStatic ? {} : { x: gy, y: ox }),
        }}
      />
      <div className="relative z-10 flex items-center justify-between px-14 pt-10">
        <LogoLockup />
        <span className="font-mono2 text-[11px] uppercase tracking-[0.3em] text-[#64748B]">
          Apresentação técnica · 2026
        </span>
      </div>
      <div className="relative z-10 flex flex-1 flex-col justify-center px-14">
        <Reveal delay={0.15}>
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px w-12 bg-[#00E5FF]" />
            <span className="font-mono2 text-xs uppercase tracking-[0.34em] text-[#00E5FF]">
              Nova norma de apresentação das demonstrações
            </span>
          </div>
        </Reveal>
        <MaskedTitle
          as="h1"
          baseDelay={0.3}
          lines={[
            <span key="a">CPC 51 <span className="text-[#334155] font-light">|</span> IFRS 18</span>,
            <span key="b" className="text-[#00E5FF] text-glow">O que muda nas demonstrações</span>,
          ]}
          className="text-[64px] font-extrabold leading-[1.02] tracking-tight text-[#F8FAFC]"
        />
        <Reveal delay={0.75}>
          <p className="mt-6 max-w-[720px] text-lg leading-relaxed text-[#94A3B8]">
            O que muda nas demonstrações contábeis e como devemos nos preparar — um guia prático
            para a equipe Felcont e seus clientes.
          </p>
        </Reveal>
        <Reveal delay={0.95}>
          <div className="mt-8 flex flex-wrap items-center gap-2.5">
            {["IASB · IFRS 18 · abr/2024", "CFC · NBC TG 51", "CVM · Resolução nº 237", "Vigência · exercícios a partir de 2027"].map((c) => (
              <span key={c} className="rounded-full hairline bg-[#0E1424]/70 px-4 py-1.5 font-mono2 text-[11px] tracking-[0.12em] text-[#94A3B8]">
                {c}
              </span>
            ))}
          </div>
        </Reveal>
        <Reveal delay={1.15}>
          <div className="mt-9 flex items-center gap-2 text-[#64748B]">
            <span className="font-mono2 text-[11px] uppercase tracking-[0.24em]">
              Setas navegam · P apresentador · O visão geral · M imprimir
            </span>
            <ArrowRight size={14} className="text-[#00E5FF]" />
          </div>
        </Reveal>
      </div>
      <div className="relative z-10">
        <Marquee
          items={["CPC 51 · IFRS 18", "A maior reforma na apresentação das demonstrações em duas décadas", "Preparação 2026", "Adoção obrigatória 2027", "Comparativos reexpressos", "Felcont Consultoria Contábil"]}
        />
      </div>
    </div>
  );
}

/* ---------------- 2 · INTRODUÇÃO ---------------- */
export function S2() {
  return (
    <SlideShell n={2} total={20} kicker="Introdução" title={["O que é a IFRS 18 — e o que é o CPC 51"]}
      subtitle="A mesma norma, em dois idiomas regulatórios: global (IASB) e brasileiro (CPC / CFC / CVM).">
      <div className="grid flex-1 grid-cols-3 gap-5 pt-2">
        <Reveal delay={0.35}>
          <Card className="h-full" glow="rgba(0,229,255,0.18)">
            <Globe2 size={22} className="text-[#00E5FF]" />
            <h3 className="font-display mt-4 text-lg font-bold">IFRS 18 · IASB</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-[#94A3B8]">
              Emitida em <span className="text-[#F8FAFC]">abril de 2024</span> pelo International Accounting
              Standards Board. Substitui a <span className="text-[#F8FAFC]">IAS 1</span> na apresentação e
              divulgação das demonstrações.
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-[#94A3B8]">
              Objetivo: <span className="text-[#00E5FF]">comparabilidade</span> — acabar com cada empresa
              apresentando o resultado de um jeito.
            </p>
          </Card>
        </Reveal>
        <Reveal delay={0.5}>
          <Card className="h-full" glow="rgba(16,185,129,0.14)">
            <Landmark size={22} className="text-[#10B981]" />
            <h3 className="font-display mt-4 text-lg font-bold">CPC 51 · Brasil</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-[#94A3B8]">
              Pronunciamento do <span className="text-[#F8FAFC]">CPC</span>, norma{" "}
              <span className="text-[#F8FAFC]">NBC TG 51</span> do CFC e{" "}
              <span className="text-[#F8FAFC]">Resolução CVM nº 237</span>. Substitui o{" "}
              <span className="text-[#F8FAFC]">CPC 26 (R1)</span>.
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-[#94A3B8]">
              Convergência integral com a IFRS 18, com adaptações brasileiras — como a manutenção da{" "}
              <span className="text-[#F8FAFC]">DVA</span>.
            </p>
          </Card>
        </Reveal>
        <Reveal delay={0.65}>
          <Card className="h-full" glow="rgba(56,189,248,0.14)">
            <Scale size={22} className="text-[#38BDF8]" />
            <h3 className="font-display mt-4 text-lg font-bold">Por que isso importa</h3>
            <ul className="mt-2 space-y-2.5 text-[13px] leading-relaxed text-[#94A3B8]">
              <li className="flex gap-2"><span className="text-[#00E5FF]">—</span>Investidores e bancos comparam empresas pelos subtotais da DRE.</li>
              <li className="flex gap-2"><span className="text-[#00E5FF]">—</span>Hoje esses subtotais não são padronizados nem exigidos.</li>
              <li className="flex gap-2"><span className="text-[#00E5FF]">—</span>A norma fixa estrutura, subtotais e divulgações mínimas.</li>
            </ul>
          </Card>
        </Reveal>
      </div>
      <Reveal delay={0.85}>
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-[rgba(0,229,255,0.25)] bg-[rgba(0,229,255,0.06)] px-5 py-3">
          <Layers size={16} className="shrink-0 text-[#00E5FF]" />
          <p className="text-[13px] text-[#CBD5E1]">
            <span className="font-semibold text-[#F8FAFC]">Relação direta:</span> quem aplica CPC 26 (R1) hoje
            passará a aplicar o CPC 51 — não é uma norma “a mais”, é a substituta.
          </p>
        </div>
      </Reveal>
    </SlideShell>
  );
}

/* ---------------- 3 · O QUE MUDA ---------------- */
export function S3() {
  const items = [
    ["Classificação", "Receitas e despesas em 5 categorias obrigatórias"],
    ["Subtotais", "Lucro operacional + lucro antes de financiamento e tributos"],
    ["MPMs / MPDAs", "Medidas da administração com nota de reconciliação"],
    ["Agregação", "Fim da linha genérica de “outras despesas”"],
    ["Divulgação", "Notas explicativas mais densas e padronizadas"],
    ["Comparabilidade", "Mesma estrutura para todas as empresas"],
    ["Plano de contas", "De-para conta × categoria (não necessariamente contas novas)"],
    ["Sistemas / ERP", "Parametrização do Questor e rotinas de fechamento"],
    ["DFC", "Ponto de partida e classificação de juros e dividendos"],
    ["Indicadores & covenants", "Contratos atrelados a subtotais precisam ser relidos"],
  ];
  return (
    <SlideShell n={3} total={20} kicker="Visão geral" title={["O que muda na prática"]}
      subtitle="Três eixos — classificar, apresentar e divulgar — com efeitos em toda a cadeia contábil.">
      <div className="grid flex-1 grid-cols-5 grid-rows-2 gap-3 pt-1">
        {items.map(([t, d], i) => (
          <Reveal key={t} delay={0.25 + i * 0.06} className="h-full">
            <Card className="flex h-full flex-col p-4">
              <span className="num text-[11px] text-[#334155]">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="font-display mt-1.5 text-[14px] font-bold leading-tight text-[#F8FAFC]">{t}</h3>
              <p className="mt-1.5 text-[11.5px] leading-snug text-[#94A3B8]">{d}</p>
            </Card>
          </Reveal>
        ))}
      </div>
      <Reveal delay={0.95}>
        <p className="mt-4 flex items-center gap-2 text-[12.5px] text-[#64748B]">
          <AlertTriangle size={14} className="text-[#F59E0B]" />
          Nenhum item muda o <span className="text-[#F8FAFC]">lucro líquido final</span> — muda como ele é decomposto, apresentado e explicado.
        </p>
      </Reveal>
    </SlideShell>
  );
}

/* ---------------- 4 · 5 CATEGORIAS ---------------- */
export function S4() {
  const cats = [
    { k: "operacional", d: "Categoria residual: toda receita e despesa das atividades principais que não cair nas demais." },
    { k: "investimento", d: "Retornos gerados de forma independente: aplicações, equivalência patrimonial, ativos de investimento." },
    { k: "financiamento", d: "Captação de recursos: empréstimos, debêntures e juros de passivos (inclui arrendamentos)." },
    { k: "impostos", d: "IRPJ e CSLL correntes e diferidos (CPC 32 / IAS 12) e variações cambiais correlatas." },
    { k: "descontinuadas", d: "Resultado de operações descontinuadas conforme CPC 31 / IFRS 5." },
  ];
  return (
    <SlideShell n={4} total={20} kicker="Nova estrutura da DRE" title={["Cinco categorias obrigatórias"]}
      subtitle="Toda receita e despesa da demonstração do resultado entra em uma — e somente uma — destas categorias.">
      <div className="grid flex-1 grid-cols-5 gap-3 pt-1">
        {cats.map((c, i) => (
          <Reveal key={c.k} delay={0.25 + i * 0.09} className="h-full">
            <div
              className={`cat-chip ${CATS[c.k].cls} flex h-full flex-col rounded-xl border p-4 transition-transform duration-300 hover:-translate-y-1.5`}
            >
              <span className="num text-[22px] font-bold" style={{ color: CATS[c.k].hex }}>{String(i + 1).padStart(2, "0")}</span>
              <h3 className="font-display mt-2 text-[15px] font-bold leading-tight text-[#F8FAFC]">{CATS[c.k].nome}</h3>
              <p className="mt-2 text-[11.5px] leading-snug text-[#94A3B8]">{c.d}</p>
              <div className="mt-auto pt-3"><CatBadge cat={c.k} /></div>
            </div>
          </Reveal>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Reveal delay={0.8}>
          <div className="rounded-xl border border-[rgba(244,63,94,0.35)] bg-[rgba(244,63,94,0.07)] px-5 py-3">
            <p className="text-[13px] text-[#CBD5E1]">
              <span className="font-semibold text-[#F43F5E]">Regra de ouro:</span> não se classifica pelo{" "}
              <span className="text-[#F8FAFC]">nome da conta</span>, e sim pela{" "}
              <span className="text-[#F8FAFC]">natureza da transação</span>.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.92}>
          <div className="rounded-xl border border-[rgba(0,229,255,0.25)] bg-[rgba(0,229,255,0.06)] px-5 py-3">
            <p className="text-[13px] text-[#CBD5E1]">
              <span className="font-semibold text-[#00E5FF]">Exceção:</span> entidades cuja atividade principal é{" "}
              <span className="text-[#F8FAFC]">financiar clientes ou investir</span> (bancos, seguradoras) classificam
              esses resultados no operacional.
            </p>
          </div>
        </Reveal>
      </div>
    </SlideShell>
  );
}

/* ---------------- 5 · LUCRO OPERACIONAL ---------------- */
export function S5() {
  const stack = [
    { t: "Receitas e despesas da operação", w: "100%", c: "#00E5FF", o: 1 },
    { t: "Sem exclusões “não recorrentes” discricionárias", w: "78%", c: "#00B8D4", o: 0.8 },
    { t: "Mesma regra para toda empresa e todo período", w: "56%", c: "#38BDF8", o: 0.65 },
  ];
  return (
    <SlideShell n={5} total={20} kicker="Subtotal obrigatório nº 1" title={["Lucro / prejuízo operacional"]}
      subtitle="A soma de todas as receitas e despesas da categoria operacional — o primeiro número que o mercado vai comparar.">
      <div className="grid flex-1 grid-cols-[1.15fr_1fr] gap-8 pt-2">
        <div className="flex flex-col justify-center gap-4">
          <Reveal delay={0.3}>
            <div className="rounded-xl hairline bg-[#0E1424]/80 p-5">
              <p className="font-mono2 text-[11px] uppercase tracking-[0.24em] text-[#64748B]">Definição</p>
              <p className="mt-2 text-[15px] leading-relaxed text-[#CBD5E1]">
                Subtotal que <span className="text-[#F8FAFC] font-semibold">não admite ajuste de critério</span>:
                tudo que é da operação entra, nada sai “por conveniência”. A depreciação de ativo operacional,
                por exemplo, fica dentro — sempre.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.5}>
            <div className="rounded-xl border border-[rgba(0,229,255,0.25)] bg-[rgba(0,229,255,0.06)] p-5">
              <p className="font-mono2 text-[11px] uppercase tracking-[0.24em] text-[#00E5FF]">Por que melhora a comparabilidade</p>
              <ul className="mt-2 space-y-2 text-[13.5px] text-[#CBD5E1]">
                <li className="flex gap-2"><span className="text-[#00E5FF]">—</span>Separa o desempenho da operação das decisões de financiamento.</li>
                <li className="flex gap-2"><span className="text-[#00E5FF]">—</span>Comparável entre concorrentes, setores e períodos.</li>
                <li className="flex gap-2"><span className="text-[#00E5FF]">—</span>Passa a ser o ponto de partida da DFC (método indireto).</li>
              </ul>
            </div>
          </Reveal>
        </div>
        <Reveal delay={0.55} className="flex flex-col justify-center">
          <div className="space-y-3">
            {stack.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="h-14 rounded-lg border flex items-center px-4"
                  style={{ width: s.w, borderColor: `${s.c}55`, background: `${s.c}14` }}
                >
                  <span className="text-[12.5px] text-[#CBD5E1]">{s.t}</span>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-3 pt-2">
              <div className="h-px flex-1 bg-gradient-to-r from-[#00E5FF] to-transparent" />
              <span className="font-mono2 text-[11px] uppercase tracking-[0.22em] text-[#00E5FF]">= Lucro operacional</span>
            </div>
          </div>
        </Reveal>
      </div>
    </SlideShell>
  );
}
