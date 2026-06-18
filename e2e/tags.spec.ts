import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers';

test.describe('Tags listing', () => {
	test.beforeEach(async ({ context, request, baseURL }) => {
		await loginViaApi(context, request, baseURL!);
	});

	test('renders the tag management page', async ({ page }) => {
		await page.goto('/tags');

		await expect(page.getByRole('heading', { name: 'Tag Management', exact: true })).toBeVisible();
	});

	test('shows a Create Tag Type action', async ({ page }) => {
		await page.goto('/tags');

		await expect(
			page.getByRole('button', { name: /Create Tag Type/i }).first()
		).toBeVisible();
	});
});
