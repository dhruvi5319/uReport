import { render, screen, act } from "@testing-library/react";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";

// Consumer component for testing
function ThemeConsumer() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setTheme("dark")}>Set Dark</button>
      <button onClick={() => setTheme("light")}>Set Light</button>
    </div>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

beforeEach(() => {
  // vitest jsdom localStorage has null prototype — use removeItem for known keys
  localStorage.removeItem("ureport-theme");
  document.documentElement.classList.remove("dark");
});

test("defaults to system theme when localStorage is empty", () => {
  render(<ThemeConsumer />, { wrapper: Wrapper });
  expect(screen.getByTestId("theme").textContent).toBe("system");
});

test("setting theme to dark adds .dark class to <html>", () => {
  render(<ThemeConsumer />, { wrapper: Wrapper });
  act(() => {
    screen.getByText("Set Dark").click();
  });
  expect(document.documentElement.classList.contains("dark")).toBe(true);
  expect(localStorage.getItem("ureport-theme")).toBe("dark");
});

test("setting theme to light removes .dark class from <html>", () => {
  document.documentElement.classList.add("dark");
  render(<ThemeConsumer />, { wrapper: Wrapper });
  act(() => {
    screen.getByText("Set Light").click();
  });
  expect(document.documentElement.classList.contains("dark")).toBe(false);
  expect(localStorage.getItem("ureport-theme")).toBe("light");
});

test("persists theme choice to localStorage under key 'ureport-theme'", () => {
  render(<ThemeConsumer />, { wrapper: Wrapper });
  act(() => {
    screen.getByText("Set Dark").click();
  });
  expect(localStorage.getItem("ureport-theme")).toBe("dark");
});

test("restores theme from localStorage on mount", () => {
  localStorage.setItem("ureport-theme", "dark");
  render(<ThemeConsumer />, { wrapper: Wrapper });
  expect(screen.getByTestId("theme").textContent).toBe("dark");
  expect(document.documentElement.classList.contains("dark")).toBe(true);
});

test("throws when useTheme used outside ThemeProvider", () => {
  // Suppress console.error for this test
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  expect(() => render(<ThemeConsumer />)).toThrow("useTheme must be used inside ThemeProvider");
  spy.mockRestore();
});
