import "@/App.css";
import "@/reports/reports.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/reports/Layout";
import Dashboard from "@/reports/Dashboard";
import Clientes from "@/reports/Clientes";
import NovaAnalise from "@/reports/NovaAnalise";
import Analise from "@/reports/Analise";
import Configuracoes from "@/reports/Configuracoes";
import DeckViewer from "@/reports/DeckViewer";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="clientes/:id" element={<Clientes />} />
          <Route path="nova-analise" element={<NovaAnalise />} />
          <Route path="analise/:id" element={<Analise />} />
          <Route path="configuracoes" element={<Configuracoes />} />
        </Route>
        <Route path="/apresentacao-dre" element={<DeckViewer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
