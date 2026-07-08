import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi, describe, test, expect, beforeAll } from "vitest";
import AppShell from "../AppShell";

// Extend expect with axe matchers
expect.extend(toHaveNoViolations);

// Mock AuthContext — admin role (sees all nav items)
vi.mock("../../../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: {
      personId: 1,
      username: "jdoe",
      role: "admin",
      firstname: "Jane",
      lastname: "Doe",
    },
    loading: false,
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock ThemeContext
vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: vi.fn(),
    resolvedTheme: "light",
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock AnimationProvider (no Framer Motion in tests)
vi.mock("../../AnimationProvider", () => ({
  AnimationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAnimationConfig: () => ({ reducedMotion: false, duration: (b: number) => b }),
}));

beforeAll(() => {
  const store: Record<string, string> = {};
  global.localStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => Object.keys(store).forEach((k) => delete store[k]),
    length: 0,
    key: () => null,
  };

  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((q: string) => ({
      matches: false,
      media: q,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

function renderShell() {
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route
            path="/dashboard"
            element={<main><h1>Dashboard</h1></main>}
          />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

// ── Axe scan ─────────────────────────────────────────────────────────────────

describe("AppShell — axe WCAG 2.1 AA scan", () => {
  test("full shell has 0 critical and 0 serious axe violations (admin user)", async () => {
    const { container } = renderShell();
    const results = await axe(container, {
      rules: {
        // CSS custom properties not resolved in jsdom — skip color-contrast
        "color-contrast": { enabled: false },
      },
    });
    const criticalOrSerious = (results.violations ?? []).filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(criticalOrSerious).toHaveLength(0);
  });

  test("shell passes axe with .dark class applied to wrapper (dark mode)", async () => {
    const { container } = render(
      <div className="dark">
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<main><h1>Dashboard</h1></main>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </div>
    );
    const results = await axe(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    const criticalOrSerious = (results.violations ?? []).filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    expect(criticalOrSerious).toHaveLength(0);
  });
});

// ── Skip link ─────────────────────────────────────────────────────────────────

describe("AppShell — skip-to-main link", () => {
  test("skip link is present in the DOM", () => {
    renderShell();
    // The skip link is sr-only so not visible, but it's in the DOM
    const skipLink = document.querySelector('a[href="#main-content"]');
    expect(skipLink).toBeTruthy();
    expect(skipLink?.textContent).toContain("Skip to main content");
  });

  test("skip link is the first anchor/button element in the DOM tree", () => {
    const { container } = renderShell();
    const focusables = container.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    // First focusable must be the skip link
    expect(focusables[0]?.getAttribute("href")).toBe("#main-content");
  });

  test("main content has id='main-content'", () => {
    renderShell();
    const main = document.getElementById("main-content");
    expect(main).toBeTruthy();
  });
});

// ── Icon buttons — aria-label ─────────────────────────────────────────────────

describe("AppShell — all icon-only buttons have aria-label", () => {
  test("every <button> with only an SVG child has a non-empty aria-label", () => {
    const { container } = renderShell();
    const buttons = container.querySelectorAll("button");
    const iconOnlyButtons = Array.from(buttons).filter((btn) => {
      const text = btn.textContent?.trim() ?? "";
      const hasSvg = btn.querySelector("svg") !== null;
      // Icon-only = has SVG and no meaningful visible text (text is empty or whitespace)
      return hasSvg && text.length === 0;
    });
    for (const btn of iconOnlyButtons) {
      expect(btn.getAttribute("aria-label")).toBeTruthy();
    }
  });

  test("collapse sidebar button has aria-label", () => {
    renderShell();
    // The sidebar collapse toggle is a button with aria-label
    const collapseBtn = screen.queryByRole("button", { name: /collapse sidebar|expand sidebar/i });
    expect(collapseBtn).toBeTruthy();
  });

  test("dark mode toggle button has aria-label describing the action", () => {
    renderShell();
    // The theme toggle button should have aria-label
    const themeBtn = screen.queryByRole("button", { name: /mode|theme/i });
    expect(themeBtn).toBeTruthy();
  });

  test("hamburger menu button has aria-label 'Open navigation menu'", () => {
    renderShell();
    const hamburger = screen.queryByRole("button", { name: /open navigation menu/i });
    // Note: hamburger is hidden on desktop (md:hidden class) but still in DOM
    expect(hamburger).toBeTruthy();
  });
});

// ── Keyboard navigation ────────────────────────────────────────────────────────

describe("AppShell — keyboard navigation", () => {
  test("skip link is focusable with Tab key", async () => {
    const user = userEvent.setup();
    renderShell();

    // Focus the document body first
    document.body.focus();

    // First Tab should focus the skip link
    await user.tab();
    const focused = document.activeElement;
    expect(focused?.getAttribute("href")).toBe("#main-content");
  });

  test("sidebar nav links are keyboard reachable", async () => {
    const user = userEvent.setup();
    renderShell();
    document.body.focus();

    // Tab multiple times to reach sidebar links
    let dashboardLink: Element | null = null;
    for (let i = 0; i < 20; i++) {
      await user.tab();
      if (document.activeElement?.getAttribute("href") === "/dashboard") {
        dashboardLink = document.activeElement;
        break;
      }
    }
    expect(dashboardLink).toBeTruthy();
  });
});
