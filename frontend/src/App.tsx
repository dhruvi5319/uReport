import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { AnimationProvider } from "./components/AnimationProvider";
import AppShell from "./components/shell/AppShell";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import { CaseListPage } from "./pages/CaseListPage";
import { CaseDetailPage } from "./pages/CaseDetailPage";
import { PublicSubmitPage } from "./pages/PublicSubmitPage";
import { useAuth } from "./contexts/AuthContext";

// Admin pages
import { PeoplePage } from "./pages/admin/PeoplePage";
import { DepartmentsPage } from "./pages/admin/DepartmentsPage";
import { CategoriesPage } from "./pages/admin/CategoriesPage";
import { ClientsPage } from "./pages/admin/ClientsPage";
import { SubstatusPage } from "./pages/admin/SubstatusPage";
import { IssueTypesPage } from "./pages/admin/IssueTypesPage";
import { ContactMethodsPage } from "./pages/admin/ContactMethodsPage";
import { ActionsPage } from "./pages/admin/ActionsPage";

class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[AppErrorBoundary]", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: "monospace", background: "#fee2e2", minHeight: "100vh" }}>
          <h1 style={{ color: "#dc2626" }}>App Error</h1>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {this.state.error.message}{"\n\n"}{this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * AdminGuard: protects admin routes.
 * - If user is null (not logged in): redirect to /login
 * - If user role is not ROLE_ADMIN (using "admin" from AuthContext): redirect to /dashboard
 */
function AdminGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // AuthContext role is lowercase "admin" (from Phase 7 UAT_MOCK_USER)
  if (user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const location = useLocation();

  return (
    <AppErrorBoundary>
    <ThemeProvider>
      <AnimationProvider>
        <AuthProvider>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {/* Public routes — no auth guard */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/submit" element={<PublicSubmitPage />} />

              {/* Protected routes inside AppShell */}
              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/" element={<DashboardPage />} />
                <Route path="/cases" element={<CaseListPage />} />
                <Route path="/cases/:id" element={<CaseDetailPage />} />

                {/* Admin routes — ROLE_ADMIN only */}
                <Route
                  path="/admin/people"
                  element={
                    <AdminGuard>
                      <PeoplePage />
                    </AdminGuard>
                  }
                />
                <Route
                  path="/admin/departments"
                  element={
                    <AdminGuard>
                      <DepartmentsPage />
                    </AdminGuard>
                  }
                />
                <Route
                  path="/admin/categories"
                  element={
                    <AdminGuard>
                      <CategoriesPage />
                    </AdminGuard>
                  }
                />
                <Route
                  path="/admin/substatus"
                  element={
                    <AdminGuard>
                      <SubstatusPage />
                    </AdminGuard>
                  }
                />
                <Route
                  path="/admin/issue-types"
                  element={
                    <AdminGuard>
                      <IssueTypesPage />
                    </AdminGuard>
                  }
                />
                <Route
                  path="/admin/contact-methods"
                  element={
                    <AdminGuard>
                      <ContactMethodsPage />
                    </AdminGuard>
                  }
                />
                <Route
                  path="/admin/actions"
                  element={
                    <AdminGuard>
                      <ActionsPage />
                    </AdminGuard>
                  }
                />
                <Route
                  path="/admin/clients"
                  element={
                    <AdminGuard>
                      <ClientsPage />
                    </AdminGuard>
                  }
                />

                <Route path="*" element={<ComingSoonPage />} />
              </Route>
            </Routes>
          </AnimatePresence>
        </AuthProvider>
      </AnimationProvider>
    </ThemeProvider>
    </AppErrorBoundary>
  );
}
