import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { api, brl, statusLabel } from "@/reports/api";
import {
  ArrowLeft, CheckCircle2, AlertTriangle, HelpCircle, Info, Sparkles, Loader2,
  FileDown, Presentation, Eye, EyeOff, Copy, Trash2, ChevronUp, ChevronDown, Save,
  Share2, ExternalLink, RefreshCw, Ban, Link2, Check,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
} from "recharts";

const C = { teal: "#04B7AF", indigo: "#322F6A", amber: "#E8A13A", green: "#57B14A", red: "#D6453F", gray: "#9AA0B4" };
const TABS = [
  ["validacao", "Validação"], ["painel", "Painel"], ["dre", "DRE"],
  ["balanco", "Balanço"], ["folha", "Folha"], ["diagnostico", "Diagnóstico"], ["editor", "Editor & Exportar"],
];

export default function Analise() {
  const { id } = useParams();
  const [a, setA] = useState(null);
  const [tab, setTab] = useState("validacao");
  const reload = useCallback(() => api.get(`/analyses/${id}`).then((r) => setA(r.data)), [id]);
  useEffect(() => { reload(); }, [reload]);

  if (!a) return <div className="rp-empty">Carregando análise…</div>;
  const meta = a.meta || {};
  const hasFolha = !!(a.financials || {}).folha;
  const tabs = TABS.filter(([k]) => k !== "folha" || hasFolha);
  return (
    <div data-testid="analise-page">
      <Link to="/" className="rp-back"><ArrowLeft size={16} /> Dashboard</Link>
      <div className="rp-head">
        <div>
          <h1>{meta.client_name || a.client_name}</h1>
          <p>{a.period_label} · {a.cnpj || "CNPJ não informado"} · Responsável: {a.responsavel || "—"}</p>
        </div>
        <div className="rp-head-actions">
          <SharePortal clientId={a.client_id} />
          <span className={"rp-badge rp-badge-" + a.status}>{statusLabel[a.status] || a.status}</span>
        </div>
      </div>

      <div className="rp-tabs">
        {tabs.map(([k, l]) => (
          <button key={k} className={"rp-tab" + (tab === k ? " on" : "")} data-testid={`tab-${k}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "validacao" && <Validacao a={a} />}
      {tab === "painel" && <Painel a={a} />}
      {tab === "dre" && <DRE a={a} />}
      {tab === "balanco" && <Balanco a={a} />}
      {tab === "folha" && <Folha a={a} />}
      {tab === "diagnostico" && <Diagnostico a={a} reload={reload} />}
      {tab === "editor" && <Editor a={a} reload={reload} />}
    </div>
  );
}

/* ---------------------------------------------------------------- Validação */
function Validacao({ a }) {
  const v = a.validation || {};
  const overall = v.overall;
  const docs = a.documents || [];
  return (
    <div data-testid="painel-validacao">
      <div className={"rp-vbanner " + (overall === "ok" ? "ok" : overall === "alerta" ? "warn" : "neutral")}>
        {overall === "ok" ? <CheckCircle2 size={26} /> : <AlertTriangle size={26} />}
        <div>
          <b>{overall === "ok" ? "Dados consistentes" : overall === "alerta" ? "Possível inconsistência" : "Conferência parcial"}</b>
          <span>Revise os números antes de gerar o relatório final.</span>
        </div>
      </div>

      <div className="rp-card">
        <div className="rp-card-h"><h3>Documentos reconhecidos</h3></div>
        {docs.map((d) => (
          <div key={d.id} className="rp-row" data-testid={`doc-${d.id}`}>
            <div><b>{d.filename}</b><span className="rp-muted">{d.error ? "Erro na leitura" : "Extraído com IA"}</span></div>
            <span className="rp-pill">{d.doc_type}</span>
          </div>
        ))}
      </div>

      <div className="rp-card">
        <div className="rp-card-h"><h3>Conferências</h3></div>
        {(v.checks || []).map((c, i) => (
          <div key={i} className="rp-check" data-testid={`check-${i}`}>
            {c.status === "ok" ? <CheckCircle2 size={20} color={C.green} /> :
              c.status === "alerta" ? <AlertTriangle size={20} color={C.amber} /> : <Info size={20} color={C.gray} />}
            <div className="rp-check-b">
              <b>{c.label}</b>
              <span>{c.message}{c.expected ? ` · Esperado ${c.expected} · Encontrado ${c.found}` : ""}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Painel */
function KPI({ c }) {
  const [open, setOpen] = useState(false);
  const neg = (c.value || 0) < 0;
  const acc = c.key === "resultado_liquido" && neg ? C.red : C.teal;
  return (
    <div className="rp-kpi" data-testid={`kpi-${c.key}`} style={{ borderTopColor: acc }}>
      <div className="rp-kpi-lab">{c.label}</div>
      <div className="rp-kpi-val" style={{ color: neg ? C.red : C.indigo }}>{c.display}</div>
      <button className="rp-origin" data-testid={`origin-${c.key}`} onClick={() => setOpen(!open)}>
        <HelpCircle size={13} /> Ver origem
      </button>
      {open && (
        <div className="rp-origin-box">
          <b>Como foi calculado</b>
          <p>{c.formula}</p>
          {(c.sources || []).map((s, i) => (
            <p key={i} className="rp-muted">Documento: {s.doc || "—"}{s.linha ? ` · Linha: ${s.linha}` : ""}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export function Painel({ a }) {
  const ind = a.indicators || {};
  const fin = a.financials || {};
  const cmp = ind.computed || {};
  const cards = ind.cards || [];
  const liq = (ind.liquidez || []).filter((x) => x.value != null);
  const caixa = fin.caixa_mensal || [];
  const receitaData = [
    { name: "Receita Líq.", v: cmp.rol, c: C.teal },
    { name: "Lucro Bruto", v: cmp.lucro_bruto, c: C.green },
    { name: "Result. Op.", v: cmp.res_op, c: C.indigo },
    { name: "Result. Líq.", v: cmp.res_liq, c: C.amber },
  ].filter((x) => x.v != null);

  return (
    <div data-testid="painel-dashboard">
      <div className="rp-kpis" data-testid="kpi-grid">
        {cards.map((c) => <KPI key={c.key} c={c} />)}
      </div>

      {receitaData.length > 0 && (
        <div className="rp-card">
          <div className="rp-card-h"><h3>Receita e Resultado</h3></div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={receitaData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => (v / 1000).toFixed(0) + "k"} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => brl(v)} />
              <Bar dataKey="v" radius={[6, 6, 0, 0]}>
                {receitaData.map((e, i) => <Cell key={i} fill={e.c} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {caixa.length > 0 && (
        <div className="rp-card">
          <div className="rp-card-h"><h3>Disponibilidade de Caixa</h3></div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={caixa.map((x) => ({ name: x.mes, v: x.caixa }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => (v / 1000).toFixed(0) + "k"} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => brl(v)} />
              <Bar dataKey="v" fill={C.indigo} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {liq.length > 0 && (
        <div className="rp-card">
          <div className="rp-card-h"><h3>Liquidez</h3></div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={liq.map((x) => ({ name: x.label.replace("Liquidez ", ""), v: x.value }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="v" fill={C.teal} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="rp-liq-notes">
            {liq.map((x) => <div key={x.key}><b>{x.display}</b> {x.label} — <span className="rp-muted">{x.interpretation}</span></div>)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- DRE + Waterfall */
function wfSteps(dre) {
  const g = (k) => (dre[k] == null ? null : Number(dre[k]));
  let rob = g("receita_operacional_bruta"), ded = g("deducoes"), rol = g("receita_operacional_liquida");
  let custos = g("custos"), lucro = g("lucro_bruto"), desp = g("despesas_operacionais");
  let res = g("resultado_liquido"); if (res == null) res = g("resultado_operacional");
  if (rol == null && rob != null && ded != null) rol = rob - Math.abs(ded);
  if (lucro == null && rol != null && custos != null) lucro = rol - Math.abs(custos);
  const seq = [
    ["Receita Bruta", "total", rob], ["(–) Deduções", "delta", ded == null ? null : -Math.abs(ded)],
    ["Receita Líquida", "total", rol], ["(–) Custos", "delta", custos == null ? null : -Math.abs(custos)],
    ["Lucro Bruto", "total", lucro], ["(–) Despesas", "delta", desp == null ? null : -Math.abs(desp)],
    ["Resultado", "total", res],
  ];
  let running = 0; const out = [];
  for (const [label, kind, val] of seq) {
    if (val == null) continue;
    let b, t;
    if (kind === "total") { b = 0; t = val; running = val; }
    else { b = running; t = running + val; running = t; }
    let color = C.teal;
    if (kind === "total") { if (label.includes("Lucro")) color = C.green; else if (label.includes("Resultado")) color = val >= 0 ? C.green : C.red; }
    else color = val >= 0 ? C.green : C.amber;
    out.push({ name: label, range: [b, t], value: val, color });
  }
  return out;
}

function Waterfall({ dre }) {
  const steps = wfSteps(dre);
  if (steps.length < 2) return null;
  return (
    <div className="rp-card" data-testid="dre-waterfall">
      <div className="rp-card-h"><h3>Formação do Resultado (Cascata)</h3></div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={steps} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} />
          <YAxis tickFormatter={(v) => (v / 1000).toFixed(0) + "k"} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v, n, p) => brl(p.payload.value)} labelStyle={{ fontWeight: 700 }} />
          <Bar dataKey="range" radius={[4, 4, 4, 4]}>
            {steps.map((e, i) => <Cell key={i} fill={e.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DRE({ a }) {
  const dre = (a.financials || {}).dre;
  if (!dre) return <div className="rp-empty">Nenhuma DRE identificada nos documentos enviados.</div>;
  const rows = [
    ["Receita Operacional Bruta", "receita_operacional_bruta", false],
    ["(–) Deduções", "deducoes", false],
    ["(=) Receita Operacional Líquida", "receita_operacional_liquida", true],
    ["(–) Custos", "custos", false],
    ["(=) Lucro Bruto", "lucro_bruto", true],
    ["(–) Despesas Operacionais", "despesas_operacionais", false],
    ["(+) Receitas Financeiras", "receitas_financeiras", false],
    ["(=) Resultado Operacional", "resultado_operacional", true],
    ["(=) Resultado antes dos Tributos", "resultado_antes_tributos", false],
    ["(=) Resultado Líquido", "resultado_liquido", true],
  ].filter(([, k]) => dre[k] != null);
  return (
    <div data-testid="painel-dre">
      <Waterfall dre={dre} />
      <div className="rp-card">
        <div className="rp-card-h"><h3>DRE Gerencial — padrão FELCONT</h3></div>
        <table className="rp-table">
          <thead><tr><th>Conta</th><th className="r">Valor (R$)</th></tr></thead>
          <tbody>
            {rows.map(([lbl, k, hl]) => (
              <tr key={k} className={hl ? "hl" : ""}>
                <td>{lbl}</td>
                <td className="r" style={{ color: dre[k] < 0 ? C.red : undefined }}>{brl(dre[k])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Folha */
export function Folha({ a }) {
  const folha = (a.financials || {}).folha;
  if (!folha) return <div className="rp-empty">Nenhuma folha de pagamento identificada.</div>;
  const comp = [
    { name: "Proventos", v: folha.proventos, c: C.indigo },
    { name: "Encargos", v: folha.encargos, c: C.teal },
    { name: "Benefícios", v: folha.beneficios, c: C.green },
    { name: "Provisões", v: folha.provisoes, c: C.amber },
  ].filter((x) => x.v != null).map((x) => ({ ...x, v: Number(x.v) }));
  const mensal = (folha.mensal || []).map((m) => ({
    name: m.mes, Proventos: Number(m.proventos || 0), Encargos: Number(m.encargos || 0),
    Benefícios: Number(m.beneficios || 0), Provisões: Number(m.provisoes || 0),
  }));
  const kpis = [
    ["Custo Total", folha.custo_total], ["Proventos", folha.proventos],
    ["Encargos Sociais", folha.encargos], ["Colaboradores", folha.num_colaboradores],
  ].filter(([, v]) => v != null);
  return (
    <div data-testid="painel-folha">
      <div className="rp-kpis">
        {kpis.map(([lab, v]) => (
          <div className="rp-kpi" key={lab} style={{ borderTopColor: C.teal }}>
            <div className="rp-kpi-lab">{lab}</div>
            <div className="rp-kpi-val" style={{ color: C.indigo }}>{lab === "Colaboradores" ? Number(v) : brl(Number(v))}</div>
          </div>
        ))}
      </div>
      {comp.length > 0 && (
        <div className="rp-card"><div className="rp-card-h"><h3>Composição da Folha</h3></div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={comp}><CartesianGrid strokeDasharray="3 3" stroke="#eef" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis tickFormatter={(v) => (v / 1000).toFixed(0) + "k"} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => brl(v)} />
              <Bar dataKey="v" radius={[6, 6, 0, 0]}>{comp.map((e, i) => <Cell key={i} fill={e.c} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {mensal.length > 0 && (
        <div className="rp-card"><div className="rp-card-h"><h3>Evolução Mensal da Folha</h3></div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mensal}><CartesianGrid strokeDasharray="3 3" stroke="#eef" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tickFormatter={(v) => (v / 1000).toFixed(0) + "k"} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => brl(v)} />
              <Bar dataKey="Proventos" stackId="f" fill={C.indigo} />
              <Bar dataKey="Encargos" stackId="f" fill={C.teal} />
              <Bar dataKey="Benefícios" stackId="f" fill={C.green} />
              <Bar dataKey="Provisões" stackId="f" fill={C.amber} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- Balanço */
export function Balanco({ a }) {
  const bal = (a.financials || {}).balanco;
  if (!bal) return <div className="rp-empty">Nenhum Balanço Patrimonial identificado.</div>;
  const grp = (sec, title) => {
    const s = bal[sec] || {};
    return (
      <div className="rp-bgrp" key={sec}>
        <div className="rp-bgrp-h">{title}</div>
        {(s.contas || []).map((c, i) => (
          <div className="rp-brow" key={i}><span>{c.descricao}</span><b style={{ color: (c.valor || 0) < 0 ? C.red : undefined }}>{brl(c.valor)}</b></div>
        ))}
        {s.total != null && <div className="rp-brow tot"><span>Total</span><b>{brl(s.total)}</b></div>}
      </div>
    );
  };
  return (
    <div className="rp-grid2" data-testid="painel-balanco">
      <div className="rp-card"><div className="rp-card-h"><h3 style={{ color: C.indigo }}>ATIVO (Aplicações)</h3></div>
        {grp("ativo_circulante", "Ativo Circulante")}{grp("ativo_nao_circulante", "Ativo Não Circulante")}</div>
      <div className="rp-card"><div className="rp-card-h"><h3 style={{ color: C.teal }}>PASSIVO + PL (Origens)</h3></div>
        {grp("passivo_circulante", "Passivo Circulante")}{grp("passivo_nao_circulante", "Passivo Não Circulante")}{grp("patrimonio_liquido", "Patrimônio Líquido")}</div>
    </div>
  );
}

/* ---------------------------------------------------------------- Diagnóstico */
export function DiagnosticoView({ diag }) {
  const C2 = { teal: "#04B7AF", indigo: "#322F6A", amber: "#E8A13A", green: "#57B14A", red: "#D6453F" };
  const tipoColor = (t) => t === "Risco" ? C2.red : t === "Ponto de Atenção" ? C2.amber : t === "Oportunidade" ? C2.teal : t === "Ponto Positivo" ? C2.green : C2.indigo;
  if (!diag || (!diag.resumo_executivo && !(diag.diagnostico || []).length))
    return <div className="rp-empty">Diagnóstico ainda não disponível para este período.</div>;
  return (
    <div data-testid="painel-diagnostico">
      {diag.resumo_executivo && (
        <div className="rp-card"><div className="rp-card-h"><h3>Resumo Executivo</h3></div><p className="rp-lead">{diag.resumo_executivo}</p></div>
      )}
      {(diag.diagnostico || []).length > 0 && (
        <div className="rp-card"><div className="rp-card-h"><h3>Diagnóstico FELCONT</h3></div>
          {(diag.diagnostico || []).map((d, i) => (
            <div className="rp-diag" key={i} style={{ borderLeftColor: tipoColor(d.tipo) }}>
              <span className="rp-diag-tag" style={{ color: tipoColor(d.tipo) }}>{d.tipo}</span>
              <b>{d.titulo}</b><p>{d.texto}</p>
            </div>
          ))}
        </div>
      )}
      {(diag.recomendacoes || []).length > 0 && (
        <div className="rp-card"><div className="rp-card-h"><h3>Recomendações Gerenciais</h3></div>
          {(diag.recomendacoes || []).map((r, i) => (
            <div className="rp-diag" key={i} style={{ borderLeftColor: C2.teal }}><b>{r.titulo}</b><p>{r.texto}</p></div>
          ))}
        </div>
      )}
    </div>
  );
}

function Diagnostico({ a, reload }) {
  const [busy, setBusy] = useState(false);
  const diag = a.diagnosis;
  const run = async () => { setBusy(true); await api.post(`/analyses/${a.id}/diagnose`); await reload(); setBusy(false); };
  const tipoColor = (t) => t === "Risco" ? C.red : t === "Ponto de Atenção" ? C.amber : t === "Oportunidade" ? C.teal : t === "Ponto Positivo" ? C.green : C.indigo;

  if (!diag) {
    return (
      <div className="rp-card rp-diag-empty" data-testid="diag-empty">
        <Sparkles size={30} color={C.teal} />
        <b>Diagnóstico gerencial com IA</b>
        <p>A IA vai interpretar os indicadores já calculados e sugerir pontos de atenção e recomendações — sempre com base nos números importados, com revisão humana.</p>
        <button className="rp-btn rp-btn-primary" data-testid="btn-diagnose" onClick={run} disabled={busy}>
          {busy ? <><Loader2 className="rp-spin" size={18} /> Gerando…</> : <><Sparkles size={18} /> Gerar diagnóstico</>}
        </button>
      </div>
    );
  }
  return (
    <div data-testid="painel-diagnostico">
      {diag.resumo_executivo && (
        <div className="rp-card"><div className="rp-card-h"><h3>Resumo Executivo</h3></div><p className="rp-lead">{diag.resumo_executivo}</p></div>
      )}
      <div className="rp-card"><div className="rp-card-h"><h3>Diagnóstico FELCONT</h3>
        <button className="rp-btn rp-btn-ghost sm" onClick={run} disabled={busy}>{busy ? "Atualizando…" : "Regerar"}</button></div>
        {(diag.diagnostico || []).map((d, i) => (
          <div className="rp-diag" key={i} data-testid={`diag-${i}`} style={{ borderLeftColor: tipoColor(d.tipo) }}>
            <span className="rp-diag-tag" style={{ color: tipoColor(d.tipo) }}>{d.tipo}</span>
            <b>{d.titulo}</b><p>{d.texto}</p>
          </div>
        ))}
      </div>
      <div className="rp-card"><div className="rp-card-h"><h3>Recomendações Gerenciais</h3></div>
        {(diag.recomendacoes || []).map((r, i) => (
          <div className="rp-diag" key={i} style={{ borderLeftColor: C.teal }}><b>{r.titulo}</b><p>{r.texto}</p></div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Editor */
function Editor({ a, reload }) {
  const [slides, setSlides] = useState(a.slides || []);
  const [saving, setSaving] = useState(false);
  const [gen, setGen] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setSlides(a.slides || []); }, [a.slides]);

  const upd = (i, patch) => setSlides((s) => s.map((x, k) => k === i ? { ...x, ...patch } : x));
  const move = (i, dir) => setSlides((s) => {
    const j = i + dir; if (j < 0 || j >= s.length) return s;
    const c = [...s]; [c[i], c[j]] = [c[j], c[i]]; return c;
  });
  const dup = (i) => setSlides((s) => { const c = [...s]; c.splice(i + 1, 0, { ...s[i], id: Math.random().toString(36).slice(2, 8) }); return c; });
  const del = (i) => setSlides((s) => s.filter((_, k) => k !== i));

  const save = async () => { setSaving(true); await api.put(`/analyses/${a.id}/slides`, { slides }); setSaving(false); };
  const generate = async () => {
    setBusy(true); await api.put(`/analyses/${a.id}/slides`, { slides });
    const { data } = await api.post(`/analyses/${a.id}/generate`); setGen(data); setBusy(false); await reload();
  };
  const dl = (path) => `${process.env.REACT_APP_BACKEND_URL}${path}`;

  if (!a.slides || a.slides.length === 0)
    return <div className="rp-empty" data-testid="editor-empty">Gere o diagnóstico primeiro (aba Diagnóstico) para montar os slides.</div>;

  const visibleCount = slides.filter((s) => s.visible).length;

  return (
    <div data-testid="painel-editor">
      <div className="rp-editor-bar">
        <span>{visibleCount} de {slides.length} slides visíveis</span>
        <div className="rp-editor-actions">
          <button className="rp-btn rp-btn-ghost" onClick={save} disabled={saving} data-testid="btn-save-slides">
            <Save size={16} /> {saving ? "Salvando…" : "Salvar"}
          </button>
          <button className="rp-btn rp-btn-primary" onClick={generate} disabled={busy} data-testid="btn-generate">
            {busy ? <><Loader2 className="rp-spin" size={16} /> Gerando PPTX/PDF…</> : <><Sparkles size={16} /> Gerar Relatório</>}
          </button>
        </div>
      </div>

      {gen && (
        <div className="rp-download" data-testid="download-box">
          <b>Relatório gerado ({gen.slides} slides) ✓</b>
          <div>
            <a className="rp-btn rp-btn-primary" href={dl(gen.pptx_url)} data-testid="dl-pptx"><Presentation size={16} /> Baixar PowerPoint</a>
            {gen.pdf_url && <a className="rp-btn rp-btn-ghost" href={dl(gen.pdf_url)} data-testid="dl-pdf"><FileDown size={16} /> Baixar PDF</a>}
          </div>
        </div>
      )}

      <div className="rp-slides">
        {slides.map((sl, i) => (
          <div key={sl.id} className={"rp-slide" + (sl.visible ? "" : " off")} data-testid={`slide-${i}`}>
            <div className="rp-slide-n">{i + 1}</div>
            <div className="rp-slide-body">
              <input className="rp-slide-title" value={sl.title || ""} onChange={(e) => upd(i, { title: e.target.value })} data-testid={`slide-title-${i}`} />
              <span className="rp-slide-type">{sl.type}</span>
              <textarea className="rp-slide-notes" placeholder="Observação / comentário para este slide…"
                value={sl.notes || ""} onChange={(e) => upd(i, { notes: e.target.value })} data-testid={`slide-notes-${i}`} rows={2} />
            </div>
            <div className="rp-slide-tools">
              <button title="Subir" onClick={() => move(i, -1)} data-testid={`slide-up-${i}`}><ChevronUp size={16} /></button>
              <button title="Descer" onClick={() => move(i, 1)} data-testid={`slide-down-${i}`}><ChevronDown size={16} /></button>
              <button title={sl.visible ? "Ocultar" : "Mostrar"} onClick={() => upd(i, { visible: !sl.visible })} data-testid={`slide-toggle-${i}`}>
                {sl.visible ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <button title="Duplicar" onClick={() => dup(i)} data-testid={`slide-dup-${i}`}><Copy size={16} /></button>
              <button title="Excluir" onClick={() => del(i)} data-testid={`slide-del-${i}`}><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Compartilhar com Cliente */
function SharePortal({ clientId }) {
  const [open, setOpen] = useState(false);
  const [p, setP] = useState(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullUrl = p?.path ? `${window.location.origin}${p.path}` : "";
  const load = useCallback(async () => {
    if (!clientId) return;
    const { data } = await api.get(`/clients/${clientId}/portal`); setP(data);
  }, [clientId]);
  useEffect(() => { if (open) load(); }, [open, load]);

  const act = async (verb) => {
    setBusy(true);
    const url = verb === "create" ? `/clients/${clientId}/portal`
      : `/clients/${clientId}/portal/${verb}`;
    const { data } = await api.post(url);
    setP(verb === "revoke" ? { exists: false, active: false } : data);
    setBusy(false);
  };
  const copy = () => {
    navigator.clipboard?.writeText(fullUrl);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };
  const fmt = (s) => s ? new Date(s).toLocaleString("pt-BR") : "—";

  return (
    <div className="rp-share">
      <button className="rp-btn rp-btn-ghost" onClick={() => setOpen(!open)} data-testid="btn-share-portal">
        <Share2 size={16} /> Compartilhar com Cliente
      </button>
      {open && (
        <div className="rp-share-pop" data-testid="share-panel">
          <div className="rp-share-h"><Link2 size={16} /> Portal do Cliente</div>
          {(!p || !p.active) ? (
            <>
              <p className="rp-muted">Gere um link seguro e exclusivo para esta empresa. O cliente verá apenas os dados dela (Painel, DRE, Balanço, Diagnóstico).</p>
              <button className="rp-btn rp-btn-primary" onClick={() => act("create")} disabled={busy} data-testid="btn-generate-link">
                {busy ? <Loader2 className="rp-spin" size={16} /> : <Link2 size={16} />} Gerar link
              </button>
            </>
          ) : (
            <>
              <div className="rp-share-url" data-testid="portal-url">{fullUrl}</div>
              <div className="rp-share-btns">
                <button className="rp-btn rp-btn-primary sm" onClick={copy} data-testid="btn-copy-link">
                  {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copiado!" : "Copiar link"}
                </button>
                <a className="rp-btn rp-btn-ghost sm" href={fullUrl} target="_blank" rel="noreferrer" data-testid="btn-open-link"><ExternalLink size={14} /> Abrir</a>
                <button className="rp-btn rp-btn-ghost sm" onClick={() => act("regenerate")} disabled={busy} data-testid="btn-regenerate-link"><RefreshCw size={14} /> Novo link</button>
                <button className="rp-btn rp-btn-ghost sm rp-danger" onClick={() => act("revoke")} disabled={busy} data-testid="btn-revoke-link"><Ban size={14} /> Revogar</button>
              </div>
              <div className="rp-share-meta">
                <div><span>Status</span><b style={{ color: "#2E7D32" }}>Ativo</b></div>
                <div><span>Criado em</span><b>{fmt(p.created_at)}</b></div>
                <div><span>Último acesso</span><b>{fmt(p.last_access_at)}</b></div>
                <div><span>Acessos</span><b>{p.access_count ?? 0}</b></div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

