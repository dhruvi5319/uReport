/**
 * uReport CRM — UAT Acceptance Tests
 * Covers key user story acceptance criteria for the full uReport modernization.
 *
 * Prerequisites: docker-compose stack running
 *   - SPA:  http://localhost:80
 *   - API:  http://localhost:8080
 *
 * Run: npx playwright test e2e/uat/implement-the-full-ureport-modernization.spec.ts --reporter=list
 */
import { test, expect } from '@playwright/test';

const SPA = 'http://localhost:80';
const API = 'http://localhost:8080';

// ── US-APP-HEALTH ─────────────────────────────────────────────────────────────

test('US-APP-HEALTH — GET /api/v1/health returns {"status":"UP"}', async ({ page }) => {
  const res = await page.request.get(`${API}/api/v1/health`);
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body).toHaveProperty('status', 'UP');
});

// ── US-HEALTH-CONTROLLER ──────────────────────────────────────────────────────

test('US-HEALTH-CONTROLLER — GET /api/v1/health returns {"status":"UP"}', async ({ page }) => {
  const res = await page.request.get(`${API}/api/v1/health`);
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body).toHaveProperty('status', 'UP');
});

// ── US-PUBLIC-ENDPOINTS ───────────────────────────────────────────────────────

test('US-PUBLIC-ENDPOINTS — GET /api/v1/contact-methods returns 200 without auth', async ({ page }) => {
  const res = await page.request.get(`${API}/api/v1/contact-methods`);
  expect(res.status()).toBe(200);
});

test('US-PUBLIC-ENDPOINTS — GET /api/v1/issue-types returns 200 without auth', async ({ page }) => {
  const res = await page.request.get(`${API}/api/v1/issue-types`);
  expect(res.status()).toBe(200);
});

test('US-PUBLIC-ENDPOINTS — GET /open311/services returns 200 without auth', async ({ page }) => {
  const res = await page.request.get(`${API}/open311/services`);
  expect(res.status()).toBe(200);
});

// ── US-SPA-LOADS ──────────────────────────────────────────────────────────────

test('US-SPA-LOADS — SPA root returns 200 with HTML content', async ({ page }) => {
  const res = await page.request.get(`${SPA}/`);
  expect(res.status()).toBe(200);
  const ct = res.headers()['content-type'] ?? '';
  expect(ct).toContain('text/html');
  const body = await res.text();
  expect(body.length).toBeGreaterThan(100);
  expect(body).toMatch(/<html/i);
});

// ── US-SPA-REDIRECT ───────────────────────────────────────────────────────────

test('US-SPA-REDIRECT — browser GET http://localhost:80/ returns HTML 200', async ({ page }) => {
  const response = await page.goto(`${SPA}/`);
  expect(response).not.toBeNull();
  expect(response!.status()).toBe(200);
  const content = await page.content();
  expect(content).toMatch(/<html/i);
});

// ── US-SPA-LOGIN ──────────────────────────────────────────────────────────────

test('US-SPA-LOGIN — /login page renders with username and password fields', async ({ page }) => {
  await page.goto(`${SPA}/login`);
  // Wait for the form to appear
  await expect(page.locator('input[type="text"], input[name="username"], #username').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('input[type="password"]').first()).toBeVisible({ timeout: 5_000 });
});

test('US-SPA-LOGIN — /login page has a submit button', async ({ page }) => {
  await page.goto(`${SPA}/login`);
  await expect(page.locator('button[type="submit"]').first()).toBeVisible({ timeout: 10_000 });
});

// ── US-AUTH ───────────────────────────────────────────────────────────────────

test('US-AUTH — POST /api/v1/auth/login with wrong credentials returns 401', async ({ page }) => {
  const res = await page.request.post(`${API}/api/v1/auth/login`, {
    data: { username: 'nobody_xyz_does_not_exist', password: 'wrong_password_abc' },
    headers: { 'Content-Type': 'application/json' },
  });
  expect(res.status()).toBe(401);
});

// ── US-OPEN311 ────────────────────────────────────────────────────────────────

