import { test, expect } from '@playwright/test';

test.describe('API documentation page (/api/docs)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/api/docs');
  });

  test('page loads and renders Swagger UI container', async ({ page }) => {
    await expect(page.locator('#swagger-ui')).toBeVisible({ timeout: 10000 });
  });

  test('page title contains API Documentation', async ({ page }) => {
    await expect(page).toHaveTitle(/API Documentation/i);
  });

  test('main content area has accessible label', async ({ page }) => {
    await expect(page.locator('#swagger-ui[aria-label]')).toBeVisible();
  });
});
