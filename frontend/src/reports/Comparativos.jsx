import { useEffect, useState } from "react";
import { api, brl } from "@/reports/api";
import { AlertTriangle, GitCompare } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";

const fmtVar = (v, unit) => {
  if (v == null) return "—";
  const s = v > 0 ? "+" : "";
  if (unit === "%") return `${s}${v.toFixed(2).replace(".", ",")} p.p.`;
  if (unit === "x") return `${s}${v.toFixed(2).replace(".", ",")}`;
  return s + brl(v);
};

export default function Comparativos() {
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("");
  const [analyses, setAnalyses] = useState([]);
  const [aId, setAId] = useState("");
  const [bId, setBId] = useState("");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => { api.get("/clients").then((r) => setClients(r.data)).catch(() => {}); }, []);
  useEffect(() => {
    if (!clientId) { setAnalyses([]); return; }
    api.get(`/clients/${clientId}`).then((r) => setAnalyses(r.data.analyses || [])).catch(() => {});
    setAId(""); setBId(""); setData(null);
  }, [clientId]);

  const run = async () => {
    if (!aId || !bId || aId === bId) { setErr("Selecione dois períodos diferentes."); return; }
    setErr("");
    const { data } = await api.get(`/compare`, { params: { a: aId, b: bId } });
    setData(data);
  };

  const chartData = (data?.rows || [])
    .filter((r) => r.unit === "R$" && (r.a_value != null || r.b_value != null))
    .slice(0, 6)
    .map((r) => ({ name: r.label, A: r.a_value || 0, B: r.b_value || 0 }));

  return (
    <div data-testid="comparativos-page">
      <div className="rp-head"><div><h1>Comparativos</h1><p>Compare períodos de um mesmo cliente</p></div></div>

      <div className="rp-card">
        <div className="rp-form-grid">
          <label className="rp-field"><span>Cliente</span>
            <select data-testid="cmp-client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">Selecione…</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="rp-field"><span>Período A</span>
            <select data-testid="cmp-a" value={aId} onChange={(e) => setAId(e.target.value)} disabled={!analyses.length}>
              <option value="">Selecione…</option>
              {analyses.map((a) => <option key={a.id} value={a.id}>{a.period_label}</option>)}
            </select>
          </label>
          <label className="rp-field"><span>Período B</span>
            <select data-testid="cmp-b" value={bId} onChange={(e) => setBId(e.target.value)} disabled={!analyses.length}>
              <option value="">Selecione…</option>
              {analyses.map((a) => <option key={a.id} value={a.id}>{a.period_label}</option>)}
            </select>
          </label>
        </div>
        {err && <p className="rp-err">{err}</p>}
        <div className="rp-actions">
          <button className="rp-btn rp-btn-primary" data-testid="cmp-run" onClick={run}><GitCompare size={16} /> Comparar</button>
        </div>
      </div>

      {data?.warning && (
        <div className="rp-vbanner warn" data-testid="cmp-warning">
          <AlertTriangle size={24} />
          <div><b>Atenção — períodos com durações diferentes</b><span>{data.warning}</span></div>
        </div>
      )}

      {data && (
        <>
          <div className="rp-card" data-testid="cmp-table">
            <div className="rp-card-h"><h3>Indicador · {data.a.period} vs {data.b.period}</h3></div>
            <table className="rp-table">
              <thead><tr><th>Indicador</th><th className="r">{data.a.period}</th><th className="r">{data.b.period}</th><th className="r">Variação</th></tr></thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.key}>
                    <td>{r.label}</td>
                    <td className="r">{r.a_display}</td>
                    <td className="r">{r.b_display}</td>
                    <td className="r" style={{ color: r.var_abs == null ? undefined : r.var_abs >= 0 ? "#2E7D32" : "#D6453F", fontWeight: 700 }}>
                      {fmtVar(r.var_abs, r.unit)}{r.var_pct != null ? ` (${r.var_pct > 0 ? "+" : ""}${r.var_pct.toFixed(1).replace(".", ",")}%)` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {chartData.length > 0 && (
            <div className="rp-card">
              <div className="rp-card-h"><h3>Comparativo (R$)</h3></div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={50} />
                  <YAxis tickFormatter={(v) => (v / 1000).toFixed(0) + "k"} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => brl(v)} />
                  <Legend />
                  <Bar dataKey="A" name={data.a.period} fill="#322F6A" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="B" name={data.b.period} fill="#04B7AF" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
