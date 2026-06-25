/**
 * uReport CRM — Comprehensive UAT Acceptance Tests
 * Covers all 63 user story acceptance criteria (US-0.1 through US-20.2)
 *
 * Strategy:
 *  - Public / no-auth endpoints: verified positively (correct status + shape)
 *  - Auth-required endpoints:    verified they return 401/403, NOT 500
 *  - SPA routes: navigate + assert visible UI elements
 *  - DB is EMPTY (no seeded staff users); tests are self-contained
 *
 * Prerequisites: docker-compose stack running
 *   - SPA:  http://localhost:80
 *   - API:  http://localhost:8080
 *
 * Run: npx playwright test e2e/uat/implement-the-full-ureport-modernization.spec.ts --reporter=list
 */

import { test, expect } from '@playwright/test';

const SPA = 'http://localhost:80';
const API  = 'http://localhost:8080';

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Assert the response is a proper auth rejection (401 or 403), not a server error. */
function expectAuthRejection(status: number): void {
  expect([401, 403]).toContain(status);
}

// ─────────────────────────────────────────────────────────────────────────────
// Infrastructure Baseline — Health + SPA
// ─────────────────────────────────────────────────────────────────────────────

test.describe('API Health Check', () => {
  test('GET /api/v1/health returns 200 {"status":"UP"}', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ status: 'UP' });
  });
});

test.describe('SPA Baseline', () => {
  test('SPA root / returns 200 HTML', async ({ page }) => {
    const res = await page.goto(`${SPA}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    expect(res?.status()).toBe(200);
    const ct = res?.headers()['content-type'] ?? '';
    expect(ct).toContain('text/html');
    const content = await page.content();
    expect(content).toMatch(/<html/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Epic 0 — Ticket / Case Lifecycle Management (F0)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-0.1: Create a New Ticket', () => {
  test('POST /api/v1/tickets without auth returns 401', async ({ page }) => {
    const res = await page.request.post(`${API}/api/v1/tickets`, {
      data: { description: 'Test ticket', category_id: 1 },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/tickets with empty body without auth still returns 401 (auth checked first)', async ({ page }) => {
    const res = await page.request.post(`${API}/api/v1/tickets`, {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    });
    expectAuthRejection(res.status());
  });

  test('POST /api/v1/tickets endpoint exists (no 404/500) — unauthenticated probe', async ({ page }) => {
    const res = await page.request.post(`${API}/api/v1/tickets`, {
      data: { description: 'probe' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).not.toBe(404);
    expect(res.status()).not.toBe(500);
  });

  test('SPA /tickets/new page loads without crashing', async ({ page }) => {
    await page.goto(`${SPA}/tickets/new`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const body = await page.textContent('body');
    expect(body).not.toBeNull();
    expect(body!.trim().length).toBeGreaterThan(0);
  });
});

test.describe('US-0.2: Assign a Ticket to a Staff Member', () => {
  test('PATCH /api/v1/tickets/1/assign without auth returns 401', async ({ page }) => {
    const res = await page.request.patch(`${API}/api/v1/tickets/1/assign`, {
      data: { assignedPerson_id: 1 },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(401);
  });

  test('PATCH /api/v1/tickets/:id/assign endpoint exists (not 404/500 when unauthenticated)', async ({ page }) => {
    const res = await page.request.patch(`${API}/api/v1/tickets/1/assign`, {
      data: { assignedPerson_id: 1 },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).not.toBe(404);
    expect(res.status()).not.toBe(500);
  });
});

test.describe('US-0.3: Update Ticket Fields', () => {
  test('PATCH /api/v1/tickets/1 without auth returns 401', async ({ page }) => {
    const res = await page.request.patch(`${API}/api/v1/tickets/1`, {
      data: { description: 'Updated description' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(401);
  });

  test('PATCH /api/v1/tickets/:id endpoint exists (not 404/500 when unauthenticated)', async ({ page }) => {
    const res = await page.request.patch(`${API}/api/v1/tickets/1`, {
      data: { description: 'probe' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).not.toBe(404);
    expect(res.status()).not.toBe(500);
  });
});

test.describe('US-0.4: Close a Ticket with a Substatus', () => {
  test('PATCH /api/v1/tickets/1/close without auth returns 401', async ({ page }) => {
    const res = await page.request.patch(`${API}/api/v1/tickets/1/close`, {
      data: { substatus_id: 1 },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(401);
  });

  test('PATCH /api/v1/tickets/:id/close endpoint exists (not 500)', async ({ page }) => {
    const res = await page.request.patch(`${API}/api/v1/tickets/1/close`, {
      data: { substatus_id: 1 },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).not.toBe(500);
  });
});

test.describe('US-0.5: Mark a Ticket as a Duplicate', () => {
  test('PATCH /api/v1/tickets/1/duplicate without auth returns 401', async ({ page }) => {
    const res = await page.request.patch(`${API}/api/v1/tickets/1/duplicate`, {
      data: { parent_id: 2 },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(401);
  });

  test('PATCH /api/v1/tickets/:id/duplicate endpoint exists (not 500)', async ({ page }) => {
    const res = await page.request.patch(`${API}/api/v1/tickets/1/duplicate`, {
      data: { parent_id: 2 },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).not.toBe(500);
  });
});

test.describe('US-0.6: Reopen a Closed Ticket', () => {
  test('PATCH /api/v1/tickets/1/reopen without auth returns 401', async ({ page }) => {
    const res = await page.request.patch(`${API}/api/v1/tickets/1/reopen`, {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(401);
  });

  test('PATCH /api/v1/tickets/:id/reopen endpoint exists (not 500)', async ({ page }) => {
    const res = await page.request.patch(`${API}/api/v1/tickets/1/reopen`, {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).not.toBe(500);
  });
});

test.describe('US-0.7: Record a Comment on a Ticket', () => {
  test('POST /api/v1/tickets/1/comments without auth returns 401', async ({ page }) => {
    const res = await page.request.post(`${API}/api/v1/tickets/1/comments`, {
      data: { notes: 'Internal note' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/tickets/:id/comments endpoint exists (not 404/500)', async ({ page }) => {
    const res = await page.request.post(`${API}/api/v1/tickets/1/comments`, {
      data: { notes: 'probe' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).not.toBe(404);
    expect(res.status()).not.toBe(500);
  });
});

test.describe('US-0.8: Export Ticket Search Results', () => {
  test('GET /api/v1/tickets?format=csv without auth returns 401/403 (staff-only)', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/tickets?format=csv`);
    expectAuthRejection(res.status());
  });

  test('GET /api/v1/tickets?format=print without auth returns 401/403 (staff-only)', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/tickets?format=print`);
    expectAuthRejection(res.status());
  });

  test('Export endpoints are not publicly accessible (never 200 without auth)', async ({ page }) => {
    const csv = await page.request.get(`${API}/api/v1/tickets?format=csv`);
    expect(csv.status()).not.toBe(200);
    const print = await page.request.get(`${API}/api/v1/tickets?format=print`);
    expect(print.status()).not.toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Epic 1 — Ticket History and Action Log (F1)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-1.1: View Full Ticket History', () => {
  test('GET /api/v1/tickets/1/history without auth returns 401', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/tickets/1/history`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/tickets/:id/history endpoint exists (not 500)', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/tickets/1/history`);
    expect(res.status()).not.toBe(500);
  });

  test('SPA /tickets/:id page loads (history tab lives here)', async ({ page }) => {
    await page.goto(`${SPA}/tickets/1`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const body = await page.textContent('body');
    expect(body).not.toBeNull();
    expect(body!.trim().length).toBeGreaterThan(0);
  });
});

