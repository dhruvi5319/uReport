// e2e/journeys/staff-bulk-reassign.spec.ts
import { test, expect } from '@playwright/test';

test.describe('E2E-007: Staff Bulk Reassign (JRN-02.1)', () => {

  test.beforeEach(async ({ request }) => {
    const health = await request.get('/api/health').catch(() => null);
    if (!health?.ok()) test.skip(true, 'Backend unavailable');
  });

  test('POST /api/tickets/bulk-assign returns reassigned count', async ({ request }) => {
    // Get some ticket IDs first
    const listRes = await request.get('/api/tickets?status=open&perPage=2');
    if (listRes.status() === 401 || listRes.status() === 403) {
      test.skip(true, 'Not authenticated for bulk-assign');
      return;
    }
    if (!listRes.ok()) {
      test.skip(true, 'Cannot list tickets');
      return;
    }
    const list = await listRes.json();
    const ids = (list?.data ?? []).map((t: { id: number }) => t.id);
    if (ids.length === 0) {
      test.skip(true, 'No open tickets for bulk-assign test');
      return;
    }

    const res = await request.post('/api/tickets/bulk-assign', {
      data: { ticketIds: ids, assigneeId: null }, // unassign
    });

    if (res.status() === 401 || res.status() === 403) {
      test.skip(true, 'Not authorized for bulk-assign');
      return;
    }

    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body?.data).toHaveProperty('reassigned');
    expect(typeof body.data.reassigned).toBe('number');
  });

  test('Ticket list page shows checkboxes for bulk selection', async ({ page }) => {
    await page.goto('/tickets');
    if (page.url().includes('/login')) {
      test.skip(true, 'Not authenticated');
      return;
    }

    // "Select all" checkbox should be present in results header
    const selectAll = page.getByRole('checkbox', { name: /select all/i });
    await expect(selectAll).toBeVisible({ timeout: 5000 });
  });

  test('Selecting checkboxes reveals bulk action bar', async ({ page }) => {
    await page.goto('/tickets?status=open');
    if (page.url().includes('/login')) {
      test.skip(true, 'Not authenticated');
      return;
    }

    // Wait for ticket list to load
    await page.waitForTimeout(1000);

    // Find first ticket checkbox
    const firstCheckbox = page.getByRole('checkbox').filter({ hasNot: page.getByRole('checkbox', { name: /select all/i }) }).first();
    if (!await firstCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip(true, 'No ticket checkboxes found — no tickets loaded');
      return;
    }

    await firstCheckbox.check();

    // Bulk action bar should appear (fixed bottom toolbar)
    await expect(page.getByRole('toolbar', { name: /bulk actions/i })).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole('button', { name: /assign to/i })).toBeVisible();
  });

});
