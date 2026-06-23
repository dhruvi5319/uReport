import { test, expect } from '@playwright/test';

test.describe('Merge ticket dialog', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tickets/1'); // assumes ticket #1 exists and is open
  });

  test('merge action accessible from kebab menu in actions sidebar', async ({ page }) => {
    await page.getByRole('button', { name: /more actions/i }).click();
    await expect(page.getByRole('menuitem', { name: /merge ticket/i })).toBeVisible();
  });

  test('merge dialog opens with search step', async ({ page }) => {
    await page.getByRole('button', { name: /more actions/i }).click();
    await page.getByRole('menuitem', { name: /merge ticket/i }).click();
    await expect(page.getByRole('dialog', { name: /merge ticket/i })).toBeVisible();
    await expect(page.getByLabel(/search for a ticket/i)).toBeVisible();
  });

  test('dialog has accessible description', async ({ page }) => {
    await page.getByRole('button', { name: /more actions/i }).click();
    await page.getByRole('menuitem', { name: /merge ticket/i }).click();
    const dialog = page.getByRole('dialog', { name: /merge ticket/i });
    await expect(dialog).toBeVisible();
    // DialogDescription should be present
    await expect(dialog.getByText(/source ticket will be closed/i)).toBeVisible();
  });

  test('candidate list renders after dialog opens', async ({ page }) => {
    await page.getByRole('button', { name: /more actions/i }).click();
    await page.getByRole('menuitem', { name: /merge ticket/i }).click();
    // Either candidates loaded or empty state shown
    await expect(page.getByRole('listbox', { name: /merge target candidates/i })).toBeVisible();
  });

  test('cancel button closes dialog', async ({ page }) => {
    await page.getByRole('button', { name: /more actions/i }).click();
    await page.getByRole('menuitem', { name: /merge ticket/i }).click();
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('dialog', { name: /merge ticket/i })).not.toBeVisible();
  });
});
