import { test, expect } from '@playwright/test';

test.describe('Bookmark management', () => {
  test.beforeEach(async ({ page }) => {
    // Assumes staff session cookie is set by auth fixture or login helper
    await page.goto('/tickets');
  });

  test('shows bookmarks dropdown trigger', async ({ page }) => {
    await expect(page.getByRole('button', { name: /bookmarks/i })).toBeVisible();
  });

  test('opens dropdown and shows empty state or bookmark list', async ({ page }) => {
    await page.getByRole('button', { name: /bookmarks/i }).click();
    // Either empty state or at least one bookmark row visible
    const content = page.getByRole('menu');
    await expect(content).toBeVisible();
    // Save current filters option always present
    await expect(page.getByRole('menuitem', { name: /save current filters/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /manage bookmarks/i })).toBeVisible();
  });

  test('opens save bookmark dialog and validates empty name', async ({ page }) => {
    await page.getByRole('button', { name: /bookmarks/i }).click();
    await page.getByRole('menuitem', { name: /save current filters/i }).click();
    // Dialog should open
    await expect(page.getByRole('dialog', { name: /save current search/i })).toBeVisible();
    // Try to save without name
    await page.getByRole('button', { name: /save bookmark/i }).click();
    await expect(page.getByRole('alert')).toContainText(/required/i);
  });

  test('bookmark name input has accessible label', async ({ page }) => {
    await page.getByRole('button', { name: /bookmarks/i }).click();
    await page.getByRole('menuitem', { name: /save current filters/i }).click();
    await expect(page.getByLabel('Bookmark name')).toBeVisible();
  });

  test('manage bookmarks sheet opens from dropdown', async ({ page }) => {
    await page.getByRole('button', { name: /bookmarks/i }).click();
    await page.getByRole('menuitem', { name: /manage bookmarks/i }).click();
    await expect(page.getByRole('dialog', { name: /manage bookmarks/i })).toBeVisible();
  });
});
