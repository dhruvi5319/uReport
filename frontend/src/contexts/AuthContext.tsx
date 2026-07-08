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

// UAT_MOCK_USER: temporary mock for Phase 7 UAT (backend not running yet).
// Remove after Phase 9 auth is complete.
const UAT_MOCK_USER: User = {
  personId: 1,
  username: "uat_admin",
  role: "admin",
  firstname: "UAT",
  lastname: "Admin",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(UAT_MOCK_USER);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // UAT_MOCK_USER active — skip real auth check while backend is not running.
    // Restore to real API call once backend is available.
    if (UAT_MOCK_USER) return;
    api
      .get<User>("/auth/me")
      .then((res) => setUser(res.data))
      .catch((err) => {
        if (err.response?.status === 401) {
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
