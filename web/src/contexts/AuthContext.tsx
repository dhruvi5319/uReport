import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '@/api/auth';
import { setTokens, clearTokens, getAccessToken, getRefreshToken } from '@/api/client';
import type { AuthUser } from '@/types/auth';

// Decode JWT claims without verification (verification is server-side)
function decodeToken(token: string): { sub: string; role: string } | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { sub: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore user from stored token on mount
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      const claims = decodeToken(token);
      if (claims) {
        setUser({ personId: Number(claims.sub), role: claims.role as AuthUser['role'] });
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const res = await authApi.login({ username, password });
    setTokens(res.accessToken, res.refreshToken);
    setUser({ personId: res.personId, role: res.role as AuthUser['role'] });
  };

  const logout = () => {
    const rt = getRefreshToken();
    if (rt) authApi.logout(rt).catch(() => {}); // best-effort
    clearTokens();
    setUser(null);
  };

  const refreshToken = async (): Promise<boolean> => {
    const rt = getRefreshToken();
    if (!rt) return false;
    try {
      const res = await authApi.refresh(rt);
      setTokens(res.accessToken, res.refreshToken);
      setUser({ personId: res.personId, role: res.role as AuthUser['role'] });
      return true;
    } catch {
      clearTokens();
      setUser(null);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
};
