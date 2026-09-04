import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, FilePlus2, Settings, Presentation, Sparkles, GitCompare, LogOut } from "lucide-react";
import { FELCONT_LOGO } from "@/reports/api";
import { useAuth } from "@/reports/AuthContext";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true, tid: "nav-dashboard" },
  { to: "/clientes", label: "Clientes", icon: Users, tid: "nav-clientes" },
  { to: "/nova-analise", label: "Nova Análise", icon: FilePlus2, tid: "nav-nova-analise" },
  { to: "/comparativos", label: "Comparativos", icon: GitCompare, tid: "nav-comparativos" },
  { to: "/configuracoes", label: "Configurações", icon: Settings, tid: "nav-config" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const doLogout = async () => { await logout(); nav("/login"); };
  return (
    <div className="rp-shell" data-testid="reports-shell">
      <aside className="rp-side">
        <div className="rp-brand">
          <img src={FELCONT_LOGO} alt="FELCONT" />
        </div>
        <div className="rp-side-tag">
          <Sparkles size={14} /> REPORTS <b>AI</b>
        </div>
        <nav className="rp-nav">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              data-testid={it.tid}
              className={({ isActive }) => "rp-nav-item" + (isActive ? " active" : "")}
            >
              <it.icon size={18} />
              <span>{it.label}</span>
            </NavLink>
          ))}
        </nav>
        <Link to="/apresentacao-dre" className="rp-side-link" data-testid="nav-apresentacao">
          <Presentation size={16} /> Apresentação DRE
        </Link>
        <button className="rp-side-link rp-logout" onClick={doLogout} data-testid="btn-logout">
          <LogOut size={16} /> Sair
        </button>
        <div className="rp-side-foot">
          {user?.name || "FELCONT"}<br />
          <span>{user?.email || "Contabilidade · Finanças · Auditoria"}</span>
        </div>
      </aside>
      <main className="rp-main">
        <Outlet />
      </main>
    </div>
  );
}
