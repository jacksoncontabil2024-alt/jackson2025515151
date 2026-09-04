import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { api, statusLabel } from "@/reports/api";
import { Users, ArrowLeft, FilePlus2, Building2, Trash2 } from "lucide-react";

const badge = (s) => <span className={"rp-badge rp-badge-" + s}>{statusLabel[s] || s}</span>;

export default function Clientes() {
  const { id } = useParams();
  return id ? <ClienteDetail id={id} /> : <ClientesList />;
}

function ClientesList() {
  const [list, setList] = useState([]);
  const nav = useNavigate();
  const load = () => api.get("/clients").then((r) => setList(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);
  const del = async (e, c) => {
    e.preventDefault(); e.stopPropagation();
    if (!window.confirm(`Excluir o cliente "${c.name}" e todas as suas análises? Esta ação não pode ser desfeita.`)) return;
    await api.delete(`/clients/${c.id}`);
    load();
  };
  return (
    <div data-testid="clientes-page">
      <div className="rp-head">
        <div><h1>Clientes</h1><p>Histórico de clientes e análises</p></div>
        <button className="rp-btn rp-btn-primary" onClick={() => nav("/nova-analise")}><FilePlus2 size={18} /> Nova Análise</button>
      </div>
      <div className="rp-card">
        {list.length === 0 && <p className="rp-empty">Nenhum cliente cadastrado. Comece por “Nova Análise”.</p>}
        {list.map((c) => (
          <Link key={c.id} to={`/clientes/${c.id}`} className="rp-row" data-testid={`client-${c.id}`}>
            <div className="rp-row-l"><span className="rp-avatar"><Building2 size={18} /></span>
              <div><b>{c.name}</b><span className="rp-muted">{c.cnpj || "—"}</span></div>
            </div>
            <div className="rp-row-r">
              <span className="rp-pill">{c.analyses_count} análise(s)</span>
              <button className="rp-icon-btn rp-danger" onClick={(e) => del(e, c)} data-testid={`delete-client-${c.id}`} title="Excluir cliente">
                <Trash2 size={16} />
              </button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ClienteDetail({ id }) {
  const [c, setC] = useState(null);
  useEffect(() => { api.get(`/clients/${id}`).then((r) => setC(r.data)).catch(() => {}); }, [id]);
  if (!c) return <div className="rp-empty">Carregando…</div>;
  return (
    <div data-testid="cliente-detail">
      <Link to="/clientes" className="rp-back"><ArrowLeft size={16} /> Clientes</Link>
      <div className="rp-head"><div><h1>{c.name}</h1><p>{c.cnpj || "CNPJ não informado"} · {c.razao_social}</p></div></div>
      <div className="rp-card">
        <div className="rp-card-h"><h3>Análises</h3></div>
        {(c.analyses || []).length === 0 && <p className="rp-empty">Nenhuma análise para este cliente.</p>}
        {(c.analyses || []).map((a) => (
          <Link key={a.id} to={`/analise/${a.id}`} className="rp-row" data-testid={`client-analysis-${a.id}`}>
            <div><b>{a.period_label}</b><span className="rp-muted">{new Date(a.created_at).toLocaleDateString("pt-BR")}</span></div>
            {badge(a.status)}
          </Link>
        ))}
      </div>
    </div>
  );
}
