import { test, expect } from './fixtures/auth';
import { mockAllAPIs } from './fixtures/api-mocks';

test.describe('Authentication and Navigation', () => {
	test('should redirect to login when not authenticated', async ({ page }) => {
		await mockAllAPIs(page);
		
		// Try to access admin dashboard without authentication
		await page.goto('/dashboard');
		
		// Should be redirected to login page
		await expect(page).toHaveURL(/\/login/);
		await expect(page.locator('h1')).toContainText(/login|sign in/i);
	});

	test('should successfully login with valid credentials', async ({ page }) => {
		await mockAllAPIs(page);
		
		// Go to login page
		await page.goto('/login');
		
		// Fill in login form
		await page.fill('input[name="email"]', 'test@example.com');
		await page.fill('input[name="password"]', 'password123');
		
		// Submit form
		await page.click('button[type="submit"]');
		
		// Should redirect to dashboard
		await expect(page).toHaveURL('/dashboard');
	});

	test('should show error for invalid credentials', async ({ page }) => {
		await mockAllAPIs(page);
		
		// Override the login mock to return an error
		await page.route('**/login/access-token', async (route) => {
			await route.fulfill({
				status: 400,
				contentType: 'application/json',
				body: JSON.stringify({ detail: 'Incorrect email or password' })
			});
		});
		
		await page.goto('/login');
		
		// Fill in invalid credentials
		await page.fill('input[name="email"]', 'invalid@example.com');
		await page.fill('input[name="password"]', 'wrongpassword');
		
		// Submit form
		await page.click('button[type="submit"]');
		
		// Should show error message
		await expect(page.locator('text=Incorrect email or password')).toBeVisible();
	});

	test('should navigate between sections when authenticated', async ({ authenticatedPage: page }) => {
		await mockAllAPIs(page);
		
		// Start at dashboard
		await page.goto('/dashboard');
		await expect(page).toHaveURL('/dashboard');
		await expect(page.locator('h2')).toContainText('Dashboard');
		
		// Navigate to Question Bank
		await page.click('text=Question Bank');
		await expect(page).toHaveURL('/questionbank');
		await expect(page.locator('h2')).toContainText('Question Bank');
		
		// Navigate to Test Templates
		await page.click('text=Test Management');
		await page.click('text=Test Template');
		await expect(page).toHaveURL('/tests/test-template');
		await expect(page.locator('h2')).toContainText(/Test.*Template/i);
		
		// Navigate to Test Sessions
		await page.click('text=Test Sessions');
		await expect(page).toHaveURL('/tests/test-session');
		await expect(page.locator('h2')).toContainText(/Test.*Session/i);
		
		// Navigate to User Management
		await page.click('text=User Management');
		await expect(page).toHaveURL('/users');
		await expect(page.locator('h2')).toContainText('User Management');
	});

	test('should logout successfully', async ({ authenticatedPage: page }) => {
		await mockAllAPIs(page);
		
		// Go to dashboard
		await page.goto('/dashboard');
		
		// Click on user dropdown in sidebar
		await page.click('text=Test User'); // The user's name in the sidebar
		
		// Click sign out
		await page.click('text=Sign out');
		
		// Should redirect to login
		await expect(page).toHaveURL('/');
	});

	test('should show user name in sidebar', async ({ authenticatedPage: page }) => {
		await mockAllAPIs(page);
		
		await page.goto('/dashboard');
		
		// Should show the user's name in the sidebar
		await expect(page.locator('text=Test User')).toBeVisible();
	});

	test('should display sidebar menu items correctly', async ({ authenticatedPage: page }) => {
		await mockAllAPIs(page);
		
		await page.goto('/dashboard');
		
		// Check all main menu items are visible
		await expect(page.locator('text=Dashboard')).toBeVisible();
		await expect(page.locator('text=Question Bank')).toBeVisible();
		await expect(page.locator('text=Test Management')).toBeVisible();
		await expect(page.locator('text=User Management')).toBeVisible();
		
		// Check Test Management submenu expands
		await page.click('text=Test Management');
		await expect(page.locator('text=Test Template')).toBeVisible();
		await expect(page.locator('text=Test Sessions')).toBeVisible();
	});

	test('should highlight active menu item', async ({ authenticatedPage: page }) => {
		await mockAllAPIs(page);
		
		// Navigate to Question Bank
		await page.goto('/questionbank');
		
		// The Question Bank menu item should be highlighted/active
		const questionBankItem = page.locator('text=Question Bank').first();
		await expect(questionBankItem).toHaveClass(/active|selected/);
	});
}); 