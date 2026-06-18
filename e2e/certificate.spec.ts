import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers';

test.describe('Certificate listing', () => {
	test.beforeEach(async ({ context, request, baseURL }) => {
		await loginViaApi(context, request, baseURL!);
	});

	test('renders the certificates page', async ({ page }) => {
		await page.goto('/certificate');

		await expect(page.getByRole('heading', { name: 'Certificates', exact: true })).toBeVisible();
	});

	test('shows a Create Certificate action', async ({ page }) => {
		await page.goto('/certificate');

		await expect(
			page.getByRole('link', { name: /Create Certificate/i }).first()
		).toBeVisible();
	});

	test('Create Certificate link navigates to the new-certificate form', async ({ page }) => {
		await page.goto('/certificate');

		await page.getByRole('link', { name: /Create Certificate/i }).first().click();
		await expect(page).toHaveURL(/\/certificate\/add\/new/);
	});
});
