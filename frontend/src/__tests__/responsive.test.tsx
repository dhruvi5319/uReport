import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi, describe, test, expect, beforeAll } from "vitest";
import AppShell from "../components/shell/AppShell";

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { personId: 1, username: "admin", role: "admin", firstname: "A", lastname: "B" },
    loading: false,
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../contexts/ThemeContext", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn(), resolvedTheme: "light" }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../components/AnimationProvider", () => ({
  AnimationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAnimationConfig: () => ({ reducedMotion: false, duration: (b: number) => b }),
}));

function setViewport(width: number, height = 768) {
  Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: width });
  Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: height });
  window.dispatchEvent(new Event("resize"));
}

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
      matches: q.includes("max-width: 767"),
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
          <Route path="/dashboard" element={<p>Dashboard content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe("Responsive — AppShell structure", () => {
  test("main content area has id='main-content' at all viewports", () => {
    for (const width of [375, 768, 1280]) {
      setViewport(width);
      const { unmount } = renderShell();
      const main = document.getElementById("main-content");
      expect(main).toBeTruthy();
      unmount();
    }
  });

  test("hamburger button is present in DOM (mobile visibility controlled by CSS md:hidden)", () => {
    setViewport(375);
    const { unmount, container } = renderShell();
    // The hamburger button exists in the DOM (CSS hides it on md+ via Tailwind)
    const hamburger = container.querySelector('[aria-label="Open navigation menu"]');
    expect(hamburger).toBeTruthy();
    unmount();
  });

  test("sidebar nav element is present in DOM (CSS controls visibility)", () => {
    setViewport(1280);
    const { unmount, container } = renderShell();
    const nav = container.querySelector('nav[aria-label="Primary navigation"]');
    expect(nav).toBeTruthy();
    unmount();
  });

  test("skip link exists at 375px mobile viewport", () => {
    setViewport(375);
    const { unmount, container } = renderShell();
    const skipLink = container.querySelector('a[href="#main-content"]');
    expect(skipLink).toBeTruthy();
    expect(skipLink?.textContent).toContain("Skip to main content");
    unmount();
  });

  test("no element in AppShell has explicit width wider than 375px (overflow guard)", () => {
    setViewport(375, 812);
    const { unmount, container } = renderShell();
    // Check that no element has inline style width > 375px
    const allElements = container.querySelectorAll("*");
    const overflowing = Array.from(allElements).filter((el) => {
      const style = (el as HTMLElement).style?.width;
      if (!style) return false;
      const px = parseInt(style);
      return !isNaN(px) && px > 375;
    });
    expect(overflowing).toHaveLength(0);
    unmount();
  });

  test("AppShell renders without error at 768px (tablet)", () => {
    setViewport(768);
    expect(() => {
      const { unmount } = renderShell();
      unmount();
    }).not.toThrow();
  });

  test("AppShell renders without error at 1280px (desktop)", () => {
    setViewport(1280);
    expect(() => {
      const { unmount } = renderShell();
      unmount();
    }).not.toThrow();
  });
});

// ── Reduced motion tests ──────────────────────────────────────────────────────

describe("AnimationProvider — prefers-reduced-motion", () => {
  test("useReducedMotion returns false when prefers-reduced-motion is not set", async () => {
    // Dynamically import to test the hook in isolation
    const { useReducedMotion } = await import("../lib/hooks/useReducedMotion");
    const { renderHook } = await import("@testing-library/react");

    // matchMedia returns matches: false (set in beforeAll)
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });
});
