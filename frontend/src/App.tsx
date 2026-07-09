import { Routes, Route, useLocation } from "react-router-dom";
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

export default function App() {
  const location = useLocation();

  return (
    <AppErrorBoundary>
    <ThemeProvider>
      <AnimationProvider>
        <AuthProvider>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/login" element={<LoginPage />} />
              {/* Public route — no auth guard */}
              <Route path="/submit" element={<PublicSubmitPage />} />
              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/" element={<DashboardPage />} />
                <Route path="/cases" element={<CaseListPage />} />
                <Route path="/cases/:id" element={<CaseDetailPage />} />
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