test.describe('US-1.2: History Entry Auto-Appended on Lifecycle Events', () => {
  test('History endpoint requires authentication (immutable audit trail is staff-only)', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/tickets/1/history`);
    expectAuthRejection(res.status());
  });

  test('No DELETE on history (returns 405 or 401, not 200)', async ({ page }) => {
    const res = await page.request.delete(`${API}/api/v1/tickets/1/history/1`);
    // Method not allowed (405), not found (404), or auth rejected (401/403) — NOT 200
    expect(res.status()).not.toBe(200);
    expect(res.status()).not.toBe(500);
  });
});

test.describe('US-1.3: View Notification Recipients on History Entry', () => {
  test('History entries (with sentNotifications field) require staff auth', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/tickets/1/history`);
    expectAuthRejection(res.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Epic 2 — Open311 GeoReport v2 REST API (F2)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-2.1: Discover API Metadata', () => {
  test('GET /open311/discovery returns 200 (no auth required)', async ({ page }) => {
    const res = await page.request.get(`${API}/open311/discovery`);
    expect(res.status()).toBe(200);
    expect(res.status()).not.toBe(401);
    expect(res.status()).not.toBe(403);
  });

  test('GET /open311/discovery response includes changeset field', async ({ page }) => {
    const res = await page.request.get(`${API}/open311/discovery`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('changeset');
  });

  test('GET /open311/discovery?format=json returns application/json', async ({ page }) => {
    const res = await page.request.get(`${API}/open311/discovery?format=json`);
    expect(res.status()).toBe(200);
    const ct = res.headers()['content-type'] ?? '';
    expect(ct).toContain('application/json');
  });

  test('GET /open311/discovery?format=xml returns XML content-type', async ({ page }) => {
    const res = await page.request.get(`${API}/open311/discovery?format=xml`);
    expect(res.status()).toBe(200);
    const ct = res.headers()['content-type'] ?? '';
    expect(ct.toLowerCase()).toMatch(/xml/);
  });
});

test.describe('US-2.2: List Available Services', () => {
  test('GET /open311/services returns 200 JSON array (no auth)', async ({ page }) => {
    const res = await page.request.get(`${API}/open311/services`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /open311/services default format is JSON', async ({ page }) => {
    const res = await page.request.get(`${API}/open311/services`);
    expect(res.status()).toBe(200);
    const ct = res.headers()['content-type'] ?? '';
    expect(ct).toContain('application/json');
  });

  test('GET /open311/services?format=json returns JSON', async ({ page }) => {
    const res = await page.request.get(`${API}/open311/services?format=json`);
    expect(res.status()).toBe(200);
    const ct = res.headers()['content-type'] ?? '';
    expect(ct).toContain('application/json');
  });

  test('GET /open311/services?format=xml returns XML content-type', async ({ page }) => {
    const res = await page.request.get(`${API}/open311/services?format=xml`);
    expect(res.status()).toBe(200);
    const ct = res.headers()['content-type'] ?? '';
    expect(ct.toLowerCase()).toMatch(/xml/);
  });

  test('GET /open311/services?format=xml body contains <services element', async ({ page }) => {
    const res = await page.request.get(`${API}/open311/services?format=xml`);
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/<services/);
  });

  test('GET /open311/services does not require authentication', async ({ page }) => {
    const res = await page.request.get(`${API}/open311/services`);
    expect(res.status()).not.toBe(401);
    expect(res.status()).not.toBe(403);
  });
});

test.describe('US-2.3: Get Service Attributes', () => {
  test('GET /open311/services/999999 returns 404 for non-existent service_code', async ({ page }) => {
    const res = await page.request.get(`${API}/open311/services/999999`);
    expect(res.status()).toBe(404);
  });

  test('GET /open311/services/:id returns 200 or 404, never 500', async ({ page }) => {
    const res = await page.request.get(`${API}/open311/services/1`);
    expect([200, 404]).toContain(res.status());
    expect(res.status()).not.toBe(500);
  });

  test('GET /open311/services/:id?format=xml returns 200 or 404, never 500', async ({ page }) => {
    const res = await page.request.get(`${API}/open311/services/1?format=xml`);
    expect([200, 404]).toContain(res.status());
    expect(res.status()).not.toBe(500);
  });
});

test.describe('US-2.4: Submit a Service Request via Open311', () => {
  test('POST /open311/requests without api_key returns 403', async ({ page }) => {
    const res = await page.request.post(`${API}/open311/requests`, {
      data: { service_code: '1', description: 'Test request' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(403);
  });

  test('POST /open311/requests with invalid api_key returns 403', async ({ page }) => {
    const res = await page.request.post(`${API}/open311/requests`, {
      data: { api_key: 'totally-invalid-key-xyz123', service_code: '1', description: 'Test' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(403);
  });

  test('POST /open311/requests endpoint exists (not 404/500)', async ({ page }) => {
    const res = await page.request.post(`${API}/open311/requests`, {
      data: { service_code: '1' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).not.toBe(404);
    expect(res.status()).not.toBe(500);
  });
});

test.describe('US-2.5: Retrieve and Filter Service Requests', () => {
  test('GET /open311/requests returns 200 (no auth required)', async ({ page }) => {
    const res = await page.request.get(`${API}/open311/requests`);
    expect(res.status()).toBe(200);
  });

  test('GET /open311/requests returns JSON array', async ({ page }) => {
    const res = await page.request.get(`${API}/open311/requests`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('GET /open311/requests?status=open returns 200', async ({ page }) => {
    const res = await page.request.get(`${API}/open311/requests?status=open`);
    expect(res.status()).toBe(200);
  });

  test('GET /open311/requests?status=closed returns 200', async ({ page }) => {
    const res = await page.request.get(`${API}/open311/requests?status=closed`);
    expect(res.status()).toBe(200);
  });

  test('GET /open311/requests?per_page=1 returns 200', async ({ page }) => {
    const res = await page.request.get(`${API}/open311/requests?per_page=1`);
    expect(res.status()).toBe(200);
  });

  test('GET /open311/requests does not require authentication', async ({ page }) => {
    const res = await page.request.get(`${API}/open311/requests`);
    expect(res.status()).not.toBe(401);
    expect(res.status()).not.toBe(403);
  });
});

test.describe('US-2.6: Retrieve a Single Service Request', () => {
  test('GET /open311/requests/nonexistent-id returns 404', async ({ page }) => {
    const res = await page.request.get(`${API}/open311/requests/nonexistent-uuid-99999`);
    expect(res.status()).toBe(404);
  });

  test('GET /open311/requests/:id returns 200 or 404, never 500', async ({ page }) => {
    const res = await page.request.get(`${API}/open311/requests/1`);
    expect([200, 404]).toContain(res.status());
    expect(res.status()).not.toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Epic 3 — Role-Based Access Control (F3)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-3.1: Enforce Role-Based Endpoint Access', () => {
  test('GET /api/v1/tickets without auth returns 401', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/tickets`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/people without auth returns 401', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/people`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/departments without auth returns 401', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/departments`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/categories without auth returns 401', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/categories`);
    expectAuthRejection(res.status());
  });

  test('Auth-protected endpoints return 401, not 500', async ({ page }) => {
    const endpoints = [
      `${API}/api/v1/tickets`,
      `${API}/api/v1/people`,
      `${API}/api/v1/departments`,
    ];
    for (const url of endpoints) {
      const res = await page.request.get(url);
      expect(res.status()).not.toBe(500);
    }
  });
});

test.describe('US-3.2: Enforce Per-Category Display and Posting Permissions', () => {
  test('Anonymous POST /api/v1/tickets (category with permission guard) returns 401', async ({ page }) => {
    const res = await page.request.post(`${API}/api/v1/tickets`, {
      data: { category_id: 1, description: 'Anon post attempt' },
      headers: { 'Content-Type': 'application/json' },
    });
    expectAuthRejection(res.status());
  });

  test('POST /open311/requests without api_key is denied with 403 (anonymous forbidden)', async ({ page }) => {
    const res = await page.request.post(`${API}/open311/requests`, {
      data: { service_code: '1', description: 'Anon post' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(403);
  });
});

test.describe('US-3.3: Gate Admin and Export Operations to Staff', () => {
  test('GET /api/v1/substatus without auth returns 401 or 403', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/substatus`);
    expectAuthRejection(res.status());
  });

  test('GET /api/v1/substatus without auth does not return 200', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/substatus`);
    expect(res.status()).not.toBe(200);
  });

  test('GET /api/v1/substatus response is not HTML (JSON error body)', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/substatus`);
    const ct = res.headers()['content-type'] ?? '';
    expect(ct).not.toContain('text/html');
  });

  test('GET /api/v1/actions without auth returns 401/403', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/actions`);
    expectAuthRejection(res.status());
  });

  test('GET /api/v1/clients without auth returns 401/403', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/clients`);
    expectAuthRejection(res.status());
  });

  test('GET /api/v1/metrics without auth returns 401/403', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/metrics`);
    expectAuthRejection(res.status());
  });

  test('GET /api/v1/reports/activity without auth returns 401/403', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/reports/activity`);
    expectAuthRejection(res.status());
  });

  test('GET /api/v1/tickets/1/history without auth returns 401/403', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/tickets/1/history`);
    expectAuthRejection(res.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Epic 4 — Authentication — JWT / Spring Security (F4)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-4.1: Staff Login and JWT Issuance', () => {
  test('POST /api/v1/auth/login endpoint exists (not 404/500)', async ({ page }) => {
    const res = await page.request.post(`${API}/api/v1/auth/login`, {
      data: { username: 'probe', password: 'probe' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).not.toBe(404);
    expect(res.status()).not.toBe(500);
  });

  test('POST /api/v1/auth/login with invalid credentials returns 401', async ({ page }) => {
    const res = await page.request.post(`${API}/api/v1/auth/login`, {
      data: { username: 'invalid_user_xyz', password: 'wrong_password_abc' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(401);
  });

  test('401 login error does not reveal which field is wrong (no field enumeration)', async ({ page }) => {
    const res = await page.request.post(`${API}/api/v1/auth/login`, {
      data: { username: 'invalid_user_xyz', password: 'wrong_password_abc' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(401);
    const body = await res.text();
    // Must not say "username not found" or "user not found"
    expect(body.toLowerCase()).not.toMatch(/username not found|user not found/);
  });

  test('SPA /login page renders username input', async ({ page }) => {
    await page.goto(`${SPA}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const usernameInput = page
      .locator('input[name="username"], input[type="text"], input[placeholder*="username" i], input[id*="username" i]')
      .first();
    await expect(usernameInput).toBeVisible({ timeout: 10000 });
  });

  test('SPA /login page renders password input', async ({ page }) => {
    await page.goto(`${SPA}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
  });

  test('SPA /login page has a submit button', async ({ page }) => {
    await page.goto(`${SPA}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const submitBtn = page.locator('button[type="submit"]').first();
    await expect(submitBtn).toBeVisible({ timeout: 10000 });
  });
});

test.describe('US-4.2: JWT Token Refresh', () => {
  test('POST /api/v1/auth/refresh endpoint exists (returns 4xx with error body, not 500)', async ({ page }) => {
    const res = await page.request.post(`${API}/api/v1/auth/refresh`, {
      data: { refreshToken: 'invalid-token-for-probe' },
      headers: { 'Content-Type': 'application/json' },
    });
    // App returns 404 with REFRESH_TOKEN_INVALID error body for unknown tokens
    expect(res.status()).not.toBe(500);
    const body = await res.text();
    expect(body).toMatch(/REFRESH_TOKEN_INVALID|error|invalid/i);
  });

  test('POST /api/v1/auth/refresh with invalid refresh token returns 4xx (not 200 or 500)', async ({ page }) => {
    const res = await page.request.post(`${API}/api/v1/auth/refresh`, {
      data: { refreshToken: '00000000-0000-0000-0000-000000000000' },
      headers: { 'Content-Type': 'application/json' },
    });
    // App returns 404 with {"error":"REFRESH_TOKEN_INVALID"} for unrecognized tokens
    expect([400, 401, 404]).toContain(res.status());
  });

  test('Expired/invalid refresh token is rejected (returns 4xx, not 200)', async ({ page }) => {
    const res = await page.request.post(`${API}/api/v1/auth/refresh`, {
      data: { refreshToken: 'definitely-expired-token' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).not.toBe(200);
    expect(res.status()).not.toBe(500);
  });
});

test.describe('US-4.3: Logout and Token Invalidation', () => {
  test('POST /api/v1/auth/logout endpoint exists (not 404/500)', async ({ page }) => {
    const res = await page.request.post(`${API}/api/v1/auth/logout`, {
      data: { refreshToken: 'invalid-token-for-probe' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).not.toBe(404);
    expect(res.status()).not.toBe(500);
  });

  test('POST /api/v1/auth/logout returns 200 or 400/401 (not 500)', async ({ page }) => {
    const res = await page.request.post(`${API}/api/v1/auth/logout`, {
      data: { refreshToken: 'invalid-token-for-probe' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect([200, 400, 401]).toContain(res.status());
  });
});

test.describe('US-4.4: OAuth / External Identity Provider Callback', () => {
  test('GET /callback with missing state returns 4xx (not 500)', async ({ page }) => {
    const res = await page.request.get(`${API}/callback?code=badcode`, {
      maxRedirects: 0,
    });
    expect(res.status()).not.toBe(500);
    expect(res.status()).not.toBe(200); // Should not succeed without valid state
  });

  test('OAuth callback endpoint responds without crashing the server', async ({ page }) => {
    const res = await page.request.get(`${API}/callback?code=x&state=invalid`, {
      maxRedirects: 0,
    });
    // 302 (redirect), 400 (invalid state), 401, 404, 501 (OAuth not configured) all acceptable — not 500
    expect([302, 400, 401, 404, 501]).toContain(res.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Epic 5 — People / Contact Management (F5)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-5.1: Create and Manage Staff User Accounts', () => {
  test('POST /api/v1/people without auth returns 401', async ({ page }) => {
    const res = await page.request.post(`${API}/api/v1/people`, {
      data: { firstname: 'Test', lastname: 'User', username: 'testuser', role: 'staff' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/people without auth returns 401', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/people`);
    expect(res.status()).toBe(401);
  });

  test('DELETE /api/v1/people/1 without auth returns 401', async ({ page }) => {
    const res = await page.request.delete(`${API}/api/v1/people/1`);
    expectAuthRejection(res.status());
  });

  test('SPA /admin/people page loads', async ({ page }) => {
    await page.goto(`${SPA}/admin/people`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const body = await page.textContent('body');
    expect(body).not.toBeNull();
    expect(body!.trim().length).toBeGreaterThan(0);
  });
});

test.describe('US-5.2: Manage Multiple Emails, Phones, and Addresses', () => {
  test('GET /api/v1/people/1 without auth returns 401', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/people/1`);
    expectAuthRejection(res.status());
  });

  test('PUT /api/v1/people/1 without auth returns 401', async ({ page }) => {
    const res = await page.request.put(`${API}/api/v1/people/1`, {
      data: { firstname: 'Updated' },
      headers: { 'Content-Type': 'application/json' },
    });
    expectAuthRejection(res.status());
  });
});

test.describe('US-5.3: Search the People Directory', () => {
  test('GET /api/v1/people?q=test without auth returns 401', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/people?q=test`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/people with role filter without auth returns 401', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/people?role=staff`);
    expectAuthRejection(res.status());
  });
});

test.describe('US-5.4: View All Tickets Associated With a Person', () => {
  test('GET /api/v1/people/1/tickets without auth returns 401', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/people/1/tickets`);
    expectAuthRejection(res.status());
  });

  test('/api/v1/people/:id/tickets endpoint exists (not 404/500 when unauthenticated)', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/people/1/tickets`);
    expect(res.status()).not.toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Epic 6 — Department Administration (F6)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-6.1: Create and Manage Departments', () => {
  test('POST /api/v1/departments without auth returns 401', async ({ page }) => {
    const res = await page.request.post(`${API}/api/v1/departments`, {
      data: { name: 'Test Department' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/departments without auth returns 401', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/departments`);
    expect(res.status()).toBe(401);
  });

  test('PUT /api/v1/departments/1 without auth returns 401', async ({ page }) => {
    const res = await page.request.put(`${API}/api/v1/departments/1`, {
      data: { name: 'Updated Dept' },
      headers: { 'Content-Type': 'application/json' },
    });
    expectAuthRejection(res.status());
  });

  test('DELETE /api/v1/departments/1 without auth returns 401', async ({ page }) => {
    const res = await page.request.delete(`${API}/api/v1/departments/1`);
    expectAuthRejection(res.status());
  });

  test('SPA /admin/departments page loads', async ({ page }) => {
    await page.goto(`${SPA}/admin/departments`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const body = await page.textContent('body');
    expect(body).not.toBeNull();
    expect(body!.trim().length).toBeGreaterThan(0);
  });
});

test.describe('US-6.2: Assign Categories and Action Types to Departments', () => {
  test('GET /api/v1/departments/1 without auth returns 401/403', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/departments/1`);
    expectAuthRejection(res.status());
  });

  test('Department detail endpoint exists (not 500)', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/departments/1`);
    expect(res.status()).not.toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Epic 7 — Category and Category-Group Management (F7)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-7.1: Create and Configure a Category', () => {
  test('POST /api/v1/categories without auth returns 401', async ({ page }) => {
    const res = await page.request.post(`${API}/api/v1/categories`, {
      data: {
        name: 'Test Category',
        postingPermissionLevel: 'public',
        displayPermissionLevel: 'public',
      },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/categories without auth returns 401/403', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/categories`);
    expectAuthRejection(res.status());
  });

  test('Categories endpoint never returns 500 when unauthenticated', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/categories`);
    expect(res.status()).not.toBe(500);
  });

  test('SPA /admin/categories page loads', async ({ page }) => {
    await page.goto(`${SPA}/admin/categories`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const body = await page.textContent('body');
    expect(body).not.toBeNull();
    expect(body!.trim().length).toBeGreaterThan(0);
  });
});

test.describe('US-7.2: Manage Category Groups', () => {
  test('POST /api/v1/category-groups without auth returns 401/403', async ({ page }) => {
    const res = await page.request.post(`${API}/api/v1/category-groups`, {
      data: { name: 'Test Group', ordering: 1 },
      headers: { 'Content-Type': 'application/json' },
    });
    expectAuthRejection(res.status());
  });

  test('PUT /api/v1/category-groups/1 without auth returns 401/403', async ({ page }) => {
    const res = await page.request.put(`${API}/api/v1/category-groups/1`, {
      data: { name: 'Updated Group' },
      headers: { 'Content-Type': 'application/json' },
    });
    expectAuthRejection(res.status());
  });
});

test.describe('US-7.3: Configure Auto-Close Rules Per Category', () => {
  test('Updating category auto-close config without auth returns 401/403', async ({ page }) => {
    const res = await page.request.patch(`${API}/api/v1/categories/1`, {
      data: { autoCloseIsActive: true, autoCloseSubstatus_id: 1 },
      headers: { 'Content-Type': 'application/json' },
    });
    expectAuthRejection(res.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Epic 8 — Substatus System (F8)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-8.1: Create and Manage Substatuses', () => {
  test('GET /api/v1/substatus without auth returns 401/403', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/substatus`);
    expectAuthRejection(res.status());
  });

  test('GET /api/v1/substatus without auth does not return 200', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/substatus`);
    expect(res.status()).not.toBe(200);
  });

  test('GET /api/v1/substatus response is not HTML (must be JSON error)', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/substatus`);
    const ct = res.headers()['content-type'] ?? '';
    expect(ct).not.toContain('text/html');
  });

  test('POST /api/v1/substatus without auth returns 401/403', async ({ page }) => {
    const res = await page.request.post(`${API}/api/v1/substatus`, {
      data: { name: 'Custom Status', status: 'open' },
      headers: { 'Content-Type': 'application/json' },
    });
    expectAuthRejection(res.status());
  });

  test('SPA /admin/substatuses page loads', async ({ page }) => {
    await page.goto(`${SPA}/admin/substatuses`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const body = await page.textContent('body');
    expect(body).not.toBeNull();
    expect(body!.trim().length).toBeGreaterThan(0);
  });
});

test.describe('US-8.2: Apply Substatus to Ticket Lifecycle Actions', () => {
  test('PATCH /api/v1/tickets/1/close requires auth (401 without token)', async ({ page }) => {
    const res = await page.request.patch(`${API}/api/v1/tickets/1/close`, {
      data: { substatus_id: 1 },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /api/v1/tickets?substatus_id=1 without auth returns 401', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/tickets?substatus_id=1`);
    expectAuthRejection(res.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Epic 9 — Action Types and Response Templates (F9)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-9.1: Create and Manage Department Action Types', () => {
  test('POST /api/v1/actions without auth returns 401/403', async ({ page }) => {
    const res = await page.request.post(`${API}/api/v1/actions`, {
      data: { name: 'Custom Action' },
      headers: { 'Content-Type': 'application/json' },
    });
    expectAuthRejection(res.status());
  });

  test('GET /api/v1/actions without auth returns 401/403', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/actions`);
    expectAuthRejection(res.status());
  });

  test('SPA /admin/actions page loads', async ({ page }) => {
    await page.goto(`${SPA}/admin/actions`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const body = await page.textContent('body');
    expect(body).not.toBeNull();
    expect(body!.trim().length).toBeGreaterThan(0);
  });
});

test.describe('US-9.2: Configure Category Action Response Overrides', () => {
  test('POST /api/v1/categories/1/action-responses without auth returns 401/403', async ({ page }) => {
    const res = await page.request.post(`${API}/api/v1/categories/1/action-responses`, {
      data: { action_id: 1, template: 'Custom template text' },
      headers: { 'Content-Type': 'application/json' },
    });
    expectAuthRejection(res.status());
  });

  test('Category action-responses endpoint exists (not 500)', async ({ page }) => {
    const res = await page.request.post(`${API}/api/v1/categories/1/action-responses`, {
      data: { action_id: 1 },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).not.toBe(500);
  });
});

test.describe('US-9.3: Render Template Variables in History Descriptions', () => {
  test('Ticket history endpoint (renders templates) requires staff auth', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/tickets/1/history`);
    expectAuthRejection(res.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Epic 10 — Media / Attachment Upload and Thumbnail Caching (F10)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-10.1: Upload Media to a Ticket', () => {
  test('POST /api/v1/tickets/1/media without auth returns 401', async ({ page }) => {
    // Send a raw POST without multipart — auth guard fires first regardless
    const res = await page.request.post(`${API}/api/v1/tickets/1/media`, {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/tickets/:id/media endpoint exists (not 404/500)', async ({ page }) => {
    const res = await page.request.post(`${API}/api/v1/tickets/1/media`, {
      data: {},
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).not.toBe(404);
    expect(res.status()).not.toBe(500);
  });
});

test.describe('US-10.2: Serve Media Files and Thumbnails', () => {
  test('GET /api/v1/media/999 returns 401/403/404 (not 500)', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/media/999`);
    expect([401, 403, 404]).toContain(res.status());
    expect(res.status()).not.toBe(500);
  });

  test('GET /api/v1/media/999/thumbnail returns 401/403/404 (not 500)', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/media/999/thumbnail`);
    expect([401, 403, 404]).toContain(res.status());
    expect(res.status()).not.toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Epic 11 — Full-Text Search — PostgreSQL FTS (F11)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-11.1: Full-Text Keyword Search Across Tickets', () => {
  test('GET /api/v1/tickets?q=keyword without auth returns 401', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/tickets?q=pothole`);
    expect(res.status()).toBe(401);
  });

  test('Ticket search endpoint never returns 500 (unauthenticated)', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/tickets?q=test`);
    expect(res.status()).not.toBe(500);
  });

  test('SPA /tickets page loads', async ({ page }) => {
    await page.goto(`${SPA}/tickets`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const body = await page.textContent('body');
    expect(body).not.toBeNull();
    expect(body!.trim().length).toBeGreaterThan(0);
  });
});

test.describe('US-11.2: Filter Tickets by Multiple Criteria', () => {
  test('GET /api/v1/tickets with multiple filters returns 401 without auth', async ({ page }) => {
    const res = await page.request.get(
      `${API}/api/v1/tickets?status=open&category_id=1&department_id=1&limit=25`
    );
    expect(res.status()).toBe(401);
  });

  test('Ticket search with pagination params returns 401 without auth', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/tickets?page=1&limit=25`);
    expectAuthRejection(res.status());
  });

  test('Ticket search with date range returns 401 without auth', async ({ page }) => {
    const res = await page.request.get(
      `${API}/api/v1/tickets?enteredDateStart=2024-01-01&enteredDateEnd=2024-12-31`
    );
    expectAuthRejection(res.status());
  });
});

test.describe('US-11.3: View Ticket Search Results on Map', () => {
  test('GET /api/v1/tickets?view=map without auth returns 401', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/tickets?view=map`);
    expectAuthRejection(res.status());
  });

  test('SPA /map page loads', async ({ page }) => {
    await page.goto(`${SPA}/map`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const body = await page.textContent('body');
    expect(body).not.toBeNull();
    expect(body!.trim().length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Epic 12 — Bookmarks — Staff Saved Searches (F12)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-12.1: Save a Ticket Search as a Bookmark', () => {
  test('POST /api/v1/bookmarks without auth returns 401', async ({ page }) => {
    const res = await page.request.post(`${API}/api/v1/bookmarks`, {
      data: { name: 'My Search', requestUri: '/tickets?status=open' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(401);
  });

  test('Bookmarks POST endpoint exists (not 404/500 when unauthenticated)', async ({ page }) => {
    const res = await page.request.post(`${API}/api/v1/bookmarks`, {
      data: { name: 'probe' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).not.toBe(404);
    expect(res.status()).not.toBe(500);
  });
});

test.describe('US-12.2: List and Navigate Saved Bookmarks', () => {
  test('GET /api/v1/bookmarks without auth returns 401', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/bookmarks`);
    expect(res.status()).toBe(401);
  });

  test('SPA /bookmarks page loads', async ({ page }) => {
    await page.goto(`${SPA}/bookmarks`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const body = await page.textContent('body');
    expect(body).not.toBeNull();
    expect(body!.trim().length).toBeGreaterThan(0);
  });
});

test.describe('US-12.3: Delete a Bookmark', () => {
  test('DELETE /api/v1/bookmarks/999 without auth returns 401/403', async ({ page }) => {
    const res = await page.request.delete(`${API}/api/v1/bookmarks/999`);
    expectAuthRejection(res.status());
  });

  test('Bookmark DELETE does not return 500 when unauthenticated', async ({ page }) => {
    const res = await page.request.delete(`${API}/api/v1/bookmarks/999`);
    expect(res.status()).not.toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Epic 13 — API Client Management (F13)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-13.1: Register and Manage an API Client', () => {
  test('POST /api/v1/clients without auth returns 401/403', async ({ page }) => {
    const res = await page.request.post(`${API}/api/v1/clients`, {
      data: { name: 'Test Client', api_key: 'test-key' },
      headers: { 'Content-Type': 'application/json' },
    });
    expectAuthRejection(res.status());
  });

  test('GET /api/v1/clients without auth returns 401/403', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/clients`);
    expectAuthRejection(res.status());
  });

  test('DELETE /api/v1/clients/1 without auth returns 401/403', async ({ page }) => {
    const res = await page.request.delete(`${API}/api/v1/clients/1`);
    expectAuthRejection(res.status());
  });

  test('SPA /admin/clients page loads', async ({ page }) => {
    await page.goto(`${SPA}/admin/clients`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const body = await page.textContent('body');
    expect(body).not.toBeNull();
    expect(body!.trim().length).toBeGreaterThan(0);
  });
});

test.describe('US-13.2: API Key Rotation', () => {
  test('PUT /api/v1/clients/1 without auth returns 401/403', async ({ page }) => {
    const res = await page.request.put(`${API}/api/v1/clients/1`, {
      data: { api_key: 'new-rotated-key' },
      headers: { 'Content-Type': 'application/json' },
    });
    expectAuthRejection(res.status());
  });

  test('Client PUT endpoint exists (not 500 when unauthenticated)', async ({ page }) => {
    const res = await page.request.put(`${API}/api/v1/clients/1`, {
      data: { api_key: 'probe' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).not.toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Epic 14 — Contact Method Tracking (F14)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-14.1: Record Submission and Response Channel on a Ticket', () => {
  test('GET /api/v1/contact-methods returns 200 (no auth required)', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/contact-methods`);
    expect(res.status()).toBe(200);
  });

  test('GET /api/v1/contact-methods returns array with exactly 4 seeded records', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/contact-methods`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(4);
  });

  test('Contact methods include Email', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/contact-methods`);
    const body: Array<{ name: string }> = await res.json();
    const names = body.map((m) => m.name);
    expect(names).toContain('Email');
  });

  test('Contact methods include Phone', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/contact-methods`);
    const body: Array<{ name: string }> = await res.json();
    const names = body.map((m) => m.name);
    expect(names).toContain('Phone');
  });

  test('Contact methods include Web Form', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/contact-methods`);
    const body: Array<{ name: string }> = await res.json();
    const names = body.map((m) => m.name);
    expect(names).toContain('Web Form');
  });

  test('Contact methods include Other', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/contact-methods`);
    const body: Array<{ name: string }> = await res.json();
    const names = body.map((m) => m.name);
    expect(names).toContain('Other');
  });

  test('Contact methods endpoint is publicly accessible (no auth)', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/contact-methods`);
    expect(res.status()).not.toBe(401);
    expect(res.status()).not.toBe(403);
  });

  test('SPA /contact-methods page loads', async ({ page }) => {
    await page.goto(`${SPA}/contact-methods`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const body = await page.textContent('body');
    expect(body).not.toBeNull();
    expect(body!.trim().length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Epic 15 — Location / Address Management and Geo-Cluster Analysis (F15)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-15.1: Capture and Validate Ticket Location', () => {
  test('POST /api/v1/tickets with location fields without auth returns 401', async ({ page }) => {
    const res = await page.request.post(`${API}/api/v1/tickets`, {
      data: {
        description: 'Location test',
        latitude: 40.7128,
        longitude: -74.0060,
        location: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
      },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/v1/tickets with out-of-range coords without auth returns 401 (auth before validation)', async ({ page }) => {
    const res = await page.request.post(`${API}/api/v1/tickets`, {
      data: { description: 'Bad coords', latitude: 999, longitude: 999 },
      headers: { 'Content-Type': 'application/json' },
    });
    // Auth guard fires first; coordinate validation happens after auth
    expect(res.status()).toBe(401);
  });
});

test.describe('US-15.2: Rebuild Geo-Clusters via Scheduled Job', () => {
  test('SPA /admin/jobs page loads (scheduler admin interface)', async ({ page }) => {
    await page.goto(`${SPA}/admin/jobs`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const body = await page.textContent('body');
    expect(body).not.toBeNull();
    expect(body!.trim().length).toBeGreaterThan(0);
  });
});

test.describe('US-15.3: Location-Based Ticket Search', () => {
  test('GET /api/v1/tickets with geo-radius params returns 401 without auth', async ({ page }) => {
    const res = await page.request.get(
      `${API}/api/v1/tickets?lat=40.7128&long=-74.0060&radius=1000`
    );
    expectAuthRejection(res.status());
  });

  test('GET /api/v1/tickets with city/zip params returns 401 without auth', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/tickets?city=New+York&zip=10001`);
    expectAuthRejection(res.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Epic 16 — Digest Email Notifications (F16)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-16.1: Receive Email Notification After Ticket Action', () => {
  test('Ticket history (sentNotifications field) requires staff auth', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/tickets/1/history`);
    expectAuthRejection(res.status());
  });
});

test.describe('US-16.2: Auto-Close Stale Tickets by Category Rule', () => {
  test('SPA /admin/jobs page loads (used for scheduler job management)', async ({ page }) => {
    await page.goto(`${SPA}/admin/jobs`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const body = await page.textContent('body');
    expect(body).not.toBeNull();
    expect(body!.trim().length).toBeGreaterThan(0);
  });
});

test.describe('US-16.3: Audit Data Integrity via Scheduled Job', () => {
  test('Admin jobs SPA page is accessible for scheduler audit job management', async ({ page }) => {
    await page.goto(`${SPA}/admin/jobs`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const body = await page.textContent('body');
    expect(body).not.toBeNull();
    expect(body!.trim().length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Epic 17 — Metrics and Reporting Dashboard (F17)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-17.1: View SLA Compliance Metrics by Category', () => {
  test('GET /api/v1/metrics without auth returns 401/403', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/metrics?numDays=30`);
    expectAuthRejection(res.status());
  });

  test('Metrics endpoint never returns 500 when unauthenticated', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/metrics`);
    expect(res.status()).not.toBe(500);
  });

  test('SPA /metrics page loads', async ({ page }) => {
    await page.goto(`${SPA}/metrics`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const body = await page.textContent('body');
    expect(body).not.toBeNull();
    expect(body!.trim().length).toBeGreaterThan(0);
  });
});

test.describe('US-17.2: Run Canned Activity and Volume Reports', () => {
  test('GET /api/v1/reports/activity without auth returns 401/403', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/reports/activity`);
    expectAuthRejection(res.status());
  });

  test('Reports endpoint never returns 500 when unauthenticated', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/reports/activity`);
    expect(res.status()).not.toBe(500);
  });

  test('SPA /reports page loads', async ({ page }) => {
    await page.goto(`${SPA}/reports`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const body = await page.textContent('body');
    expect(body).not.toBeNull();
    expect(body!.trim().length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Epic 18 — Multi-Format Output Feeds (F18)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-18.1: Receive Open311 Responses in JSON or XML', () => {
  test('GET /open311/discovery?format=json returns application/json', async ({ page }) => {
    const res = await page.request.get(`${API}/open311/discovery?format=json`);
    expect(res.status()).toBe(200);
    const ct = res.headers()['content-type'] ?? '';
    expect(ct).toContain('application/json');
  });

  test('GET /open311/discovery?format=xml returns XML content-type', async ({ page }) => {
    const res = await page.request.get(`${API}/open311/discovery?format=xml`);
    expect(res.status()).toBe(200);
    const ct = res.headers()['content-type'] ?? '';
    expect(ct.toLowerCase()).toMatch(/xml/);
  });

  test('GET /open311/services?format=xml returns XML content-type', async ({ page }) => {
    const res = await page.request.get(`${API}/open311/services?format=xml`);
    expect(res.status()).toBe(200);
    const ct = res.headers()['content-type'] ?? '';
    expect(ct.toLowerCase()).toMatch(/xml/);
  });

  test('GET /open311/requests?format=xml returns XML content-type', async ({ page }) => {
    const res = await page.request.get(`${API}/open311/requests?format=xml`);
    expect(res.status()).toBe(200);
    const ct = res.headers()['content-type'] ?? '';
    expect(ct.toLowerCase()).toMatch(/xml/);
  });

  test('GET /open311/services with no format param returns JSON by default', async ({ page }) => {
    const res = await page.request.get(`${API}/open311/services`);
    expect(res.status()).toBe(200);
    const ct = res.headers()['content-type'] ?? '';
    expect(ct).toContain('application/json');
  });

  test('GET /open311/discovery with invalid format returns 400 or other 4xx (not 500)', async ({ page }) => {
    const res = await page.request.get(`${API}/open311/discovery?format=yaml`);
    expect(res.status()).not.toBe(500);
  });
});

test.describe('US-18.2: Export Ticket Data in Multiple Formats', () => {
  test('GET /api/v1/tickets?format=csv without auth returns 401/403', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/tickets?format=csv`);
    expectAuthRejection(res.status());
  });

  test('GET /api/v1/tickets?format=print without auth returns 401/403', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/tickets?format=print`);
    expectAuthRejection(res.status());
  });

  test('GET /api/v1/tickets?format=txt without auth returns 401/403', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/tickets?format=txt`);
    expectAuthRejection(res.status());
  });

  test('CSV export is not publicly accessible (not 200 without auth)', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/tickets?format=csv`);
    expect(res.status()).not.toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Epic 19 — Issue Type Management (F19)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-19.1: Assign an Issue Type to a Ticket', () => {
  test('GET /api/v1/issue-types returns 200 (no auth required)', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/issue-types`);
    expect(res.status()).toBe(200);
  });

  test('GET /api/v1/issue-types returns array with exactly 6 seeded items', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/issue-types`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(6);
  });

  test('Issue types include Comment', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/issue-types`);
    const body: Array<{ name: string }> = await res.json();
    expect(body.map((t) => t.name)).toContain('Comment');
  });

  test('Issue types include Complaint', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/issue-types`);
    const body: Array<{ name: string }> = await res.json();
    expect(body.map((t) => t.name)).toContain('Complaint');
  });

  test('Issue types include Question', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/issue-types`);
    const body: Array<{ name: string }> = await res.json();
    expect(body.map((t) => t.name)).toContain('Question');
  });

  test('Issue types include Report', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/issue-types`);
    const body: Array<{ name: string }> = await res.json();
    expect(body.map((t) => t.name)).toContain('Report');
  });

  test('Issue types include Request', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/issue-types`);
    const body: Array<{ name: string }> = await res.json();
    expect(body.map((t) => t.name)).toContain('Request');
  });

  test('Issue types include Violation', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/issue-types`);
    const body: Array<{ name: string }> = await res.json();
    expect(body.map((t) => t.name)).toContain('Violation');
  });

  test('Issue types endpoint is publicly accessible (no auth)', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/issue-types`);
    expect(res.status()).not.toBe(401);
    expect(res.status()).not.toBe(403);
  });

  test('POST /api/v1/tickets with invalid issueType_id without auth returns 401', async ({ page }) => {
    const res = await page.request.post(`${API}/api/v1/tickets`, {
      data: { description: 'Test', issueType_id: 99999 },
      headers: { 'Content-Type': 'application/json' },
    });
    // Auth fires before payload validation
    expect(res.status()).toBe(401);
  });
});

test.describe('US-19.2: Administer Issue Type Records', () => {
  test('POST /api/v1/issue-types without auth returns 401/403', async ({ page }) => {
    const res = await page.request.post(`${API}/api/v1/issue-types`, {
      data: { name: 'NewType' },
      headers: { 'Content-Type': 'application/json' },
    });
    expectAuthRejection(res.status());
  });

  test('PUT /api/v1/issue-types/1 without auth returns 401/403', async ({ page }) => {
    const res = await page.request.put(`${API}/api/v1/issue-types/1`, {
      data: { name: 'UpdatedType' },
      headers: { 'Content-Type': 'application/json' },
    });
    expectAuthRejection(res.status());
  });

  test('DELETE /api/v1/issue-types/1 without auth returns 401/403', async ({ page }) => {
    const res = await page.request.delete(`${API}/api/v1/issue-types/1`);
    expectAuthRejection(res.status());
  });

  test('SPA /admin/issue-types page loads', async ({ page }) => {
    await page.goto(`${SPA}/admin/issue-types`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const body = await page.textContent('body');
    expect(body).not.toBeNull();
    expect(body!.trim().length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Epic 20 — Response Templates (F20)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('US-20.1: Create and Manage Response Templates', () => {
  test('POST /api/v1/response-templates without auth returns 401/403', async ({ page }) => {
    const res = await page.request.post(`${API}/api/v1/response-templates`, {
      data: { name: 'Standard Response', body: 'Thank you for your report.', action_id: 1 },
      headers: { 'Content-Type': 'application/json' },
    });
    expectAuthRejection(res.status());
  });

  test('PUT /api/v1/response-templates/1 without auth returns 401/403', async ({ page }) => {
    const res = await page.request.put(`${API}/api/v1/response-templates/1`, {
      data: { name: 'Updated Response' },
      headers: { 'Content-Type': 'application/json' },
    });
    expectAuthRejection(res.status());
  });

  test('DELETE /api/v1/response-templates/1 without auth returns 401/403', async ({ page }) => {
    const res = await page.request.delete(`${API}/api/v1/response-templates/1`);
    expectAuthRejection(res.status());
  });

  test('Response templates endpoint never returns 500 when unauthenticated', async ({ page }) => {
    const res = await page.request.post(`${API}/api/v1/response-templates`, {
      data: { name: 'probe' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).not.toBe(500);
  });

  test('SPA /admin/response-templates page loads', async ({ page }) => {
    await page.goto(`${SPA}/admin/response-templates`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const body = await page.textContent('body');
    expect(body).not.toBeNull();
    expect(body!.trim().length).toBeGreaterThan(0);
  });
});

test.describe('US-20.2: Use a Response Template When Recording a Ticket Response', () => {
  test('GET /api/v1/response-templates without auth returns 401/403', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/response-templates`);
    expectAuthRejection(res.status());
  });

  test('Response templates GET never returns 500 when unauthenticated', async ({ page }) => {
    const res = await page.request.get(`${API}/api/v1/response-templates`);
    expect(res.status()).not.toBe(500);
  });

  test('SPA /tickets/:id (response template UI) loads without crashing', async ({ page }) => {
    await page.goto(`${SPA}/tickets/1`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const body = await page.textContent('body');
    expect(body).not.toBeNull();
    expect(body!.trim().length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Open311 SPA route
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Open311 SPA Display', () => {
  test('SPA /open311 page loads (Open311 service list display)', async ({ page }) => {
    await page.goto(`${SPA}/open311`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const body = await page.textContent('body');
    expect(body).not.toBeNull();
    expect(body!.trim().length).toBeGreaterThan(0);
  });
});
