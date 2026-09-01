import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/reports/api";
import { UploadCloud, FileText, X, Loader2, ArrowRight, FilePlus2 } from "lucide-react";

const field = (label, key, form, setForm, ph = "", required = false) => (
  <label className="rp-field">
    <span>{label}{required ? " *" : ""}</span>
    <input
      data-testid={`field-${key}`}
      value={form[key] || ""}
      placeholder={ph}
      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
    />
  </label>
);

export default function NovaAnalise() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({});
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const onPick = (e) => setFiles((prev) => [...prev, ...Array.from(e.target.files)]);
  const removeFile = (i) => setFiles((prev) => prev.filter((_, x) => x !== i));

  const goUpload = async () => {
    if (!form.client_name || !form.period_label) { setErr("Preencha nome da empresa e período."); return; }
    setErr(""); setStep(2);
  };

  const process = useCallback(async () => {
    if (files.length === 0) { setErr("Envie ao menos um documento."); return; }
    setErr(""); setBusy(true);
    try {
      const { data: a } = await api.post("/analyses", form);
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      await api.post(`/analyses/${a.id}/documents`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      nav(`/analise/${a.id}`);
    } catch (e) {
      setErr("Falha ao processar documentos. Verifique os arquivos e tente novamente.");
      setBusy(false);
    }
  }, [files, form, nav]);

  return (
    <div data-testid="nova-analise-page">
      <div className="rp-head"><div><h1>Nova Análise</h1><p>Cadastre o cliente e envie os documentos contábeis</p></div></div>

      <div className="rp-steps">
        <span className={"rp-step" + (step >= 1 ? " on" : "")}>1 · Dados</span>
        <span className={"rp-step" + (step >= 2 ? " on" : "")}>2 · Documentos</span>
      </div>

      {step === 1 && (
        <div className="rp-card" data-testid="step-dados">
          <div className="rp-form-grid">
            {field("Nome da empresa (fantasia)", "client_name", form, setForm, "Ex: ACE Catanduva", true)}
            {field("Razão social", "razao_social", form, setForm)}
            {field("CNPJ", "cnpj", form, setForm, "00.000.000/0000-00")}
            {field("Período analisado", "period_label", form, setForm, "Ex: Jan a Jul de 2026", true)}
            {field("Responsável", "responsavel", form, setForm, "Ex: FELCONT")}
            <label className="rp-field rp-field-full">
              <span>Observações</span>
              <textarea data-testid="field-observacoes" value={form.observacoes || ""}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={3} />
            </label>
          </div>
          {err && <p className="rp-err">{err}</p>}
          <div className="rp-actions">
            <button className="rp-btn rp-btn-primary" data-testid="btn-continuar" onClick={goUpload}>
              Continuar <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="rp-card" data-testid="step-upload">
          <label className="rp-drop" data-testid="dropzone">
            <UploadCloud size={34} />
            <b>Enviar documentos contábeis</b>
            <span>DRE, Balanço, Balancete, DFC, Folha… — PDF, XLSX, XLS ou CSV (vários de uma vez)</span>
            <input type="file" multiple accept=".pdf,.xlsx,.xls,.csv,.txt" onChange={onPick} data-testid="file-input" hidden />
          </label>

          {files.length > 0 && (
            <div className="rp-files" data-testid="file-list">
              {files.map((f, i) => (
                <div key={i} className="rp-file">
                  <FileText size={16} /> <span>{f.name}</span>
                  <button onClick={() => removeFile(i)} data-testid={`remove-file-${i}`}><X size={14} /></button>
                </div>
              ))}
            </div>
          )}

          {err && <p className="rp-err">{err}</p>}

          {busy ? (
            <div className="rp-processing" data-testid="processing">
              <Loader2 className="rp-spin" size={26} />
              <div><b>Interpretando documentos com IA…</b><span>Reconhecendo tipo, extraindo dados e validando. Pode levar alguns segundos.</span></div>
            </div>
          ) : (
            <div className="rp-actions">
              <button className="rp-btn rp-btn-ghost" onClick={() => setStep(1)}>Voltar</button>
              <button className="rp-btn rp-btn-primary" data-testid="btn-processar" onClick={process}>
                <FilePlus2 size={18} /> Processar documentos
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
