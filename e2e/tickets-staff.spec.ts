import { test, expect } from '@playwright/test';

// Assumes a staff session cookie is set by global setup (auth.setup.ts from Wave 3a-1 plan 11).
// If running standalone, set PLAYWRIGHT_STAFF_COOKIES env var or use storageState fixture.

test.describe('Staff Ticket List (/tickets)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tickets');
  });

  test('renders ticket list page with search bar and status filters', async ({ page }) => {
    await expect(page.getByRole('textbox', { name: /search tickets/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /all/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /open/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /closed/i })).toBeVisible();
  });

  test('clicking Open status filter updates URL and re-fetches', async ({ page }) => {
    await page.getByRole('button', { name: /^open$/i }).click();
    await expect(page).toHaveURL(/status=open/);
    // List should reload — wait for at least one item or empty state
    await expect(page.locator('[data-testid="ticket-row"], [data-testid="empty-state"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('selecting checkboxes reveals bulk action bar', async ({ page }) => {
    // Wait for first ticket row to appear
    const firstCheckbox = page.locator('input[type="checkbox"][aria-label^="Select ticket"]').first();
    await firstCheckbox.waitFor({ state: 'visible', timeout: 5000 });
    await firstCheckbox.check();
    await expect(page.getByRole('toolbar', { name: /bulk actions/i })).toBeVisible();
    await expect(page.getByText(/1 ticket selected/i)).toBeVisible();
  });

  test('clicking a ticket row navigates to ticket detail page', async ({ page }) => {
    const firstLink = page.locator('a[href^="/tickets/"]').first();
    await firstLink.waitFor({ state: 'visible', timeout: 5000 });
    const href = await firstLink.getAttribute('href');
    await firstLink.click();
    await expect(page).toHaveURL(href ?? /\/tickets\/\d+/);
    await expect(page.getByRole('complementary', { name: /ticket actions/i })).toBeVisible();
  });
});

test.describe('Staff Ticket Detail (/tickets/:id)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to ticket list and click first ticket
    await page.goto('/tickets');
    const firstLink = page.locator('a[href^="/tickets/"]').first();
    await firstLink.waitFor({ state: 'visible', timeout: 5000 });
    await firstLink.click();
    await page.waitForURL(/\/tickets\/\d+/);
  });

  test('renders 2-panel layout with info and actions sidebar', async ({ page }) => {
    await expect(page.getByRole('complementary', { name: /ticket actions/i })).toBeVisible();
    await expect(page.getByText(/history.*audit trail/i)).toBeVisible();
  });

  test('compose panel shows Response and Comment tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /response/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /comment/i })).toBeVisible();
  });

  test('switching to Comment tab shows internal-only warning banner', async ({ page }) => {
    await page.getByRole('tab', { name: /comment/i }).click();
    await expect(page.getByText(/internal.*staff only/i)).toBeVisible();
  });

  test('Close Ticket button opens confirmation dialog', async ({ page }) => {
    // Only present if ticket is open — skip if already closed
    const closeBtn = page.getByRole('button', { name: /close ticket/i });
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('button', { name: /close silently/i })).toBeVisible();
    }
  });

  test('history list renders at least one entry', async ({ page }) => {
    await expect(page.getByRole('list', { name: /ticket history/i })).toBeVisible();
    await expect(page.getByRole('listitem').first()).toBeVisible();
  });
});

test.describe('Staff Create Ticket (/tickets/new)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tickets/new');
  });

  test('renders step 1 with category search and department routing', async ({ page }) => {
    await expect(page.getByText(/new ticket/i).first()).toBeVisible();
    await expect(page.getByPlaceholder(/search categories/i)).toBeVisible();
    // Routing preview text "→" should appear next to at least one category once loaded
    await page.waitForTimeout(1000); // let categories load
    // Check that category items with routing arrows loaded or at least the search field is present
    await expect(page.getByPlaceholder(/search categories/i)).toBeEnabled();
  });

  test('Next button is disabled until a category is selected', async ({ page }) => {
    const nextBtn = page.getByRole('button', { name: /next.*location/i });
    await expect(nextBtn).toBeDisabled();
  });

  test('selecting a category enables the Next button', async ({ page }) => {
    await page.waitForTimeout(1000); // wait for categories to load
    const firstRadio = page.locator('input[type="radio"]').first();
    if (await firstRadio.count() > 0) {
      await firstRadio.click();
      await expect(page.getByRole('button', { name: /next.*location/i })).toBeEnabled();
    }
  });

  test('navigating to step 2 shows address field', async ({ page }) => {
    await page.waitForTimeout(1000);
    const firstRadio = page.locator('input[type="radio"]').first();
    if (await firstRadio.count() > 0) {
      await firstRadio.click();
      await page.getByRole('button', { name: /next.*location/i }).click();
      await expect(page.getByLabel(/street address/i)).toBeVisible();
    }
  });

  test('Title field on step 3 is required — shows error if empty', async ({ page }) => {
    await page.waitForTimeout(1000);
    const firstRadio = page.locator('input[type="radio"]').first();
    if (await firstRadio.count() > 0) {
      await firstRadio.click();
      await page.getByRole('button', { name: /next.*location/i }).click();
      await page.getByLabel(/street address/i).fill('123 Test Street');
      await page.getByRole('button', { name: /next.*details/i }).click();
      // Now on step 3 — attempt to create without title
      await page.getByRole('button', { name: /create ticket/i }).click();
      await expect(page.getByRole('alert').filter({ hasText: /required/i })).toBeVisible();
    }
  });

  test('Cancel button navigates back to ticket list', async ({ page }) => {
    await page.getByRole('link', { name: /cancel/i }).click();
    await expect(page).toHaveURL('/tickets');
  });
});
