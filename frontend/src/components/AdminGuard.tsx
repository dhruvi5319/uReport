import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * AdminGuard: protects admin routes (defense-in-depth; the backend enforces
 * ROLE_ADMIN independently via Spring Security).
 * - While auth is still loading: render nothing (avoids a redirect flash).
 * - If user is null (not logged in): redirect to /login
 * - If user role is not "admin" (e.g. "staff"/"public"): redirect to /dashboard
 * - Otherwise: render the admin page.
 *
 * AuthContext role is lowercase "admin" (matches /api/auth/me and the JWT claim).
 */
export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
