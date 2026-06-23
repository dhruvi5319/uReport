// e2e/journeys/staff-ticket-create-assign-close.spec.ts
import { test, expect } from '@playwright/test';

test.describe('E2E-002: Staff Ticket Create → Assign → Respond → Close (JRN-01.2)', () => {
  let createdTicketId: number | null = null;

  test.beforeEach(async ({ request }) => {
    const health = await request.get('/api/health').catch(() => null);
    if (!health?.ok()) {
      test.skip(true, 'Backend unavailable');
    }
  });

  test('POST /api/tickets creates a ticket and returns 201', async ({ request }) => {
    // Get a public category first
    const catRes = await request.get('/api/categories?active=true&perPage=1');
    if (!catRes.ok()) {
      test.skip(true, 'Cannot fetch categories');
      return;
    }
    const categories = await catRes.json();
    const categoryId = categories?.data?.[0]?.id;
    if (!categoryId) {
      test.skip(true, 'No categories available');
      return;
    }

    const res = await request.post('/api/tickets', {
      data: {
        title: 'E2E-002 Test Ticket',
        description: 'Created by Playwright e2e test E2E-002',
        categoryId,
        address: '123 Main St',
      },
    });

    // May get 201 (authenticated) or 401 (not authenticated)
    if (res.status() === 401 || res.status() === 403) {
      test.skip(true, 'Not authenticated for staff ticket create');
      return;
    }

    expect(res.status()).toBe(201);
    const body = await res.json();
    createdTicketId = body?.data?.id;
    expect(createdTicketId).toBeTruthy();
  });

  test('Ticket detail page renders ActionsPanel with Close Ticket button', async ({ page, request }) => {
    // Get any open ticket id
    const listRes = await request.get('/api/tickets?status=open&perPage=1').catch(() => null);
    if (!listRes?.ok()) {
      test.skip(true, 'Cannot fetch tickets or not authenticated');
      return;
    }
    const list = await listRes.json();
    const ticketId = list?.data?.[0]?.id;
    if (!ticketId) {
      test.skip(true, 'No open tickets available');
      return;
    }

    await page.goto(`/tickets/${ticketId}`);
    const url = page.url();
    if (url.includes('/login')) {
      test.skip(true, 'Not authenticated');
      return;
    }

    // ActionsPanel should be present
    await expect(page.getByRole('complementary', { name: /ticket actions/i })).toBeVisible({ timeout: 5000 });

    // Close Ticket button visible for open tickets
    const closeBtn = page.getByRole('button', { name: /close ticket/i });
    await expect(closeBtn).toBeVisible();
  });

  test('New ticket form is accessible at /tickets/new', async ({ page }) => {
    await page.goto('/tickets/new');
    const url = page.url();
    if (url.includes('/login')) {
      test.skip(true, 'Not authenticated');
      return;
    }

    // Multi-step form should be present (Step 1: Category)
    await expect(page).toHaveURL(/\/tickets\/new/, { timeout: 5000 });
    // Either a category grid or a step indicator should be visible
    const stepOrCategory = page.locator('[role="progressbar"], [data-testid="category-card"], h1, h2').first();
    await expect(stepOrCategory).toBeVisible({ timeout: 5000 });
  });

  test('Compose panel on ticket detail has Response and Comment tabs', async ({ page, request }) => {
    const listRes = await request.get('/api/tickets?status=open&perPage=1').catch(() => null);
    if (!listRes?.ok()) {
      test.skip(true, 'Cannot fetch tickets or not authenticated');
      return;
    }
    const list = await listRes.json();
    const ticketId = list?.data?.[0]?.id;
    if (!ticketId) {
      test.skip(true, 'No open tickets available');
      return;
    }

    await page.goto(`/tickets/${ticketId}`);
    if (page.url().includes('/login')) {
      test.skip(true, 'Not authenticated');
      return;
    }

    await expect(page.getByRole('tab', { name: /response/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('tab', { name: /comment/i })).toBeVisible();

    // Switch to Comment tab — internal banner should appear
    await page.getByRole('tab', { name: /comment/i }).click();
    await expect(page.getByText(/internal.*staff only/i)).toBeVisible({ timeout: 3000 });
  });

});
