import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, statusLabel } from "@/reports/api";
import { Users, FileBarChart, Clock, AlertTriangle, FilePlus2, ArrowRight } from "lucide-react";

const StatCard = ({ icon: Icon, label, value, accent, tid }) => (
  <div className={"rp-stat rp-acc-" + accent} data-testid={tid}>
    <div className="rp-stat-ic"><Icon size={22} /></div>
    <div>
      <div className="rp-stat-val">{value}</div>
      <div className="rp-stat-lab">{label}</div>
    </div>
  </div>
);

const badge = (s) => <span className={"rp-badge rp-badge-" + s}>{statusLabel[s] || s}</span>;

export default function Dashboard() {
  const [d, setD] = useState(null);
  const nav = useNavigate();
  useEffect(() => { api.get("/dashboard").then((r) => setD(r.data)).catch(() => {}); }, []);

  return (
    <div data-testid="dashboard-page">
      <div className="rp-head">
        <div>
          <h1>Dashboard</h1>
          <p>Visão geral do FELCONT Reports AI</p>
        </div>
        <button className="rp-btn rp-btn-primary" data-testid="btn-nova-analise" onClick={() => nav("/nova-analise")}>
          <FilePlus2 size={18} /> Nova Análise
        </button>
      </div>

      <div className="rp-stats">
        <StatCard icon={Users} label="Clientes" value={d?.clients ?? "—"} accent="teal" tid="stat-clients" />
        <StatCard icon={FileBarChart} label="Análises" value={d?.analyses ?? "—"} accent="indigo" tid="stat-analyses" />
        <StatCard icon={Clock} label="Pendentes" value={d?.pending ?? "—"} accent="amber" tid="stat-pending" />
        <StatCard icon={AlertTriangle} label="Com inconsistência" value={d?.inconsistencies ?? "—"} accent="red" tid="stat-inconsist" />
      </div>

      <div className="rp-grid2">
        <div className="rp-card" data-testid="recent-analyses">
          <div className="rp-card-h"><h3>Relatórios recentes</h3></div>
          {(d?.recent_analyses || []).length === 0 && <p className="rp-empty">Nenhuma análise ainda.</p>}
          {(d?.recent_analyses || []).map((a) => (
            <Link key={a.id} to={`/analise/${a.id}`} className="rp-row" data-testid={`recent-analysis-${a.id}`}>
              <div>
                <b>{a.client_name}</b>
                <span className="rp-muted">{a.period_label}</span>
              </div>
              <div className="rp-row-r">{badge(a.status)}<ArrowRight size={16} /></div>
            </Link>
          ))}
        </div>

        <div className="rp-card" data-testid="recent-clients">
          <div className="rp-card-h"><h3>Clientes recentes</h3></div>
          {(d?.recent_clients || []).length === 0 && <p className="rp-empty">Nenhum cliente ainda.</p>}
          {(d?.recent_clients || []).map((c) => (
            <Link key={c.id} to={`/clientes/${c.id}`} className="rp-row" data-testid={`recent-client-${c.id}`}>
              <div>
                <b>{c.name}</b>
                <span className="rp-muted">{c.cnpj || "—"}</span>
              </div>
              <ArrowRight size={16} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
