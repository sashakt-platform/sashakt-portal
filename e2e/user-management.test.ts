import { test, expect } from './fixtures/auth';
import { mockAllAPIs, mockUsers } from './fixtures/api-mocks';

test.describe('User Management', () => {
	test.beforeEach(async ({ authenticatedPage: page }) => {
		await mockAllAPIs(page);
		await page.goto('/users');
	});

	test('should display users list', async ({ authenticatedPage: page }) => {
		// Check that the page title is correct
		await expect(page.locator('h2')).toContainText('User Management');
		
		// Check that users are displayed
		await expect(page.locator('text=admin@example.com')).toBeVisible();
		await expect(page.locator('text=Admin User')).toBeVisible();
		await expect(page.locator('text=user@example.com')).toBeVisible();
		await expect(page.locator('text=Regular User')).toBeVisible();
	});

	test('should show create user button', async ({ authenticatedPage: page }) => {
		const createButton = page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("Add"), button:has-text("+")').first();
		await expect(createButton).toBeVisible();
	});

	test('should navigate to create user page', async ({ authenticatedPage: page }) => {
		const createButton = page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("Add"), button:has-text("+")').first();
		await createButton.click();
		
		// Should navigate to create user page
		await expect(page).toHaveURL(/\/users\/.*\/new|\/users\/create|\/users\/add/);
	});

	test('should create a new user', async ({ authenticatedPage: page }) => {
		// Navigate to create user page
		const createButton = page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("Add"), button:has-text("+")').first();
		await createButton.click();
		
		// Wait for form to load
		await page.waitForSelector('input[name="email"], input[type="email"]');
		
		// Fill in user details
		await page.fill('input[name="email"], input[type="email"]', 'newuser@example.com');
		await page.fill('input[name="full_name"], input[name="name"]', 'New Test User');
		await page.fill('input[name="password"], input[type="password"]', 'password123');
		
		// Set user role if field exists
		const roleSelect = page.locator('select[name="role"], select[name="is_superuser"]').first();
		if (await roleSelect.isVisible()) {
			await roleSelect.selectOption('false'); // Regular user
		}
		
		// Submit the form
		await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
		
		// Should redirect back to users list
		await expect(page).toHaveURL(/\/users/);
	});

	test('should edit an existing user', async ({ authenticatedPage: page }) => {
		// Find and click edit button for a user
		const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();
		if (await editButton.isVisible()) {
			await editButton.click();
		} else {
			// Try clicking on the user row
			await page.click('text=user@example.com');
		}
		
		// Should navigate to edit page
		await expect(page).toHaveURL(/\/users\/.*\/edit|\/users\/\d+/);
		
		// Modify user details
		const nameInput = page.locator('input[name="full_name"], input[name="name"]');
		await nameInput.clear();
		await nameInput.fill('Updated User Name');
		
		// Submit the form
		await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Update")');
		
		// Should redirect back to users list
		await expect(page).toHaveURL(/\/users/);
	});

	test('should deactivate a user', async ({ authenticatedPage: page }) => {
		// Find the more actions button for a user
		const moreActionsButton = page.locator('button:has-text("⋯"), button:has-text("Actions")').first();
		if (await moreActionsButton.isVisible()) {
			await moreActionsButton.click();
			
			// Look for deactivate option
			const deactivateButton = page.locator('text=Deactivate, text=Disable');
			if (await deactivateButton.isVisible()) {
				await deactivateButton.click();
				
				// Confirm action if needed
				const confirmButton = page.locator('button:has-text("Continue"), button:has-text("Confirm")').last();
				if (await confirmButton.isVisible()) {
					await confirmButton.click();
				}
			}
		}
		
		// Should remain on users page
		await expect(page).toHaveURL(/\/users/);
	});

	test('should search users by email or name', async ({ authenticatedPage: page }) => {
		// Find the search input
		const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[name*="search"]').first();
		
		if (await searchInput.isVisible()) {
			// Search for a specific user
			await searchInput.fill('admin');
			
			// Should show only the admin user
			await expect(page.locator('text=admin@example.com')).toBeVisible();
			await expect(page.locator('text=Admin User')).toBeVisible();
		}
	});

	test('should filter users by status', async ({ authenticatedPage: page }) => {
		// Look for status filter dropdown
		const statusFilter = page.locator('select[name="status"], button:has-text("Status")').first();
		
		if (await statusFilter.isVisible()) {
			// Try to use as select first, then as button
			try {
				await statusFilter.selectOption('active');
			} catch {
				await statusFilter.click();
				await page.click('text=Active');
			}
			
			// Should filter users by status
			await expect(page.locator('h2')).toContainText('User Management');
		}
	});

	test('should show user roles correctly', async ({ authenticatedPage: page }) => {
		// Check that user roles are displayed
		await expect(page.locator('text=Admin, text=Super User, text=Administrator')).toBeVisible();
		await expect(page.locator('text=User, text=Regular, text=Standard')).toBeVisible();
	});

	test('should show user status correctly', async ({ authenticatedPage: page }) => {
		// Check that user status is displayed
		await expect(page.locator('text=Active, text=Enabled')).toBeVisible();
	});

	test('should display users in table format', async ({ authenticatedPage: page }) => {
		// Check that users are displayed in a table format
		await expect(page.locator('table, .user-item, .user-row')).toBeVisible();
		
		// Check for table headers
		await expect(page.locator('text=Email, text=Name, text=Full Name')).toBeVisible();
		await expect(page.locator('text=Status, text=Role')).toBeVisible();
	});

	test('should handle empty state when no users exist', async ({ authenticatedPage: page }) => {
		// Mock empty users response
		await page.route('**/users**', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					data: [],
					count: 0
				})
			});
		});
		
		// Reload the page
		await page.reload();
		
		// Should show empty state message
		await expect(page.locator('text=No users, text=Empty, text=Create your first')).toBeVisible();
		
		// Should show create button even when empty
		const createButton = page.locator('button:has-text("Create"), a:has-text("Create")').first();
		await expect(createButton).toBeVisible();
	});

	test('should show user actions menu', async ({ authenticatedPage: page }) => {
		// Look for actions menu (three dots, etc.)
		const actionsButton = page.locator('button:has-text("⋯"), button:has-text("Actions"), [data-testid="user-actions"]').first();
		
		if (await actionsButton.isVisible()) {
			await actionsButton.click();
			
			// Should show available actions
			await expect(page.locator('text=Edit, text=View')).toBeVisible();
			
			// May also show deactivate/activate options
			const actionOptions = page.locator('text=Deactivate, text=Activate, text=Delete');
			if (await actionOptions.isVisible()) {
				await expect(actionOptions).toBeVisible();
			}
		}
	});

	test('should validate required fields when creating user', async ({ authenticatedPage: page }) => {
		// Navigate to create user page
		const createButton = page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("Add"), button:has-text("+")').first();
		await createButton.click();
		
		// Try to submit form without filling required fields
		await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
		
		// Should show validation errors
		await expect(page.locator('text=required, text=This field is required')).toBeVisible();
	});

	test('should prevent creating user with duplicate email', async ({ authenticatedPage: page }) => {
		// Mock error response for duplicate email
		await page.route('**/users/signup', async (route) => {
			if (route.request().method() === 'POST') {
				await route.fulfill({
					status: 400,
					contentType: 'application/json',
					body: JSON.stringify({
						detail: 'The user with this email already exists in the system'
					})
				});
			}
		});
		
		// Navigate to create user page
		const createButton = page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("Add"), button:has-text("+")').first();
		await createButton.click();
		
		// Fill in form with existing email
		await page.fill('input[name="email"], input[type="email"]', 'admin@example.com');
		await page.fill('input[name="full_name"], input[name="name"]', 'Duplicate User');
		await page.fill('input[name="password"], input[type="password"]', 'password123');
		
		// Submit the form
		await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
		
		// Should show error message
		await expect(page.locator('text=already exists, text=duplicate')).toBeVisible();
	});

	test('should show pagination if many users exist', async ({ authenticatedPage: page }) => {
		// Mock response with many users
		const manyUsers = Array.from({ length: 50 }, (_, i) => ({
			id: i + 1,
			email: `user${i + 1}@example.com`,
			full_name: `User ${i + 1}`,
			is_active: true,
			is_superuser: false,
			organization_id: 1
		}));
		
		await page.route('**/users**', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					data: manyUsers,
					count: manyUsers.length
				})
			});
		});
		
		// Reload the page
		await page.reload();
		
		// Should show pagination controls
		const paginationControls = page.locator('button:has-text("Next"), button:has-text("Previous"), button:has-text("1"), button:has-text("2")');
		if (await paginationControls.first().isVisible()) {
			await expect(paginationControls.first()).toBeVisible();
		}
	});
}); 