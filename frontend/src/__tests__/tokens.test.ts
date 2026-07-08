import { readFileSync } from "fs";
import { resolve } from "path";

const css = readFileSync(resolve(__dirname, "../globals.css"), "utf-8");

describe("CSS design tokens", () => {
  test("globals.css contains all light-mode custom properties in :root", () => {
    const required = [
      "--color-primary",
      "--color-primary-foreground",
      "--color-secondary",
      "--color-secondary-foreground",
      "--color-destructive",
      "--color-muted",
      "--color-muted-foreground",
      "--color-background",
      "--color-foreground",
      "--color-border",
      "--color-ring",
      "--color-card",
      "--color-card-foreground",
      "--color-status-open",
      "--color-status-resolved",
      "--color-status-duplicate",
      "--color-status-bogus",
      "--radius",
    ];
    for (const token of required) {
      expect(css).toContain(token);
    }
  });

  test("globals.css has .dark section with dark-mode overrides", () => {
    expect(css).toContain(".dark {");
    expect(css).toContain("--color-background: 222 47% 11%");
    expect(css).toContain("--color-primary: 217 91% 65%");
    expect(css).toContain("--color-status-open: 217 91% 65%");
  });

  test("all animation durations are within 300ms budget", () => {
    const { readFileSync: rfs } = require("fs");
    const animTs = rfs(resolve(__dirname, "../lib/animations.ts"), "utf-8");
    const durations = [...animTs.matchAll(/duration:\s*([\d.]+)/g)].map(
      (m) => parseFloat(m[1])
    );
    expect(durations.length).toBeGreaterThan(0);
    for (const d of durations) {
      expect(d).toBeLessThanOrEqual(0.3);
    }
  });
});