test('US-OPEN311 — GET /open311/services returns JSON array', async ({ page }) => {
  const res = await page.request.get(`${API}/open311/services`);
  expect(res.status()).toBe(200);
  const ct = res.headers()['content-type'] ?? '';
  expect(ct).toContain('application/json');
  const body = await res.json();
  expect(Array.isArray(body)).toBe(true);
});

// ── US-OPEN311-XML ────────────────────────────────────────────────────────────

test('US-OPEN311-XML — GET /open311/services?format=xml returns Content-Type application/xml', async ({ page }) => {
  const res = await page.request.get(`${API}/open311/services?format=xml`);
  expect(res.status()).toBe(200);
  const ct = res.headers()['content-type'] ?? '';
  expect(ct).toContain('xml');
  const body = await res.text();
  // Must be valid XML with a root services element
  expect(body).toMatch(/<services/);
});

// ── US-SEARCH ─────────────────────────────────────────────────────────────────

test('US-SEARCH — GET /api/v1/tickets returns paginated response or auth error (not 500)', async ({ page }) => {
  const res = await page.request.get(`${API}/api/v1/tickets`);
  // Acceptable: 200 paginated, 401 unauthenticated, 403 forbidden — NOT 500
  expect([200, 401, 403]).toContain(res.status());
  if (res.status() === 200) {
    const body = await res.json();
    // Should be paginated: either array or object with content/data field
    const isArray = Array.isArray(body);
    const hasContent = typeof body === 'object' && body !== null && ('content' in body || 'data' in body);
    expect(isArray || hasContent).toBe(true);
  }
});

// ── US-CONTACT-METHODS ────────────────────────────────────────────────────────

test('US-CONTACT-METHODS — GET /api/v1/contact-methods returns array with 4 seeded items', async ({ page }) => {
  const res = await page.request.get(`${API}/api/v1/contact-methods`);
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(Array.isArray(body)).toBe(true);
  expect(body).toHaveLength(4);
});

// ── US-ISSUE-TYPES ────────────────────────────────────────────────────────────

test('US-ISSUE-TYPES — GET /api/v1/issue-types returns array with 6 seeded items', async ({ page }) => {
  const res = await page.request.get(`${API}/api/v1/issue-types`);
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(Array.isArray(body)).toBe(true);
  expect(body).toHaveLength(6);
});

// ── US-DISCOVERY ──────────────────────────────────────────────────────────────

test('US-DISCOVERY — GET /open311/discovery returns JSON with changeset field', async ({ page }) => {
  const res = await page.request.get(`${API}/open311/discovery`);
  expect(res.status()).toBe(200);
  const ct = res.headers()['content-type'] ?? '';
  expect(ct).toContain('application/json');
  const body = await res.json();
  expect(body).toHaveProperty('changeset');
});

// ── US-404-HANDLING ───────────────────────────────────────────────────────────

test('US-404-HANDLING — GET /api/v1/tickets/99999 returns 404 or auth error (not 500)', async ({ page }) => {
  const res = await page.request.get(`${API}/api/v1/tickets/99999`);
  // Must not be a server error
  expect(res.status()).not.toBe(500);
  // Acceptable: 404 not found, 401 unauthenticated, 403 forbidden
  expect([401, 403, 404]).toContain(res.status());
});

// ── US-SUBSTATUS-API ──────────────────────────────────────────────────────────

test('US-SUBSTATUS-API — GET /api/v1/substatus without auth returns 401 or 403 (not 500, not HTML)', async ({ page }) => {
  const res = await page.request.get(`${API}/api/v1/substatus`);
  // Must not be server error
  expect(res.status()).not.toBe(500);
  // Must not be 200 OK (endpoint requires auth)
  expect(res.status()).not.toBe(200);
  // Acceptable: 401 or 403
  expect([401, 403]).toContain(res.status());
  // Response must not be HTML (not a redirect to login page)
  const ct = res.headers()['content-type'] ?? '';
  expect(ct).not.toContain('text/html');
});
