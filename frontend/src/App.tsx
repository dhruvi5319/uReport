import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
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

export default function App() {
  const location = useLocation();

  return (
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
  );
}
