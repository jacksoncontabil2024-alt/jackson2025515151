import { Navigate } from "react-router-dom";
import { useAuth } from "@/reports/AuthContext";
import { Loader2 } from "lucide-react";

export default function Protected({ children }) {
  const { user } = useAuth();
  if (user === undefined)
    return <div className="lg-shell"><Loader2 className="rp-spin" size={30} color="#04B7AF" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
