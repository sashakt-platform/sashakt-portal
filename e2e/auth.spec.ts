import { test, expect } from '@playwright/test';
import { E2E_PASSWORD, E2E_USERNAME } from './helpers';

test.describe('Auth', () => {
	test('rejects invalid credentials', async ({ page }) => {
		await page.goto('/login');
		await page.getByLabel('Email').fill('does-not-exist@example.com');
		await page.getByLabel('Password').fill('definitely-wrong');
		await page.getByRole('button', { name: 'Login' }).click();

		// Should remain on the login page and not navigate away
		await expect(page).toHaveURL(/\/login/);
		await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
	});

	test('logs in and redirects away from /login', async ({ page }) => {
		await page.goto('/login');
		await page.getByLabel('Email').fill(E2E_USERNAME!);
		await page.getByLabel('Password').fill(E2E_PASSWORD!);
		await page.getByRole('button', { name: 'Login' }).click();

		await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 10_000 });
		await expect(page).not.toHaveURL(/\/login/);
	});

	test('logout clears the session and protects admin routes', async ({ page }) => {
		await page.goto('/login');
		await page.getByLabel('Email').fill(E2E_USERNAME!);
		await page.getByLabel('Password').fill(E2E_PASSWORD!);
		await page.getByRole('button', { name: 'Login' }).click();
		await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 10_000 });

		await page.goto('/logout');
		// /logout redirects to /login (or /:organization if cookie was set)
		await page.waitForLoadState('networkidle');

		// Hitting a protected route now should bounce to /login
		await page.goto('/users');
		await expect(page).toHaveURL(/\/login/);
	});
});
