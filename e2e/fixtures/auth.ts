import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Mock user data for testing
export const mockUser = {
	id: 1,
	email: 'test@example.com',
	full_name: 'Test User',
	organization_id: 1,
	is_active: true,
	is_superuser: false
};

// Mock organization data
export const mockOrganization = {
	id: 1,
	name: 'Test Organization',
	description: 'Test organization for e2e tests'
};

// Mock states data
export const mockStates = [
	{ id: 1, name: 'State 1', country_id: 1 },
	{ id: 2, name: 'State 2', country_id: 1 }
];

// Mock tags data
export const mockTags = [
	{ id: 1, name: 'Tag 1', tag_type: { id: 1, name: 'Type 1' } },
	{ id: 2, name: 'Tag 2', tag_type: { id: 2, name: 'Type 2' } }
];

// Mock authentication session token
export const mockSessionToken = 'mock-session-token-12345';

/**
 * Helper to authenticate user in browser by setting session cookie
 */
export async function authenticateUser(page: Page) {
	// Set the session cookie
	await page.context().addCookies([
		{
			name: 'sashakt-session',
			value: mockSessionToken,
			domain: 'localhost',
			path: '/',
			httpOnly: true,
			sameSite: 'Strict'
		}
	]);
}

/**
 * Extended test fixture with authentication helper
 */
export const test = base.extend<{ authenticatedPage: Page }>({
	authenticatedPage: async ({ page }, use) => {
		await authenticateUser(page);
		await use(page);
	}
});

export { expect }; 