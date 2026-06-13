import { test, expect } from '@playwright/test';
import { E2E_USERNAME, loginViaApi } from './helpers';

test.describe('Users listing', () => {
	test.beforeEach(async ({ context, request, baseURL }) => {
		await loginViaApi(context, request, baseURL!);
	});

	test('renders the users table with the seeded admin user', async ({ page }) => {
		await page.goto('/users');

		await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible();
		await expect(page.getByText(E2E_USERNAME!).first()).toBeVisible();
	});

	test('search box filters and updates the URL', async ({ page }) => {
		await page.goto('/users');

		const term = 'testadmin';
		await page.getByPlaceholder(/Search/i).fill(term);

		await page.waitForURL(new RegExp(`search=${term}`), { timeout: 5_000 });
		await expect(page.getByText(/testadmin@example\.com/i).first()).toBeVisible();
	});

	test('"Create User" action navigates to the new-user form', async ({ page }) => {
		await page.goto('/users');

		await page.getByRole('link', { name: /Create/i }).click();
		await expect(page).toHaveURL(/\/users\/add\/new/);
	});
});
