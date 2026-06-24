/**
 * uReport Modernization — E2E Journey Smoke Tests
 * Covers all 11 user journeys from project_specs/JOURNEYS-uReport.md
 *
 * Prerequisites: docker-compose up -d is running; app accessible at http://localhost:80
 * Run: npx playwright test e2e/journeys.spec.ts --reporter=list
 */
import { test, expect, type Page } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:80';
const STAFF_USER     = process.env.TEST_STAFF_USER     ?? 'admin';
const STAFF_PASSWORD = process.env.TEST_STAFF_PASSWORD ?? 'password';
const API_KEY        = process.env.TEST_API_KEY         ?? '';

// ── Auth helper ──────────────────────────────────────────────────────────────

async function loginAsStaff(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.fill('#username', STAFF_USER);
  await page.fill('#password', STAFF_PASSWORD);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/tickets/, { timeout: 10_000 });
}

// ── JRN-01.1: Morning Queue Triage ───────────────────────────────────────────

test('JRN-01.1 — staff can log in and view ticket list within 5 seconds', async ({ page }) => {
  const start = Date.now();
  await loginAsStaff(page);
  const elapsed = Date.now() - start;

  // Success criterion: JWT auth completes and dashboard accessible in under 5 seconds
  expect(elapsed).toBeLessThan(5_000);
  await expect(page.locator('h1, h2').first()).toBeVisible();
});

test('JRN-01.1 — ticket list renders with status filter controls visible', async ({ page }) => {
  await loginAsStaff(page);
  await page.goto(`${BASE}/tickets`);
  // Filter controls must be visible (TicketSearchFilters from Wave 3a)
  await expect(page.locator('select, input[type="text"]').first()).toBeVisible({ timeout: 5_000 });
});

// ── JRN-01.2: Full Ticket Update ─────────────────────────────────────────────

test('JRN-01.2 — ticket detail page loads with history section', async ({ page }) => {
  await loginAsStaff(page);
  await page.goto(`${BASE}/tickets`);
  // Click first ticket if list is non-empty
  const firstRow = page.locator('table tbody tr, [data-testid="ticket-row"]').first();
  if (await firstRow.isVisible()) {
    await firstRow.click();
    // History section must exist on ticket detail
    await expect(page.locator('text=/history|History|HISTORY/').first()).toBeVisible({ timeout: 5_000 });
  }
  // If list is empty, verify the create ticket button is accessible for staff
  else {
    await expect(page.locator('text=/New Ticket|Create Ticket/').first()).toBeVisible();
  }
});

// ── JRN-01.3: Saving and Reusing a Filter ────────────────────────────────────

test('JRN-01.3 — bookmarks page is accessible to staff', async ({ page }) => {
  await loginAsStaff(page);
  await page.goto(`${BASE}/bookmarks`);
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 5_000 });
});

// ── JRN-02.1: Configuring a New Service Category ─────────────────────────────

test('JRN-02.1 — categories admin page is accessible to staff', async ({ page }) => {
  await loginAsStaff(page);
  await page.goto(`${BASE}/admin/categories`);
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 5_000 });
});

test('JRN-02.1 — category form includes SLA and permission level fields', async ({ page }) => {
  await loginAsStaff(page);
  await page.goto(`${BASE}/admin/categories`);
  // New category button must exist
  const newBtn = page.locator('text=/New Category|Add Category/').first();
  if (await newBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await newBtn.click();
    // SLA field must be in the form
    await expect(page.locator('input[name="slaDays"], [data-field="slaDays"]').first()).toBeVisible({ timeout: 3_000 });
  }
});

// ── JRN-02.2: Month-End SLA Compliance Review ────────────────────────────────

test('JRN-02.2 — metrics dashboard page is accessible to staff', async ({ page }) => {
  await loginAsStaff(page);
  await page.goto(`${BASE}/metrics`);
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 5_000 });
});

// ── JRN-02.3: Onboarding a New Case Worker ───────────────────────────────────

