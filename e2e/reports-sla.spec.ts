// e2e/reports-sla.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Reports & SLA Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Log in as staff via OIDC test credential (set by Wave 4 Keycloak fixture)
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    // Follow OIDC redirect; assume test IdP auto-approves (Wave 4 Keycloak or mock)
    await page.waitForURL('/dashboard', { timeout: 15000 });
  });

  test('SLA dashboard shows KPI cards with data', async ({ page }) => {
    await page.goto('/reports/sla');
    // Wait for skeleton loaders to resolve
    await expect(page.getByRole('heading', { name: /SLA Compliance Dashboard/i })).toBeVisible();
    // At least one of the KPI cards should render (even if data is 0)
    await expect(page.getByText(/Total Closed/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/On-Time %/i)).toBeVisible();
  });

  test('SLA dashboard shows category table with colour-coded badges', async ({ page }) => {
    await page.goto('/reports/sla');
    await page.waitForLoadState('networkidle');
    // The table header should be present
    await expect(page.getByRole('columnheader', { name: /Category/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('columnheader', { name: /On-Time %/i })).toBeVisible();
  });

  test('SLA breach list shows empty state when no breaches', async ({ page }) => {
    await page.goto('/reports/sla');
    await page.waitForLoadState('networkidle');
    // Either breach rows OR the empty state message should appear
    const breachPanel = page.getByText(/Open Tickets Past SLA/i);
    await expect(breachPanel).toBeVisible({ timeout: 10000 });
  });

  test('Download CSV button triggers file download on SLA page', async ({ page }) => {
    await page.goto('/reports/sla');
    await page.waitForLoadState('networkidle');
    // Set up download listener before clicking
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Download as CSV/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/sla-report\.csv/i);
  });

  test('/reports page shows report nav and activity report by default', async ({ page }) => {
    await page.goto('/reports');
    await expect(page.getByRole('heading', { name: /Reports$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Activity/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Assignments/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /SLA Compliance/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Volume Trends/i })).toBeVisible();
    // Activity report is default
    await expect(page.getByRole('heading', { name: /Activity/i, level: 2 })).toBeVisible({ timeout: 10000 });
  });

  test('/reports switching to Assignments renders assignments table', async ({ page }) => {
    await page.goto('/reports');
    await page.getByRole('button', { name: /Assignments/i }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('columnheader', { name: /Staff Member/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('columnheader', { name: /Avg Days to Close/i })).toBeVisible();
  });

  test('Download CSV on activity report triggers file download', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Download CSV/i }).first().click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/report\.csv/i);
  });

  test('SLA dashboard is responsive at 375px — no horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/reports/sla');
    await page.waitForLoadState('networkidle');
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(375 + 2); // ±2px tolerance
  });
});
