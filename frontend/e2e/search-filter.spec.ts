// frontend/e2e/search-filter.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Search & Filter UI', () => {
  test.beforeEach(async ({ page }) => {
    // Assumes test user is logged in (Wave 3a auth fixtures should set cookie)
    await page.goto('/tickets');
  });

  test('search bar is visible and accepts input', async ({ page }) => {
    const searchInput = page.getByRole('searchbox', { name: /search tickets/i });
    await expect(searchInput).toBeVisible();
    await searchInput.fill('pothole');
    // URL should update with q=pothole
    await expect(page).toHaveURL(/q=pothole/);
  });

  test('filter panel renders status radio buttons', async ({ page }) => {
    await expect(page.getByRole('radio', { name: /^open$/i })).toBeVisible();
    await expect(page.getByRole('radio', { name: /^closed$/i })).toBeVisible();
    await expect(page.getByRole('radio', { name: /^all$/i })).toBeVisible();
  });

  test('selecting Open status updates URL and shows results', async ({ page }) => {
    await page.getByRole('radio', { name: /^open$/i }).click();
    await expect(page).toHaveURL(/status=open/);
    // Results list or empty state should appear (not crash)
    await expect(page.getByRole('list').or(page.getByRole('status'))).toBeVisible({ timeout: 5000 });
  });

  test('Export CSV button visible for staff role', async ({ page }) => {
    // Assumes test session has staff role
    const exportBtn = page.getByRole('button', { name: /export csv/i });
    await expect(exportBtn).toBeVisible();
  });

  test('Map View button navigates to /map', async ({ page }) => {
    await page.getByRole('link', { name: /map view/i }).click();
    await expect(page).toHaveURL(/\/map/);
  });

  test('Solr unavailable shows banner not crash', async ({ page }) => {
    // Mock the API to return 503
    await page.route('**/api/tickets*', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ data: null, meta: {}, errors: [{ field: null, code: 'SEARCH_UNAVAILABLE', message: 'Solr unavailable' }] }),
      }),
    );
    await page.reload();
    await expect(page.getByRole('alert')).toContainText(/search temporarily unavailable/i);
  });

  test('Clear All resets filters and URL', async ({ page }) => {
    await page.getByRole('radio', { name: /^open$/i }).click();
    await expect(page).toHaveURL(/status=open/);
    await page.getByRole('button', { name: /clear all/i }).click();
    await expect(page).not.toHaveURL(/status=open/);
  });
});