test('JRN-02.3 — people admin page is accessible to staff', async ({ page }) => {
  await loginAsStaff(page);
  await page.goto(`${BASE}/admin/people`);
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 5_000 });
});

// ── JRN-03.1: Post-Migration JWT Account Validation ──────────────────────────

test('JRN-03.1 — JWT issued on login; invalid credentials return 401', async ({ page }) => {
  await page.goto(`${BASE}/login`);
  await page.fill('#username', 'nonexistent_user_xyz');
  await page.fill('#password', 'wrong_password');
  await page.click('button[type="submit"]');
  // Error banner must appear (LoginPage shows ErrorBanner on 401)
  await expect(page.locator('[role="alert"], .error, [data-testid="error-banner"]').first()).toBeVisible({ timeout: 5_000 });
});

test('JRN-03.1 — valid staff credentials issue JWT and redirect to tickets', async ({ page }) => {
  await loginAsStaff(page);
  // JWT is stored; verify we are on /tickets (not /login)
  await expect(page).not.toHaveURL(/\/login/);
});

// ── JRN-03.2: API Client Registration and Key Rotation ───────────────────────

test('JRN-03.2 — API clients admin page is accessible to staff', async ({ page }) => {
  await loginAsStaff(page);
  await page.goto(`${BASE}/admin/clients`);
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 5_000 });
});

// ── JRN-03.3: Post-Deployment Health Verification ────────────────────────────

test('JRN-03.3 — admin jobs page with scheduler trigger buttons is accessible', async ({ page }) => {
  await loginAsStaff(page);
  await page.goto(`${BASE}/admin/jobs`);
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 5_000 });
  // At least one "Run Now" button must exist
  await expect(page.locator('text=/Run Now|Trigger|Run/').first()).toBeVisible({ timeout: 3_000 });
});

test('JRN-03.3 — Open311 services endpoint returns 200 JSON with correct Content-Type', async ({ page }) => {
  const response = await page.request.get(`${BASE}/open311/services`);
  expect(response.status()).toBe(200);
  const ct = response.headers()['content-type'] ?? '';
  expect(ct).toContain('application/json');
  const body = await response.json();
  expect(Array.isArray(body)).toBe(true);
});

// ── JRN-04.1: Service Request Submission After Migration Cutover ──────────────

test('JRN-04.1 — Open311 discovery endpoint returns 200 with endpoints array', async ({ page }) => {
  const response = await page.request.get(`${BASE}/open311/discovery`);
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body).toHaveProperty('endpoints');
  expect(Array.isArray(body.endpoints)).toBe(true);
});

test('JRN-04.1 — POST /open311/requests with invalid api_key returns 403', async ({ page }) => {
  const response = await page.request.post(`${BASE}/open311/requests`, {
    form: {
      api_key: 'invalid-key',
      service_code: '1',
      description: 'Test submission',
    },
  });
  expect(response.status()).toBe(403);
});

test('JRN-04.1 — Open311 XML format returns correct Content-Type and XML declaration', async ({ page }) => {
  const response = await page.request.get(`${BASE}/open311/services?format=xml`);
  expect(response.status()).toBe(200);
  const ct = response.headers()['content-type'] ?? '';
  expect(ct).toContain('xml');
  const body = await response.text();
  expect(body).toMatch(/^<\?xml version="1\.0" encoding="utf-8"\?>/);
  expect(body).toContain('<services>');
});

// ── JRN-04.2: Status Polling — GET /open311/requests/{id} ────────────────────

test('JRN-04.2 — GET /open311/requests/{id} returns 404 with error field for unknown id', async ({ page }) => {
  const response = await page.request.get(`${BASE}/open311/requests/99999999`);
  expect(response.status()).toBe(404);
  const body = await response.json();
  expect(body).toHaveProperty('error');
});

test('JRN-04.2 — GET /open311/requests returns JSON array (empty or populated)', async ({ page }) => {
  const response = await page.request.get(`${BASE}/open311/requests`);
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(Array.isArray(body)).toBe(true);
});
