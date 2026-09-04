import "@/App.css";
import "@/reports/reports.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/reports/AuthContext";
import Protected from "@/reports/Protected";
import Login from "@/reports/Login";
import Layout from "@/reports/Layout";
import Dashboard from "@/reports/Dashboard";
import Clientes from "@/reports/Clientes";
import NovaAnalise from "@/reports/NovaAnalise";
import Analise from "@/reports/Analise";
import Comparativos from "@/reports/Comparativos";
import Configuracoes from "@/reports/Configuracoes";
import DeckViewer from "@/reports/DeckViewer";
import Portal from "@/reports/Portal";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/apresentacao-dre" element={<DeckViewer />} />
          <Route path="/portal/:token" element={<Portal />} />
          <Route path="/" element={<Protected><Layout /></Protected>}>
            <Route index element={<Dashboard />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="clientes/:id" element={<Clientes />} />
            <Route path="nova-analise" element={<NovaAnalise />} />
            <Route path="analise/:id" element={<Analise />} />
            <Route path="comparativos" element={<Comparativos />} />
            <Route path="configuracoes" element={<Configuracoes />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
