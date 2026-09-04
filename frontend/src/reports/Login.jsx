import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/reports/AuthContext";
import { FELCONT_LOGO } from "@/reports/api";
import { Lock, Loader2, ShieldCheck } from "lucide-react";

export default function Login() {
  const { user, login } = useAuth();
  const [identifier, setId] = useState("");
  const [password, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      await login(identifier, password);
    } catch (ex) {
      const d = ex?.response?.data?.detail;
      setErr(typeof d === "string" ? d : "Não foi possível entrar. Verifique suas credenciais.");
      setBusy(false);
    }
  };

  return (
    <div className="lg-shell" data-testid="login-page">
      <div className="lg-card">
        <img src={FELCONT_LOGO} alt="FELCONT" className="lg-logo" />
        <div className="lg-tag"><ShieldCheck size={14} /> Reports AI · Acesso Administrativo</div>
        <h1>Entrar</h1>
        <form onSubmit={submit}>
          <label className="rp-field">
            <span>E-mail ou usuário</span>
            <input data-testid="login-identifier" value={identifier} onChange={(e) => setId(e.target.value)} autoFocus placeholder="admin" />
          </label>
          <label className="rp-field">
            <span>Senha</span>
            <input data-testid="login-password" type="password" value={password} onChange={(e) => setPw(e.target.value)} placeholder="••••••" />
          </label>
          {err && <p className="rp-err" data-testid="login-error">{err}</p>}
          <button className="rp-btn rp-btn-primary lg-btn" type="submit" disabled={busy} data-testid="login-submit">
            {busy ? <Loader2 className="rp-spin" size={18} /> : <Lock size={18} />} Entrar
          </button>
        </form>
        <p className="lg-note">Acesso exclusivo à equipe autorizada da Felcont.</p>
      </div>
    </div>
  );
}
