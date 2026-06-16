import { test, expect } from '@playwright/test';
import { loginViaApi } from './helpers';

test.describe('Tests listing', () => {
	test.beforeEach(async ({ context, request, baseURL }) => {
		await loginViaApi(context, request, baseURL!);
	});

	test('renders the test session listing page', async ({ page }) => {
		await page.goto('/tests/test-session');

		await expect(page.getByRole('heading', { name: 'Tests', exact: true })).toBeVisible();
	});

	test('shows a Create action for users with create_test permission', async ({ page }) => {
		await page.goto('/tests/test-session');

		// Header has "Create Manually" (when test templates are readable) or "Create New Test"
		const createAction = page.getByRole('link', { name: /Create (Manually|New Test)/i }).first();
		await expect(createAction).toBeVisible();
	});

	test('renders the test template listing page', async ({ page }) => {
		await page.goto('/tests/test-template');

		await expect(page.getByRole('heading', { name: 'Test Templates', exact: true })).toBeVisible();
	});
});
