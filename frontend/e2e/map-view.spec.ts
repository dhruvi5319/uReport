// frontend/e2e/map-view.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Map View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/map');
  });

  test('map container renders with aria-label', async ({ page }) => {
    // Wait for Leaflet to mount (dynamic import — may take a moment)
    const mapEl = page.locator('[aria-label="Ticket location map"]');
    await expect(mapEl).toBeVisible({ timeout: 10000 });
  });

  test('List View button navigates back to /tickets', async ({ page }) => {
    await page.getByRole('link', { name: /list view/i }).click();
    await expect(page).toHaveURL(/\/tickets/);
  });

  test('map loads without crashing when cluster API returns empty array', async ({ page }) => {
    await page.route('**/api/tickets/clusters*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], meta: {}, errors: [] }),
      }),
    );
    await page.reload();
    // Page should still render the map container — not an error page
    await expect(page.locator('[aria-label="Ticket location map"]')).toBeVisible({ timeout: 10000 });
  });

  test('error banner shown when cluster API returns 500', async ({ page }) => {
    await page.route('**/api/tickets/clusters*', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ data: null, meta: {}, errors: [{ code: 'SERVER_ERROR' }] }),
      }),
    );
    await page.reload();
    await expect(page.getByRole('alert')).toContainText(/map data temporarily unavailable/i);
  });

  test('navigating to /map from /tickets preserves filter params', async ({ page }) => {
    await page.goto('/tickets?status=open&departmentId=1');
    await page.getByRole('link', { name: /map view/i }).click();
    await expect(page).toHaveURL(/\/map.*status=open/);
  });
});
