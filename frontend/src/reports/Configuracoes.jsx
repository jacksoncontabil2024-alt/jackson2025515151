import { useState, useEffect, useRef } from "react";
import { api } from "@/reports/api";
import { Save, UploadCloud } from "lucide-react";

const COLORS = [
  ["cor_primaria", "Cor primária (fundo escuro)"],
  ["cor_secundaria", "Cor secundária"],
  ["cor_destaque", "Cor de destaque"],
];

export default function Configuracoes() {
  const [cfg, setCfg] = useState({ cor_primaria: "#322F6A", cor_secundaria: "#3E3A82", cor_destaque: "#04B7AF" });
  const [saved, setSaved] = useState(false);
  const [logoV, setLogoV] = useState(0);
  const fileRef = useRef();
  const BACKEND = process.env.REACT_APP_BACKEND_URL;

  const load = () => api.get("/config").then((r) => setCfg((c) => ({ ...c, ...r.data }))).catch(() => {});
  useEffect(() => { load(); }, []);

  const save = async () => {
    await api.put("/config", {
      cor_primaria: cfg.cor_primaria, cor_secundaria: cfg.cor_secundaria, cor_destaque: cfg.cor_destaque,
      phone: cfg.phone, email: cfg.email, site: cfg.site,
    });
    setSaved(true); setTimeout(() => setSaved(false), 1500);
  };

  const onLogo = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const fd = new FormData(); fd.append("file", f);
    await api.post("/config/logo", fd, { headers: { "Content-Type": "multipart/form-data" } });
    setCfg((c) => ({ ...c, has_logo: true })); setLogoV((v) => v + 1);
  };

  const logoSrc = cfg.has_logo
    ? `${BACKEND}/api/reports/config/logo?v=${logoV}`
    : "https://customer-assets-eiarnc6j.emergentagent.net/job_dre-ronaldo-donadon/artifacts/gc2u16q4_image.png";

  return (
    <div data-testid="config-page">
      <div className="rp-head"><div><h1>Configurações · Identidade Visual</h1><p>Padrão aplicado a todos os relatórios gerados</p></div></div>

      <div className="rp-grid2">
        <div className="rp-card">
          <div className="rp-card-h"><h3>Logotipo</h3></div>
          <div className="rp-logo-preview" style={{ background: cfg.cor_primaria }}><img src={logoSrc} alt="logo" /></div>
          <input type="file" accept="image/*" hidden ref={fileRef} onChange={onLogo} data-testid="logo-input" />
          <div className="rp-actions" style={{ justifyContent: "flex-start" }}>
            <button className="rp-btn rp-btn-ghost" onClick={() => fileRef.current?.click()} data-testid="logo-upload-btn">
              <UploadCloud size={16} /> {cfg.has_logo ? "Trocar logo" : "Enviar logo"}
            </button>
          </div>
          <p className="rp-muted">O logo é usado nas capas e no encerramento dos relatórios (fundo escuro). PNG/SVG até 3MB.</p>
        </div>

        <div className="rp-card">
          <div className="rp-card-h"><h3>Paleta de cores</h3></div>
          {COLORS.map(([k, lab]) => (
            <div className="rp-swatch" key={k} data-testid={`color-${k}`}>
              <input type="color" className="rp-color" value={cfg[k] || "#000000"}
                onChange={(e) => setCfg({ ...cfg, [k]: e.target.value })} data-testid={`color-input-${k}`} />
              <b>{lab}</b><code>{cfg[k]}</code>
            </div>
          ))}
        </div>
      </div>

      <div className="rp-card">
        <div className="rp-card-h"><h3>Rodapé dos relatórios</h3></div>
        <div className="rp-form-grid">
          {["phone", "email", "site"].map((k) => (
            <label className="rp-field" key={k}>
              <span>{k === "phone" ? "Telefone" : k === "email" ? "E-mail" : "Site"}</span>
              <input data-testid={`cfg-${k}`} value={cfg[k] || ""} onChange={(e) => setCfg({ ...cfg, [k]: e.target.value })} />
            </label>
          ))}
        </div>
        <div className="rp-actions">
          <button className="rp-btn rp-btn-primary" onClick={save} data-testid="cfg-save"><Save size={16} /> {saved ? "Salvo!" : "Salvar"}</button>
        </div>
      </div>
    </div>
  );
}
