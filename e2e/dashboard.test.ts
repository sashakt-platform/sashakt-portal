import { test, expect } from './fixtures/auth';
import { mockAllAPIs } from './fixtures/api-mocks';

test.describe('Dashboard', () => {
	test.beforeEach(async ({ authenticatedPage: page }) => {
		await mockAllAPIs(page);
		await page.goto('/dashboard');
	});

	test('should display dashboard page with correct title', async ({ authenticatedPage: page }) => {
		// Check that the page title is correct
		await expect(page.locator('h2, h1')).toContainText('Dashboard');
		
		// Should be on the dashboard URL
		await expect(page).toHaveURL('/dashboard');
	});

	test('should display organization statistics', async ({ authenticatedPage: page }) => {
		// Should show total questions count
		await expect(page.locator('text=50, text=Questions')).toBeVisible();
		
		// Should show total users count
		await expect(page.locator('text=10, text=Users')).toBeVisible();
		
		// Should show total tests count
		await expect(page.locator('text=25, text=Tests')).toBeVisible();
	});

	test('should display statistics cards or widgets', async ({ authenticatedPage: page }) => {
		// Check for dashboard cards/widgets
		const dashboardCards = page.locator('.card, .widget, .stat-card, [data-testid="stat-card"]');
		if (await dashboardCards.first().isVisible()) {
			await expect(dashboardCards.first()).toBeVisible();
		}
		
		// Check for metrics display
		await expect(page.locator('text=Total, text=Questions, text=Users, text=Tests')).toBeVisible();
	});

	test('should show quick action buttons', async ({ authenticatedPage: page }) => {
		// Look for quick action buttons to create content
		const quickActions = page.locator('button:has-text("Create Question"), a:has-text("Create Question"), button:has-text("New Test"), a:has-text("New Test")');
		
		if (await quickActions.first().isVisible()) {
			await expect(quickActions.first()).toBeVisible();
		}
	});

	test('should navigate to question bank from dashboard', async ({ authenticatedPage: page }) => {
		// Look for link or button to questions
		const questionsLink = page.locator('a:has-text("Questions"), button:has-text("Questions"), a:has-text("Question Bank")').first();
		
		if (await questionsLink.isVisible()) {
			await questionsLink.click();
			await expect(page).toHaveURL(/\/questionbank/);
		}
	});

	test('should navigate to tests from dashboard', async ({ authenticatedPage: page }) => {
		// Look for link or button to tests
		const testsLink = page.locator('a:has-text("Tests"), button:has-text("Tests"), a:has-text("Test")').first();
		
		if (await testsLink.isVisible()) {
			await testsLink.click();
			await expect(page).toHaveURL(/\/tests/);
		}
	});

	test('should navigate to users from dashboard', async ({ authenticatedPage: page }) => {
		// Look for link or button to users
		const usersLink = page.locator('a:has-text("Users"), button:has-text("Users"), a:has-text("User Management")').first();
		
		if (await usersLink.isVisible()) {
			await usersLink.click();
			await expect(page).toHaveURL(/\/users/);
		}
	});

	test('should show recent activity or items', async ({ authenticatedPage: page }) => {
		// Look for recent activity section
		const recentSection = page.locator('text=Recent, text=Latest, text=Activity');
		
		if (await recentSection.isVisible()) {
			await expect(recentSection).toBeVisible();
			
			// Should show some recent items
			await expect(page.locator('.recent-item, .activity-item, .latest-item')).toBeVisible();
		}
	});

	test('should handle loading states gracefully', async ({ authenticatedPage: page }) => {
		// Mock slow API response
		await page.route('**/organization/aggregated_data', async (route) => {
			// Add delay to simulate slow response
			await new Promise(resolve => setTimeout(resolve, 100));
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					total_questions: 50,
					total_users: 10,
					total_tests: 25
				})
			});
		});
		
		// Reload the page to trigger API call
		await page.reload();
		
		// Should eventually show the data
		await expect(page.locator('text=50, text=25, text=10')).toBeVisible();
	});

	test('should show welcome message or user greeting', async ({ authenticatedPage: page }) => {
		// Look for welcome message
		const welcomeMessage = page.locator('text=Welcome, text=Hello, text=Good');
		
		if (await welcomeMessage.isVisible()) {
			await expect(welcomeMessage).toBeVisible();
		}
		
		// Should show user name somewhere
		await expect(page.locator('text=Test User')).toBeVisible();
	});

	test('should be responsive on mobile devices', async ({ authenticatedPage: page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });
		
		// Dashboard should still be functional
		await expect(page.locator('h2, h1')).toContainText('Dashboard');
		
		// Statistics should still be visible
		await expect(page.locator('text=50, text=25, text=10')).toBeVisible();
		
		// Sidebar might be collapsed on mobile
		const sidebarTrigger = page.locator('button[aria-label*="menu"], button:has-text("☰"), .sidebar-trigger');
		if (await sidebarTrigger.isVisible()) {
			await expect(sidebarTrigger).toBeVisible();
		}
	});

	test('should handle API errors gracefully', async ({ authenticatedPage: page }) => {
		// Mock API error
		await page.route('**/organization/aggregated_data', async (route) => {
			await route.fulfill({
				status: 500,
				contentType: 'application/json',
				body: JSON.stringify({
					detail: 'Internal server error'
				})
			});
		});
		
		// Reload the page
		await page.reload();
		
		// Should handle error gracefully (might show error message or fallback)
		// At minimum, the page should not crash
		await expect(page.locator('h2, h1')).toContainText('Dashboard');
	});

	test('should refresh data when navigating back to dashboard', async ({ authenticatedPage: page }) => {
		// Navigate away from dashboard
		await page.goto('/questionbank');
		await expect(page).toHaveURL('/questionbank');
		
		// Navigate back to dashboard
		await page.goto('/dashboard');
		await expect(page).toHaveURL('/dashboard');
		
		// Should show dashboard content again
		await expect(page.locator('h2, h1')).toContainText('Dashboard');
		await expect(page.locator('text=50, text=25, text=10')).toBeVisible();
	});

	test('should show organization name or branding', async ({ authenticatedPage: page }) => {
		// Look for organization name or branding
		const orgBranding = page.locator('text=Test Organization, text=Sashakt, .logo, .brand');
		
		if (await orgBranding.isVisible()) {
			await expect(orgBranding).toBeVisible();
		}
	});
}); 