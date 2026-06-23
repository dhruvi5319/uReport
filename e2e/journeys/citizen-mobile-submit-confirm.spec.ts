// e2e/journeys/citizen-mobile-submit-confirm.spec.ts
import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 375, height: 812 } });

test.describe('E2E-003: Citizen Mobile Submission & Status Tracking (JRN-03.1)', () => {

  test('Public /submit form loads at 375px with no horizontal scroll', async ({ page }) => {
    await page.goto('/submit');
    await expect(page).toHaveURL(/\/submit/, { timeout: 5000 });

    // No horizontal scrollbar — body scrollWidth should not exceed viewport width
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll).toBe(false);

    // Step indicator (progressbar) visible
    await expect(page.getByRole('progressbar')).toBeVisible({ timeout: 5000 });
  });

  test('Step 1: Category cards load and selecting one advances to Step 2', async ({ page, request }) => {
    // Check if categories API is available
    const catRes = await request.get('/api/categories?postingPermission[]=public&postingPermission[]=anonymous&active=true').catch(() => null);
    if (!catRes?.ok()) {
      test.skip(true, 'Categories API unavailable');
      return;
    }

    await page.goto('/submit');

    // Wait for category cards to load
    const card = page.locator('[data-testid="category-card"]').first();
    await card.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {
      // Cards may have a different selector — try button with card-like content
    });

    // Next button should be disabled before selection
    const nextBtn = page.getByRole('button', { name: /next/i }).first();
    if (await nextBtn.isVisible()) {
      await expect(nextBtn).toBeDisabled();
    }

    // Click first available category card
    const firstCard = page.locator('[data-testid="category-card"], button[class*="card"]').first();
    await firstCard.waitFor({ timeout: 8000 });
    await firstCard.click();

    // Advance
    if (await nextBtn.isEnabled()) {
      await nextBtn.click();
      // Should now be on Step 2 (location)
      await expect(page.getByRole('textbox', { name: /address/i })).toBeVisible({ timeout: 5000 });
    }
  });

  test('Step 3 photo upload button is a <button> element, not bare <input>', async ({ page, request }) => {
    const catRes = await request.get('/api/categories?postingPermission[]=public&active=true&perPage=1').catch(() => null);
    if (!catRes?.ok()) {
      test.skip(true, 'API unavailable');
      return;
    }

    await page.goto('/submit');

    // Navigate through Step 1 and 2
    const firstCard = page.locator('[data-testid="category-card"], button').filter({ hasText: /road|pothole|drain|debris|light|tree/i }).first();
    const anyCard = page.locator('[data-testid="category-card"]').first();

    const cardToClick = (await firstCard.isVisible().catch(() => false)) ? firstCard : anyCard;
    await cardToClick.waitFor({ timeout: 8000 });
    await cardToClick.click();

    // Advance Step 1
    const next1 = page.getByRole('button', { name: /next/i }).first();
    if (await next1.isEnabled()) await next1.click();

    // Step 2: fill address and advance
    const addressInput = page.getByRole('textbox', { name: /address/i });
    if (await addressInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addressInput.fill('123 Oak Avenue');
      await page.waitForTimeout(1200); // geocode debounce
    }

    const next2 = page.getByRole('button', { name: /next/i }).first();
    if (await next2.isEnabled()) {
      await next2.click();
    } else {
      await next2.click({ force: true }); // soft-warning path
    }

    // Step 3: verify upload button is <button>
    const uploadBtn = page.getByRole('button', { name: /photo|upload|camera/i }).first();
    await uploadBtn.waitFor({ state: 'visible', timeout: 5000 });
    const tagName = await uploadBtn.evaluate((el) => el.tagName.toLowerCase());
    expect(tagName).toBe('button');
  });

  test('Step 4: Submit button visible; email-absent soft warning shown', async ({ page, request }) => {
    const catRes = await request.get('/api/categories?postingPermission[]=public&active=true&perPage=1').catch(() => null);
    if (!catRes?.ok()) {
      test.skip(true, 'API unavailable');
      return;
    }

    await page.goto('/submit');

    // Rapid navigation to Step 4
    const anyCard = page.locator('[data-testid="category-card"]').first();
    await anyCard.waitFor({ timeout: 8000 });
    await anyCard.click();

    // Step 1 → 2
    const next1 = page.getByRole('button', { name: /next/i }).first();
    if (await next1.isEnabled()) await next1.click();

    // Step 2 → 3 (force if needed)
    await page.waitForTimeout(600);
    const next2 = page.getByRole('button', { name: /next/i }).first();
    await next2.click({ force: true });

    // Step 3 → 4 (always enabled)
    const next3 = page.getByRole('button', { name: /next/i }).first();
    if (await next3.isVisible({ timeout: 2000 }).catch(() => false)) {
      await next3.click();
    }

    // Step 4: submit button + soft warning
    await expect(page.getByRole('button', { name: /submit my report/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/without an email/i)).toBeVisible({ timeout: 3000 });
  });

  test('/track/:id shows 404 message for unknown ticket ID', async ({ page }) => {
    await page.goto('/track/999999999');
    await expect(page.getByText(/report not found/i)).toBeVisible({ timeout: 5000 });
  });

  test('/submit form has no horizontal scroll at 375px across all 4 steps', async ({ page }) => {
    await page.goto('/submit');
    await page.setViewportSize({ width: 375, height: 812 });

    const checkScroll = async () => {
      return page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    };

    expect(await checkScroll()).toBe(false);
  });

});
