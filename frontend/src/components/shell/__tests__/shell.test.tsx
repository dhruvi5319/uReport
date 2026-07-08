import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi, describe, test, expect, beforeEach } from "vitest";
import AppBreadcrumb from "../Breadcrumb";
import Sidebar from "../Sidebar";

// Mock AuthContext — admin role by default
vi.mock("../../../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { personId: 1, username: "admin", role: "admin", firstname: "Jane", lastname: "Doe" },
    loading: false,
    logout: vi.fn(),
  }),
}));

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: vi.fn(),
    resolvedTheme: "light",
  }),
}));

// ResizeObserver mock (required by Radix Sheet/Popover)
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Clear localStorage between tests
beforeEach(() => {
  localStorage.clear();
});

// ── Breadcrumb tests ──────────────────────────────────────────────────────────

describe("AppBreadcrumb", () => {
  function renderBreadcrumb(path: string) {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="*" element={<AppBreadcrumb />} />
        </Routes>
      </MemoryRouter>
    );
  }

  test("renders 'Dashboard' for /dashboard (single crumb)", () => {
    renderBreadcrumb("/dashboard");
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toHaveAttribute("aria-current", "page");
  });

  test("renders 'Admin > People' for /admin/people", () => {
    renderBreadcrumb("/admin/people");
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("People")).toBeInTheDocument();
    expect(screen.getByText("People")).toHaveAttribute("aria-current", "page");
    // Admin is a link, not aria-current
    expect(screen.getByText("Admin")).not.toHaveAttribute("aria-current", "page");
  });

  test("renders 'Cases > New Case' for /cases/new", () => {
    renderBreadcrumb("/cases/new");
    expect(screen.getByText("Cases")).toBeInTheDocument();
    expect(screen.getByText("New Case")).toBeInTheDocument();
    expect(screen.getByText("New Case")).toHaveAttribute("aria-current", "page");
  });

  test("renders dynamic case crumb for /cases/123", () => {
    renderBreadcrumb("/cases/123");
    expect(screen.getByText("Cases")).toBeInTheDocument();
    expect(screen.getByText("Case #123")).toBeInTheDocument();
  });

  test("renders 'Reports > Metrics' for /metrics", () => {
    renderBreadcrumb("/metrics");
    expect(screen.getByText("Reports")).toBeInTheDocument();
    expect(screen.getByText("Metrics")).toBeInTheDocument();
  });
});

// ── Sidebar tests ─────────────────────────────────────────────────────────────

describe("Sidebar — role-based nav filtering", () => {
  test("admin user sees Admin group nav items", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    expect(screen.getByText("People")).toBeInTheDocument();
    expect(screen.getByText("Departments")).toBeInTheDocument();
  });

  test("sidebar collapse toggle changes aria-label", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    const toggle = screen.getByRole("button", { name: /collapse sidebar/i });
    expect(toggle).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: /expand sidebar/i })).toBeInTheDocument();
  });

  test("sidebar persists collapsed state to localStorage", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    const toggle = screen.getByRole("button", { name: /collapse sidebar/i });
    fireEvent.click(toggle);
    expect(localStorage.getItem("sidebar-collapsed")).toBe("true");
  });
});
