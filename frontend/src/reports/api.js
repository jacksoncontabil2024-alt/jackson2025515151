import axios from "axios";

const BASE = `${process.env.REACT_APP_BACKEND_URL}/api/reports`;
export const api = axios.create({ baseURL: BASE });

export const brl = (n) =>
  n == null || isNaN(n)
    ? "—"
    : Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const statusLabel = {
  rascunho: "Rascunho",
  validacao: "Validação",
  revisao: "Em revisão",
  gerado: "Gerado",
};

export const FELCONT_LOGO =
  "https://customer-assets-eiarnc6j.emergentagent.net/job_dre-ronaldo-donadon/artifacts/gc2u16q4_image.png";
