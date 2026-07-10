/**
 * Accessibility test for admin panels using jest-axe (axe-core).
 * Tests PeoplePage, DepartmentsPage, and CategoriesPage for 0 critical/serious violations.
 *
 * NOTE: These are unit-level render tests with mocked API calls.
 * E2E tests are deferred to the verify phase.
 */
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { Toaster } from "@/components/ui/toaster";

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

const mockCategories: unknown[] = [
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

// ─── Test wrapper helper ───────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false },
    },
  });
}

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <QueryClientProvider client={makeQueryClient()}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

// ─── PeoplePage ───────────────────────────────────────────────────────────────

describe("Admin panel accessibility", () => {
  it("PeoplePage has no critical/serious axe violations", async () => {
    server.use(
      http.get("/api/people", () => HttpResponse.json(mockPeople)),
      http.get("/api/departments", () => HttpResponse.json(mockDepartments))
    );

    // Dynamic import to avoid issues with mocks
    const { PeoplePage } = await import("@/pages/admin/PeoplePage");

    const { container } = render(
      <TestWrapper>
        <PeoplePage />
      </TestWrapper>
    );

    // Wait for any pending state updates
    await new Promise((r) => setTimeout(r, 100));

    const results = await axe(container, {
      // Only check for critical and serious violations
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa"],
      },
    });

    expect(results).toHaveNoViolations();
  });

  it("DepartmentsPage has no critical/serious axe violations", async () => {
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

    const results = await axe(container, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa"],
      },
    });

    expect(results).toHaveNoViolations();
  });

  it("CategoriesPage has no critical/serious axe violations", async () => {
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

    const results = await axe(container, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa"],
      },
    });

    expect(results).toHaveNoViolations();
  });
});
