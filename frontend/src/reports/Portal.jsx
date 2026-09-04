import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { FELCONT_LOGO } from "@/reports/api";
import { Painel, DRE, Balanco, Folha, DiagnosticoView } from "@/reports/Analise";
import { Loader2, ShieldAlert, Clock } from "lucide-react";

const PORTAL = `${process.env.REACT_APP_BACKEND_URL}/api/portal`;
const BASE_TABS = [["painel", "Painel"], ["dre", "DRE"], ["balanco", "Balanço"], ["folha", "Folha"], ["diagnostico", "Diagnóstico"]];

export default function Portal() {
  const { token } = useParams();
  const [session, setSession] = useState(null);
  const [err, setErr] = useState("");
  const [analysisId, setAnalysisId] = useState("");
  const [a, setA] = useState(null);
  const [tab, setTab] = useState("painel");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${PORTAL}/${token}`)
      .then((r) => { setSession(r.data); setAnalysisId(r.data.default_analysis_id || ""); })
      .catch((e) => setErr(e?.response?.data?.detail || "Link inválido ou revogado."))
      .finally(() => setLoading(false));
  }, [token]);

  const loadAnalysis = useCallback(() => {
    if (!analysisId) return;
    axios.get(`${PORTAL}/${token}/analysis/${analysisId}`)
      .then((r) => setA(r.data))
      .catch((e) => setErr(e?.response?.data?.detail || "Acesso não autorizado."));
  }, [token, analysisId]);
  useEffect(() => { loadAnalysis(); }, [loadAnalysis]);

  if (loading) return <div className="pt-load"><Loader2 className="rp-spin" size={30} /> Carregando…</div>;
  if (err) return (
    <div className="pt-err" data-testid="portal-error">
      <ShieldAlert size={40} /><h2>Não foi possível abrir o portal</h2><p>{err}</p>
    </div>
  );

  const company = session?.company || {};
  const fmt = (s) => s ? new Date(s).toLocaleString("pt-BR") : "—";
  const tabs = BASE_TABS.filter(([k]) => k !== "folha" || (a && a.financials && a.financials.folha));

  return (
    <div className="pt-shell" data-testid="portal-page">
      <header className="pt-header">
        <div className="pt-header-in">
          <div className="pt-brand">
            <img src={FELCONT_LOGO} alt="FELCONT" />
            <span>Portal do Cliente</span>
          </div>
          <div className="pt-company">
            <h1 data-testid="portal-company">{company.name || "Empresa"}</h1>
            <div className="pt-sub">
              <span>{a?.period_label || ""}</span>
              <span className="pt-upd"><Clock size={13} /> Última atualização: {fmt(session?.last_update)}</span>
            </div>
          </div>
          {session?.periods?.length > 1 && (
            <select className="pt-period" data-testid="portal-period" value={analysisId}
              onChange={(e) => setAnalysisId(e.target.value)}>
              {session.periods.map((p) => <option key={p.id} value={p.id}>{p.period_label}</option>)}
            </select>
          )}
        </div>
      </header>

      <div className="pt-body">
        <div className="rp-tabs pt-tabs" data-testid="portal-tabs">
          {tabs.map(([k, l]) => (
            <button key={k} className={"rp-tab" + (tab === k ? " on" : "")} data-testid={`ptab-${k}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        {!a ? <div className="rp-empty">Carregando dados da empresa…</div> : (
          <>
            {tab === "painel" && <Painel a={a} />}
            {tab === "dre" && <DRE a={a} />}
            {tab === "balanco" && <Balanco a={a} />}
            {tab === "folha" && <Folha a={a} />}
            {tab === "diagnostico" && <DiagnosticoView diag={a.diagnosis} />}
          </>
        )}
      </div>

      <footer className="pt-foot">
        FELCONT — Contabilidade, Finanças e Auditoria · Portal exclusivo de {company.name}
      </footer>
    </div>
  );
}
