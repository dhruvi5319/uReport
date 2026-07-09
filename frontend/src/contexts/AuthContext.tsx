import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

export interface User {
  personId: number;
  username: string;
  role: "staff" | "admin";
  firstname: string;
  lastname: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);  // null by default — no mock
  const [loading, setLoading] = useState(true);         // true so AppShell can show skeleton
  const navigate = useNavigate();

  useEffect(() => {
    // Real auth check: GET /api/auth/me returns 200+body if JWT cookie is valid, 401 otherwise
    api
      .get<User>("/auth/me")
      .then((res) => setUser(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
          // No valid session — redirect to login
          navigate("/login", { replace: true });
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  async function logout() {
    await api.post("/auth/logout").catch(() => {});
    setUser(null);
    navigate("/login", { replace: true });
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
