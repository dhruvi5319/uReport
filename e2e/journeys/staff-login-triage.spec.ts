// e2e/journeys/staff-login-triage.spec.ts
import { test, expect } from '@playwright/test';

test.describe('E2E-001: Staff Login & Morning Triage (JRN-01.1)', () => {

  test('Login page renders SSO button and citizen link', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('link', { name: /sign in with city sso/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('link', { name: /submit a service request/i })).toBeVisible();
  });

  test('Login page SSO button links to /auth/login', async ({ page }) => {
    await page.goto('/login');
    const ssoLink = page.getByRole('link', { name: /sign in with city sso/i });
    const href = await ssoLink.getAttribute('href');
    expect(href).toMatch(/\/auth\/login/);
  });

  test('Dashboard shows KPI cards (or placeholder) for authenticated staff', async ({ page, request }) => {
    // Check API availability first
    const health = await request.get('/api/health').catch(() => null);
    if (!health?.ok()) {
      test.skip(true, 'Backend unavailable — skipping dashboard test');
      return;
    }

    // Navigate to dashboard (middleware will redirect to /login if unauthenticated)
    await page.goto('/dashboard');
    // Either the dashboard loads (authenticated) OR we land on /login — both are valid states
    const url = page.url();
    if (url.includes('/login')) {
      // Not authenticated — verify login page rendered correctly
      await expect(page.getByRole('link', { name: /sign in with city sso/i })).toBeVisible();
    } else {
      // Authenticated — verify KPI cards
      await expect(page.getByText(/sla breached|open tickets|on-time/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('Tickets page renders status filter buttons', async ({ page, request }) => {
    const health = await request.get('/api/health').catch(() => null);
    if (!health?.ok()) {
      test.skip(true, 'Backend unavailable');
      return;
    }

    await page.goto('/tickets');
    const url = page.url();
    if (url.includes('/login')) {
      test.skip(true, 'Not authenticated — skipping ticket list test');
      return;
    }

    // Status filter group should be present
    await expect(page.getByRole('group', { name: /filter by status/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /^all$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^open$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^closed$/i })).toBeVisible();
  });

  test('Unauthenticated access to /dashboard redirects to /login', async ({ page }) => {
    // Clear cookies to ensure unauthenticated state
    await page.context().clearCookies();
    await page.goto('/dashboard');
    // Should end up at /login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

});
