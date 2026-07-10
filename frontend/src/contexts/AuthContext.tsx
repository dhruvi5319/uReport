import { createContext, useCallback, useContext, useEffect, useState } from "react";
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
  refreshUser: () => Promise<User | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);  // null by default — no mock
  const [loading, setLoading] = useState(true);         // true so AppShell can show skeleton
  const navigate = useNavigate();

  // Fetch the current session from the server. The JWT lives in an httpOnly
  // cookie the SPA cannot read, so GET /api/auth/me is the only source of
  // truth for "who am I". The login flow calls this right after the cookie is
  // set so guarded routes (AppShell / AdminGuard) see the authenticated user
  // instead of the stale null captured at initial mount.
  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const res = await api.get<User>("/auth/me");
      setUser(res.data);
      return res.data;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    // Real auth check: GET /api/auth/me returns 200+body if JWT cookie is valid, 401 otherwise
    refreshUser()
      .then((u) => {
        if (!u) {
          // No valid session — redirect to login
          navigate("/login", { replace: true });
        }
      })
      .finally(() => setLoading(false));
  }, [refreshUser, navigate]);

  async function logout() {
    await api.post("/auth/logout").catch(() => {});
    setUser(null);
    navigate("/login", { replace: true });
  }

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
