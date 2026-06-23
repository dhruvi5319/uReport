import type { Page } from '@playwright/test';

/**
 * Log in as admin by navigating to /login and submitting the sign-in form.
 * Waits for redirect to /dashboard or /admin to confirm success.
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/login');
  // Click sign-in (assumes SSO / magic link / quick login button in dev environment)
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/(dashboard|admin)/, { timeout: 15000 });
}

/**
 * Log in as a non-admin staff user.
 * Used for testing access-denied guards.
 */
export async function loginAsStaff(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByRole('button', { name: /sign in as staff/i }).click();
  await page.waitForURL(/\/(dashboard|admin)/, { timeout: 15000 });
}
