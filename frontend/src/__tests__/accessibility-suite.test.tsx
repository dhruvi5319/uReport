/**
 * Comprehensive accessibility suite — axe-core scans across all major screens.
 *
 * Covers: LoginPage, CaseListPage, PeoplePage, DepartmentsPage, CategoriesPage.
 * Asserts 0 critical/serious axe violations per WCAG 2.0 AA.
 *
 * NOTE: These are unit-level render tests with mocked API calls via MSW.
 * E2E tests are deferred to the verify phase.
 *
 * Plan: 09-03 — ADMIN-01, AUTH-03, SEARCH-02
 */
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";

expect.extend(toHaveNoViolations);

// MSW server for API mocking
import { server } from "./setup/server";
import { http, HttpResponse } from "msw";

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ─── Shared mock data ─────────────────────────────────────────────────────────

const mockPeople = [
  {
    id: 1,
    firstName: "Jane",
    lastName: "Doe",
    departmentId: 1,
    departmentName: "Public Works",
    role: "STAFF",
    username: "jdoe",
    emailCount: 2,
  },
  {
    id: 2,
    firstName: "John",
    lastName: "Admin",
    role: "ADMIN",
    username: "jadmin",
    emailCount: 1,
  },
];

const mockDepartments = [
  { id: 1, name: "Public Works", categoryCount: 5, actionCount: 3 },
  { id: 2, name: "Utilities", categoryCount: 2, actionCount: 1 },
];

const mockCategories = [
  {
    id: 1,
    name: "Pothole",
    categoryGroupId: 1,
    categoryGroupName: "Infrastructure",
    departmentId: 1,
    departmentName: "Public Works",
    active: true,
    postingPermission: "PUBLIC",
    slaDays: 5,
    autoClose: false,
  },
];

const mockCategoryGroups = [
  { id: 1, name: "Infrastructure" },
  { id: 2, name: "Environment" },
];

const mockTickets = {
  content: [
    {
      id: 1,
      ticketId: "2024-001",
      categoryName: "Pothole",
      categoryId: 1,
      departmentName: "Public Works",
      departmentId: 1,
      status: "open",
      reporterName: "Jane Doe",
      enteredDate: new Date().toISOString(),
    },
  ],
  totalElements: 1,
  page: 0,
  size: 20,
};

// ─── Test wrapper helpers ─────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
}

/** Wrapper with MemoryRouter, QueryClient, and basic route scaffolding */
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter initialEntries={["/"]}>
      <QueryClientProvider client={makeQueryClient()}>
        {children}
      </QueryClientProvider>
    </MemoryRouter>
  );
}

/** Wrapper for LoginPage — needs /login route and /dashboard redirect target */
function LoginTestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter initialEntries={["/login"]}>
      <QueryClientProvider client={makeQueryClient()}>
        <Routes>
          <Route path="/login" element={children} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

// ─── axe helper: filter to critical/serious only ─────────────────────────────

const axeOptions = {
  runOnly: {
    type: "tag" as const,
    values: ["wcag2a", "wcag2aa"],
  },
};

function filterCriticalAndSerious(results: Awaited<ReturnType<typeof axe>>) {
  return {
    ...results,
    violations: results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    ),
  };
}

// ─── Accessibility suite ──────────────────────────────────────────────────────

describe("Accessibility suite — 0 critical/serious violations", () => {

  // AUTH-03: Login screen accessibility verified
  it("LoginPage", async () => {
    // Mock AuthContext so LoginPage renders (not redirect to /dashboard)
    vi.mock("@/contexts/AuthContext", () => ({
      useAuth: () => ({ user: null, loading: false, logout: vi.fn() }),
    }));

    const { default: LoginPage } = await import("@/pages/LoginPage");

    const { container } = render(
      <LoginTestWrapper>
        <LoginPage />
      </LoginTestWrapper>
    );

    await new Promise((r) => setTimeout(r, 100));

    const results = await axe(container, axeOptions);
    expect(filterCriticalAndSerious(results)).toHaveNoViolations();
  });

  // SEARCH-02: CaseListPage accessibility verified
  it("CaseListPage", async () => {
    server.use(
      http.get("/api/tickets", () => HttpResponse.json(mockTickets)),
      http.get("/api/bookmarks", () => HttpResponse.json([])),
      http.get("/api/departments", () => HttpResponse.json(mockDepartments)),
      http.get("/api/categories", () => HttpResponse.json(mockCategories))
    );

    const { CaseListPage } = await import("@/pages/CaseListPage");

    const { container } = render(
      <TestWrapper>
        <CaseListPage />
      </TestWrapper>
    );

    await new Promise((r) => setTimeout(r, 150));

    const results = await axe(container, axeOptions);
    expect(filterCriticalAndSerious(results)).toHaveNoViolations();
  });

  // ADMIN-01: Admin panel pages accessibility verified

  it("PeoplePage (admin)", async () => {
    server.use(
      http.get("/api/people", () => HttpResponse.json(mockPeople)),
      http.get("/api/departments", () => HttpResponse.json(mockDepartments))
    );

    const { PeoplePage } = await import("@/pages/admin/PeoplePage");

    const { container } = render(
      <TestWrapper>
        <PeoplePage />
      </TestWrapper>
    );

    await new Promise((r) => setTimeout(r, 100));

    const results = await axe(container, axeOptions);
    expect(filterCriticalAndSerious(results)).toHaveNoViolations();
  });

  it("DepartmentsPage (admin)", async () => {
    server.use(
      http.get("/api/departments", () => HttpResponse.json(mockDepartments)),
      http.get("/api/actions", () => HttpResponse.json([])),
      http.get("/api/people", () => HttpResponse.json(mockPeople))
    );

    const { DepartmentsPage } = await import("@/pages/admin/DepartmentsPage");

    const { container } = render(
      <TestWrapper>
        <DepartmentsPage />
      </TestWrapper>
    );

    await new Promise((r) => setTimeout(r, 100));

    const results = await axe(container, axeOptions);
    expect(filterCriticalAndSerious(results)).toHaveNoViolations();
  });

  it("CategoriesPage (admin)", async () => {
    server.use(
      http.get("/api/categories", () => HttpResponse.json(mockCategories)),
      http.get("/api/category-groups", () => HttpResponse.json(mockCategoryGroups)),
      http.get("/api/departments", () => HttpResponse.json(mockDepartments))
    );

    const { CategoriesPage } = await import("@/pages/admin/CategoriesPage");

    const { container } = render(
      <TestWrapper>
        <CategoriesPage />
      </TestWrapper>
    );

    await new Promise((r) => setTimeout(r, 100));

    const results = await axe(container, axeOptions);
    expect(filterCriticalAndSerious(results)).toHaveNoViolations();
  });
});
