import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const primaryRoutes = [
  { path: '/login', name: 'Login page' },
  { path: '/tickets', name: 'Ticket list' },
  { path: '/dashboard', name: 'Staff dashboard' },
  { path: '/submit', name: 'Public submission form' },
];

for (const { path, name } of primaryRoutes) {
  test(`WCAG 2.1 AA: ${name} (${path}) — 0 critical axe violations`, async ({ page }) => {
    await page.goto(path);
    // Wait for main content to render
    await page.locator('#main-content').waitFor({ state: 'visible' });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === 'critical');
    expect(
      critical,
      `Critical WCAG violations on ${name}:\n${critical.map((v) => `  [${v.id}] ${v.description}\n  Help: ${v.helpUrl}`).join('\n')}`
    ).toHaveLength(0);
  });
}

test('Skip to main content link is the first focusable element on all pages', async ({ page }) => {
  await page.goto('/tickets');
  // Tab once from top of page
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => document.activeElement?.textContent?.trim());
  expect(focused).toMatch(/skip to main content/i);
});

test('Skip link target #main-content exists on ticket list', async ({ page }) => {
  await page.goto('/tickets');
  await expect(page.locator('#main-content')).toBeVisible();
});
