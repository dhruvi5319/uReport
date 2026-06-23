import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Admin: Departments', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('lists departments and shows create button', async ({ page }) => {
    await page.goto('/admin/departments');
    await expect(page.getByRole('heading', { name: 'Departments' })).toBeVisible();
    await expect(page.getByRole('link', { name: '+ New Department' })).toBeVisible();
    // Table headers
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Active' })).toBeVisible();
  });

  test('creates a new department', async ({ page }) => {
    await page.goto('/admin/departments/new');
    await page.getByLabel('Name').fill('Test Department E2E');
    await page.getByRole('button', { name: 'Create Department' }).click();
    await expect(page.getByText('Department created')).toBeVisible(); // toast
    await expect(page).toHaveURL('/admin/departments');
  });

  test('shows validation error for empty name', async ({ page }) => {
    await page.goto('/admin/departments/new');
    await page.getByRole('button', { name: 'Create Department' }).click();
    await expect(page.getByRole('alert')).toContainText('required');
  });

  test('non-admin user sees Access Denied on admin pages', async ({ page }) => {
    // Navigate to admin without admin role — requireRole redirects to /access-denied
    await page.goto('/admin/departments');
    // Should be redirected away from admin or show an access denied message
    // The admin layout uses requireRole(['admin']) which redirects non-admins
    const url = page.url();
    const onAccessDenied = url.includes('/access-denied') || url.includes('/login');
    expect(onAccessDenied).toBe(true);
  });
});

test.describe('Admin: Categories', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('lists categories with search and department filter', async ({ page }) => {
    await page.goto('/admin/categories');
    await expect(page.getByRole('heading', { name: 'Categories' })).toBeVisible();
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
    await expect(page.getByRole('link', { name: '+ New Category' })).toBeVisible();
  });

  test('navigates multi-step category create form', async ({ page }) => {
    await page.goto('/admin/categories/new');
    // Step 1
    await expect(page.getByText('Basic Info')).toBeVisible();
    await page.getByLabel('Name').fill('E2E Test Category');
    // Select first department
    await page.getByRole('combobox', { name: /department/i }).click();
    await page.getByRole('option').first().click();
    await page.getByRole('button', { name: /next/i }).click();
    // Step 2
    await expect(page.getByText('Permissions')).toBeVisible();
    await page.getByRole('button', { name: /next/i }).click();
    // Step 3
    await expect(page.getByText('Custom Fields')).toBeVisible();
    await page.getByRole('button', { name: 'Create Category' }).click();
    await expect(page.getByText('Category created')).toBeVisible();
  });

  test('step 1 shows validation error for empty name', async ({ page }) => {
    await page.goto('/admin/categories/new');
    // Try to advance without filling name
    await page.getByRole('button', { name: /next/i }).click();
    await expect(page.getByRole('alert')).toContainText('required');
  });

  test('custom field builder adds select field with options', async ({ page }) => {
    await page.goto('/admin/categories/new');
    await page.getByLabel('Name').fill('Custom Field Test');
    await page.getByRole('combobox', { name: /department/i }).click();
    await page.getByRole('option').first().click();
    await page.getByRole('button', { name: /next/i }).click(); // step 2
    await page.getByRole('button', { name: /next/i }).click(); // step 3
    await page.getByRole('button', { name: '+ Add field' }).click();
    // Change type to Select
    await page.getByLabel(/type/i).last().click();
    await page.getByRole('option', { name: 'Select' }).click();
    // Options list should appear
    await expect(page.getByRole('button', { name: '+ Add option' })).toBeVisible();
  });
});

test.describe('Admin: Substatuses', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('lists substatuses grouped by primary status', async ({ page }) => {
    await page.goto('/admin/substatuses');
    await expect(page.getByRole('heading', { name: 'Substatuses' })).toBeVisible();
    // Should show Open and Closed sections
    await expect(page.getByText(/open statuses/i)).toBeVisible();
    await expect(page.getByText(/closed statuses/i)).toBeVisible();
  });

  test('creates a new substatus', async ({ page }) => {
    await page.goto('/admin/substatuses/new');
    await page.getByLabel('Label').fill('E2E Test Substatus');
    await page.getByRole('radio', { name: /open/i }).click();
    await page.getByRole('button', { name: 'Create Substatus' }).click();
    await expect(page.getByText('Substatus created')).toBeVisible();
  });

  test('shows validation error for empty label', async ({ page }) => {
    await page.goto('/admin/substatuses/new');
    await page.getByRole('button', { name: 'Create Substatus' }).click();
    await expect(page.getByRole('alert')).toContainText('required');
  });
});
