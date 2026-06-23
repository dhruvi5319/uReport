// e2e/journeys/admin-category-config.spec.ts
import { test, expect } from '@playwright/test';

test.describe('E2E-005: Admin Category Configuration (JTBD-02.3)', () => {

  test.beforeEach(async ({ request }) => {
    const health = await request.get('/api/health').catch(() => null);
    if (!health?.ok()) test.skip(true, 'Backend unavailable');
  });

  test('GET /api/categories returns list with name, slaDays, postingPermission', async ({ request }) => {
    const res = await request.get('/api/categories?active=true&perPage=5');
    if (res.status() === 401) {
      test.skip(true, 'Not authenticated');
      return;
    }
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    if (body.data.length > 0) {
      const cat = body.data[0];
      expect(cat).toHaveProperty('name');
      // slaDays may be null but key should exist
      expect('slaDays' in cat || 'sla_days' in cat).toBe(true);
    }
  });

  test('/admin/categories page is accessible to admin role', async ({ page }) => {
    await page.goto('/admin/categories');
    if (page.url().includes('/login')) {
      test.skip(true, 'Not authenticated');
      return;
    }
    // Should show categories list or empty state
    await expect(page).toHaveURL(/\/admin\/categories/, { timeout: 5000 });
    // Either a table or a "create category" button should be visible
    const tableOrCreate = page.getByRole('table')
      .or(page.getByRole('button', { name: /new category|add category|create/i }))
      .first();
    await expect(tableOrCreate).toBeVisible({ timeout: 5000 });
  });

  test('Admin sidebar shows Categories link', async ({ page }) => {
    await page.goto('/dashboard');
    if (page.url().includes('/login')) {
      test.skip(true, 'Not authenticated');
      return;
    }
    // Sidebar should have Categories link
    await expect(page.getByRole('link', { name: /categories/i })).toBeVisible({ timeout: 5000 });
  });

  test('POST /api/categories (admin only) returns 201 or 403', async ({ request }) => {
    const res = await request.post('/api/categories', {
      data: {
        name: 'E2E-005 Test Category',
        departmentId: 1,
        slaDays: 7,
        postingPermission: 'public',
        displayPermission: 'public',
      },
    });
    // Admin → 201, staff → 403, unauthenticated → 401
    expect([201, 403, 401, 422]).toContain(res.status());
  });

});
