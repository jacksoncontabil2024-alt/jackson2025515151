import axios from "axios";

const BACKEND = process.env.REACT_APP_BACKEND_URL;
export const api = axios.create({ baseURL: `${BACKEND}/api/reports`, withCredentials: true });
export const adminApi = axios.create({ baseURL: `${BACKEND}/api/admin`, withCredentials: true });

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
