import { test, expect } from '@playwright/test';
import {
	E2E_EMAIL_PREFIX,
	apiCleanupTestUsers,
	apiCreateUser,
	apiDeleteUser,
	apiFindUserByEmail,
	loginViaApi,
	uniqueSuffix
} from './helpers';

test.describe('Users mutations', () => {
	test.beforeEach(async ({ context, request, baseURL }) => {
		await loginViaApi(context, request, baseURL!);
	});

	test.afterAll(async ({ request }) => {
		// Safety net: drop any users a crashed test may have left behind.
		await apiCleanupTestUsers(request);
	});

	test('creates a user via the UI and shows it in the listing', async ({ page, request }) => {
		const suffix = uniqueSuffix();
		const fullName = `Create UI ${suffix}`;
		const email = `${E2E_EMAIL_PREFIX}create-${suffix}@example.com`;
		const password = 'ChangeMe123!';

		await page.goto('/users/add/new');

		await page.getByLabel('Name', { exact: true }).fill(fullName);
		await page.getByLabel('Email', { exact: true }).fill(email);

		// bits-ui Select.Trigger is a <button>; Form.Label associates via `for`/`id`.
		await page.getByLabel('Role', { exact: true }).click();
		await page.getByRole('option', { name: 'System Admin', exact: true }).click();

		await page.getByLabel('Password', { exact: true }).fill(password);
		await page.getByLabel('Confirm Password', { exact: true }).fill(password);

		await page.getByRole('button', { name: /^Save$/i }).click();

		await page.waitForURL('**/users', { timeout: 10_000 });
		await page
			.getByPlaceholder(/Search/i)
			.fill(email);
		await expect(page.getByText(email).first()).toBeVisible();

		const created = await apiFindUserByEmail(request, email);
		if (created) await apiDeleteUser(request, created.id);
	});

	test('edits a user via the UI', async ({ page, request }) => {
		const original = await apiCreateUser(request);
		const newName = `Edited ${uniqueSuffix()}`;

		await page.goto(`/users/edit/${original.id}`);
		const nameField = page.getByLabel('Name', { exact: true });
		await nameField.fill(newName);

		await page.getByRole('button', { name: /^Save$/i }).click();

		await page.waitForURL('**/users', { timeout: 10_000 });
		await page.getByPlaceholder(/Search/i).fill(original.email);
		await expect(page.getByText(newName).first()).toBeVisible();

		await apiDeleteUser(request, original.id);
	});

	test('deletes a user via the UI', async ({ page, request }) => {
		const victim = await apiCreateUser(request);

		await page.goto('/users');
		await page.getByPlaceholder(/Search/i).fill(victim.email);
		await page.waitForURL(/search=/, { timeout: 5_000 });

		const row = page.getByRole('row').filter({ hasText: victim.email });
		await row.getByRole('button', { name: 'Delete' }).click();

		// Confirm in the AlertDialog
		await page
			.getByRole('alertdialog')
			.getByRole('button', { name: 'Delete', exact: true })
			.click();

		await expect(page.getByText(victim.email)).toHaveCount(0, { timeout: 10_000 });
	});
});

