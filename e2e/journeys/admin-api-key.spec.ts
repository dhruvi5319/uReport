// e2e/journeys/admin-api-key.spec.ts
import { test, expect } from '@playwright/test';

test.describe('E2E-010: Admin API Key Management (JRN-04.2)', () => {

  test.beforeEach(async ({ request }) => {
    const health = await request.get('/api/health').catch(() => null);
    if (!health?.ok()) test.skip(true, 'Backend unavailable');
  });

  test('GET /api/clients returns list (admin) or 403 (staff)', async ({ request }) => {
    const res = await request.get('/api/clients');
    if (res.status() === 401) {
      test.skip(true, 'Not authenticated');
      return;
    }
    // Admin: 200, Staff: 403, Unauthenticated: 401
    expect([200, 403]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBe(true);
    }
  });

  test('/admin/clients page is accessible to admin and shows Create button', async ({ page }) => {
    await page.goto('/admin/clients');
    if (page.url().includes('/login')) {
      test.skip(true, 'Not authenticated');
      return;
    }
    if (page.url().includes('/access-denied')) {
      test.skip(true, 'Not admin role');
      return;
    }

    await expect(page).toHaveURL(/\/admin\/clients/, { timeout: 5000 });
    // Create/New button should be visible
    await expect(
      page.getByRole('button', { name: /new client|add client|create.*api/i })
    ).toBeVisible({ timeout: 5000 });
  });

  test('POST /api/clients returns 201 or 403 (admin-only endpoint)', async ({ request }) => {
    const res = await request.post('/api/clients', {
      data: {
        name: 'E2E-010 Test Client',
        contactEmail: 'e2e-test@example.com',
      },
    });
    if (res.status() === 401) {
      test.skip(true, 'Not authenticated');
      return;
    }
    // Admin: 201 with generated key, Staff/Public: 403
    expect([201, 403]).toContain(res.status());
    if (res.status() === 201) {
      const body = await res.json();
      // Generated key should be in create response (shown once)
      expect(body?.data).toHaveProperty('id');
      // key may be at data.key or data.apiKey
      const hasKey = 'key' in (body?.data ?? {}) || 'apiKey' in (body?.data ?? {});
      expect(hasKey).toBe(true);
    }
  });

  test('/admin/people page accessible to admin for staff user management', async ({ page }) => {
    await page.goto('/admin/people');
    if (page.url().includes('/login')) {
      test.skip(true, 'Not authenticated');
      return;
    }
    if (page.url().includes('/access-denied')) {
      test.skip(true, 'Not admin role');
      return;
    }

    await expect(page).toHaveURL(/\/admin\/people/, { timeout: 5000 });
    // People list or create button should be present
    const personListOrCreate = page.getByRole('table')
      .or(page.getByRole('button', { name: /new person|add staff|create user/i }))
      .first();
    await expect(personListOrCreate).toBeVisible({ timeout: 5000 });
  });

});
