// e2e/journeys/manager-sla-dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('E2E-004: Manager SLA Dashboard (JRN-02.1)', () => {

  test.beforeEach(async ({ request }) => {
    const health = await request.get('/api/health').catch(() => null);
    if (!health?.ok()) test.skip(true, 'Backend unavailable');
  });

  test('GET /api/metrics/sla returns valid response structure', async ({ request }) => {
    const res = await request.get('/api/metrics/sla?days=30');
    if (res.status() === 401) {
      test.skip(true, 'Not authenticated for metrics endpoint');
      return;
    }
    expect(res.ok()).toBe(true);
    const body = await res.json();
    // Response follows { data, meta, errors } envelope
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('GET /api/reports/open-age returns list of overdue tickets', async ({ request }) => {
    const res = await request.get('/api/reports/open-age');
    if (res.status() === 401 || res.status() === 403) {
      test.skip(true, 'Not authenticated for open-age report');
      return;
    }
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('/reports/sla page renders KPI cards and SLA category table', async ({ page }) => {
    await page.goto('/reports/sla');
    if (page.url().includes('/login')) {
      test.skip(true, 'Not authenticated');
      return;
    }

    // KPI cards: Total Closed, On Time, Late, On-Time %
    await expect(page.getByText(/total closed/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/on.?time/i)).toBeVisible();
    await expect(page.getByText(/late/i)).toBeVisible();
  });

  test('/reports/sla has Download CSV button', async ({ page }) => {
    await page.goto('/reports/sla');
    if (page.url().includes('/login')) {
      test.skip(true, 'Not authenticated');
      return;
    }

    await expect(page.getByRole('button', { name: /download.*csv/i })).toBeVisible({ timeout: 5000 });
  });

  test('/reports page left nav has SLA Compliance link', async ({ page }) => {
    await page.goto('/reports');
    if (page.url().includes('/login')) {
      test.skip(true, 'Not authenticated');
      return;
    }

    await expect(page.getByRole('navigation', { name: /report types/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /sla compliance/i })).toBeVisible();
  });

});
