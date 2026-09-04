import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { adminApi } from "@/reports/api";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined=checando, null=deslogado, obj=logado

  const check = useCallback(async () => {
    try {
      const { data } = await adminApi.get("/me");
      setUser(data);
    } catch {
      setUser(null);
    }
  }, []);
  useEffect(() => { check(); }, [check]);

  const login = async (identifier, password) => {
    const { data } = await adminApi.post("/login", { identifier, password });
    setUser(data);
    return data;
  };
  const logout = async () => {
    try { await adminApi.post("/logout"); } catch {}
    setUser(null);
  };

  return <AuthCtx.Provider value={{ user, login, logout, check }}>{children}</AuthCtx.Provider>;
}
