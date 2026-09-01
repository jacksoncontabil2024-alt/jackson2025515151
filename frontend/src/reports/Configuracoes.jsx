import { useState, useEffect } from "react";
import { FELCONT_LOGO } from "@/reports/api";
import { Save } from "lucide-react";

const swatches = [
  ["Índigo (primária escura)", "#322F6A"],
  ["Turquesa (destaque)", "#04B7AF"],
  ["Âmbar (atenção)", "#E8A13A"],
  ["Verde (positivo)", "#57B14A"],
  ["Vermelho (crítico)", "#D6453F"],
];

export default function Configuracoes() {
  const [cfg, setCfg] = useState({ phone: "", email: "", site: "", footer: "" });
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const s = localStorage.getItem("felcont_cfg");
    if (s) setCfg(JSON.parse(s));
  }, []);
  const save = () => { localStorage.setItem("felcont_cfg", JSON.stringify(cfg)); setSaved(true); setTimeout(() => setSaved(false), 1500); };

  return (
    <div data-testid="config-page">
      <div className="rp-head"><div><h1>Configurações · Identidade Visual</h1><p>Padrão FELCONT aplicado aos relatórios</p></div></div>

      <div className="rp-grid2">
        <div className="rp-card">
          <div className="rp-card-h"><h3>Logotipo</h3></div>
          <div className="rp-logo-preview"><img src={FELCONT_LOGO} alt="FELCONT" /></div>
          <p className="rp-muted">Logo para fundo escuro (padrão dos relatórios). Envio de novo logo pode ser habilitado futuramente sem alterar o código.</p>
        </div>

        <div className="rp-card">
          <div className="rp-card-h"><h3>Paleta de cores</h3></div>
          {swatches.map(([lab, hex]) => (
            <div className="rp-swatch" key={hex} data-testid={`swatch-${hex}`}>
              <span className="rp-swatch-c" style={{ background: hex }} />
              <b>{lab}</b><code>{hex}</code>
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
              <input data-testid={`cfg-${k}`} value={cfg[k]} onChange={(e) => setCfg({ ...cfg, [k]: e.target.value })} />
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
