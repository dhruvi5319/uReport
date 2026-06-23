import { test, expect } from '@playwright/test';

test.describe('Citizen Portal — /submit', () => {

  test('Step 1: loads public categories and advances on selection', async ({ page }) => {
    await page.goto('/submit');

    // Step indicator visible
    await expect(page.getByRole('progressbar')).toBeVisible();

    // Next button disabled until selection
    const nextBtn = page.getByRole('button', { name: /next/i });
    await expect(nextBtn).toBeDisabled();

    // Wait for categories to load
    const firstCard = page.locator('[data-testid="category-card"]').first();
    await firstCard.waitFor({ timeout: 5000 });
    await firstCard.click();

    // Next button enabled after selection
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();

    // Now on Step 2
    await expect(page.getByText(/where is the problem/i)).toBeVisible();
  });

  test('Step 2: address field and map present; Next disabled until location set', async ({ page }) => {
    await page.goto('/submit');
    // Advance to Step 2 by clicking first category
    await page.locator('[data-testid="category-card"]').first().click();
    await page.getByRole('button', { name: /next/i }).click();

    // Address input exists
    await expect(page.getByRole('textbox', { name: /address/i })).toBeVisible();

    // Map container exists with aria-label
    await expect(page.locator('[aria-label*="map"]')).toBeVisible();

    // Next disabled initially
    const nextBtn = page.getByRole('button', { name: /next/i });
    await expect(nextBtn).toBeDisabled();
  });

  test('Step 3: photo upload button is a button element (not bare input)', async ({ page }) => {
    await page.goto('/submit');
    // Navigate through steps 1 and 2
    await page.locator('[data-testid="category-card"]').first().click();
    await page.getByRole('button', { name: /next/i }).click();

    // Enter address to enable Next on Step 2
    await page.getByRole('textbox', { name: /address/i }).fill('123 Main St');
    // Wait for geocode or soft warning (either is acceptable)
    await page.waitForTimeout(1200);
    const nextBtn2 = page.getByRole('button', { name: /next/i });
    // Force advance if enabled, or skip location confirmation (soft warning path)
    if (await nextBtn2.isEnabled()) {
      await nextBtn2.click();
    } else {
      // Fill address and explicitly click Next (soft-warning path still allows advancing)
      await page.getByRole('button', { name: /next/i }).click({ force: true });
    }

    // Photo upload button is a <button>
    const uploadBtn = page.getByRole('button', { name: /photo|upload/i });
    await expect(uploadBtn).toBeVisible();
    const tagName = await uploadBtn.evaluate(el => el.tagName.toLowerCase());
    expect(tagName).toBe('button');
  });

  test('Step 4: submit button present; soft warning when email is empty', async ({ page }) => {
    await page.goto('/submit');
    // Navigate to step 4 quickly using force-navigation via state
    // (simpler: go to /submit and use test-id navigation)
    await page.locator('[data-testid="category-card"]').first().click();
    await page.getByRole('button', { name: /next/i }).click();
    // Skip location (address not required to be confirmed for soft-warning path)
    await page.getByRole('textbox', { name: /address/i }).fill('Main St');
    await page.waitForTimeout(500);
    const next2 = page.getByRole('button', { name: /next/i });
    if (await next2.isEnabled()) await next2.click();
    // Step 3: Next is always enabled
    await page.getByRole('button', { name: /next/i }).click();

    // Step 4
    await expect(page.getByRole('button', { name: /submit my report/i })).toBeVisible();
    // Soft warning visible when email empty
    await expect(page.getByText(/without an email/i)).toBeVisible();
  });

  test('/track/:id — shows 404 message for unknown ticket', async ({ page }) => {
    await page.goto('/track/999999999');
    await expect(page.getByText(/report not found/i)).toBeVisible({ timeout: 5000 });
  });

  test('/track/:id — shows status card for a valid ticket', async ({ page, request }) => {
    // This test depends on a ticket existing. Skip gracefully if none found.
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
    const res = await request.get(`${apiBase}/api/tickets?perPage=1&status=open`);
    if (!res.ok()) {
      test.skip(true, 'API unavailable or no tickets for track test');
      return;
    }
    const body = await res.json();
    const ticketId = body?.data?.[0]?.id;
    if (!ticketId) {
      test.skip(true, 'No tickets available for track test');
      return;
    }

    await page.goto(`/track/${ticketId}`);
    await expect(page.getByText(new RegExp(`Report #${ticketId}`))).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('heading', { name: /track report/i })).toBeVisible();
  });

});
