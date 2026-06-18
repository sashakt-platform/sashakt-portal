import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers';

test.describe('Question bank listing', () => {
	test.beforeEach(async ({ context, request, baseURL }) => {
		await loginViaApi(context, request, baseURL!);
	});

	test('renders the question bank page', async ({ page }) => {
		await page.goto('/questionbank');

		await expect(page.getByRole('heading', { name: 'Question Bank', exact: true })).toBeVisible();
	});

	test('shows a Create Question action', async ({ page }) => {
		await page.goto('/questionbank');

		await expect(
			page.getByRole('link', { name: /Create Question/i }).first()
		).toBeVisible();
	});

	test('search box updates the URL', async ({ page }) => {
		await page.goto('/questionbank');

		const term = 'sample';
		await page.getByPlaceholder(/Search questions/i).fill(term);

		await page.waitForURL(new RegExp(`search=${term}`), { timeout: 5_000 });
	});

	test('Create Question link navigates to the new-question form', async ({ page }) => {
		await page.goto('/questionbank');

		await page.getByRole('link', { name: /Create Question/i }).first().click();
		await expect(page).toHaveURL(/\/questionbank\/single-question\/add\/new/);
	});
});
