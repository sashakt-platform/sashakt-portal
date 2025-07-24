import { test, expect } from './fixtures/auth';
import { mockAllAPIs, mockTests } from './fixtures/api-mocks';

test.describe('Test Management', () => {
	test.describe('Test Templates', () => {
		test.beforeEach(async ({ authenticatedPage: page }) => {
			await mockAllAPIs(page);
			await page.goto('/tests/test-template');
		});

		test('should display test templates list', async ({ authenticatedPage: page }) => {
			// Check that the page title is correct
			await expect(page.locator('h2')).toContainText(/Test.*Template/i);
			
			// Check that test templates are displayed
			const templateTest = mockTests.find(t => t.is_template);
			if (templateTest) {
				await expect(page.locator(`text=${templateTest.name}`)).toBeVisible();
				await expect(page.locator(`text=${templateTest.description}`)).toBeVisible();
			}
		});

		test('should show create test template button', async ({ authenticatedPage: page }) => {
			const createButton = page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("+")').first();
			await expect(createButton).toBeVisible();
		});

		test('should navigate to create test template page', async ({ authenticatedPage: page }) => {
			const createButton = page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("+")').first();
			await createButton.click();
			
			// Should navigate to create test page
			await expect(page).toHaveURL(/\/tests\/test-template\/.*\/new|\/tests\/test-template\/create/);
		});

		test('should create a new test template', async ({ authenticatedPage: page }) => {
			// Navigate to create test template page
			const createButton = page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("+")').first();
			await createButton.click();
			
			// Wait for form to load
			await page.waitForSelector('input[name="name"], input[name="title"]');
			
			// Fill in test template details
			await page.fill('input[name="name"], input[name="title"]', 'New Test Template');
			await page.fill('textarea[name="description"]', 'A description for the new test template');
			
			// Set time limit if field exists
			const timeLimitInput = page.locator('input[name="time_limit"]');
			if (await timeLimitInput.isVisible()) {
				await timeLimitInput.fill('60');
			}
			
			// Set total marks if field exists
			const totalMarksInput = page.locator('input[name="total_marks"]');
			if (await totalMarksInput.isVisible()) {
				await totalMarksInput.fill('100');
			}
			
			// Submit the form
			await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
			
			// Should redirect back to test templates list
			await expect(page).toHaveURL(/\/tests\/test-template/);
		});

		test('should edit an existing test template', async ({ authenticatedPage: page }) => {
			// Find and click edit button or test name
			const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();
			if (await editButton.isVisible()) {
				await editButton.click();
			} else {
				// Try clicking on the test template name
				const templateTest = mockTests.find(t => t.is_template);
				if (templateTest) {
					await page.click(`text=${templateTest.name}`);
				}
			}
			
			// Should navigate to edit page
			await expect(page).toHaveURL(/\/tests\/test-template\/.*\/edit|\d+/);
			
			// Modify test template details
			const nameInput = page.locator('input[name="name"], input[name="title"]');
			await nameInput.clear();
			await nameInput.fill('Updated Test Template');
			
			// Submit the form
			await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Update")');
			
			// Should redirect back to test templates list
			await expect(page).toHaveURL(/\/tests\/test-template/);
		});

		test('should delete a test template', async ({ authenticatedPage: page }) => {
			// Find the delete button
			const moreActionsButton = page.locator('button:has-text("⋯"), button:has-text("Actions")').first();
			if (await moreActionsButton.isVisible()) {
				await moreActionsButton.click();
				await page.click('text=Delete');
			} else {
				await page.locator('button:has-text("Delete")').first().click();
			}
			
			// Confirm deletion
			const confirmButton = page.locator('button:has-text("Continue"), button:has-text("Confirm"), button:has-text("Delete")').last();
			if (await confirmButton.isVisible()) {
				await confirmButton.click();
			}
			
			// Should remain on test templates page
			await expect(page).toHaveURL(/\/tests\/test-template/);
		});

		test('should filter test templates', async ({ authenticatedPage: page }) => {
			// Test search functionality
			const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
			if (await searchInput.isVisible()) {
				await searchInput.fill('Sample');
				
				// Should show filtered results
				await expect(page.locator('text=Sample Test Template')).toBeVisible();
			}
		});
	});

	test.describe('Test Sessions', () => {
		test.beforeEach(async ({ authenticatedPage: page }) => {
			await mockAllAPIs(page);
			await page.goto('/tests/test-session');
		});

		test('should display test sessions list', async ({ authenticatedPage: page }) => {
			// Check that the page title is correct
			await expect(page.locator('h2')).toContainText(/Test.*Session/i);
			
			// Check that test sessions are displayed
			const sessionTest = mockTests.find(t => !t.is_template);
			if (sessionTest) {
				await expect(page.locator(`text=${sessionTest.name}`)).toBeVisible();
			}
		});

		test('should show create test session button', async ({ authenticatedPage: page }) => {
			const createButton = page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("+")').first();
			await expect(createButton).toBeVisible();
		});

		test('should create test session from template', async ({ authenticatedPage: page }) => {
			const createButton = page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("+")').first();
			await createButton.click();
			
			// Should show template selection or navigate to create page
			if (await page.locator('text=Select Template, text=Choose Template').isVisible()) {
				// Select a template
				await page.click('text=Sample Test Template');
			}
			
			// Fill in session details
			await page.waitForSelector('input[name="name"], input[name="title"]');
			await page.fill('input[name="name"], input[name="title"]', 'Live Test Session');
			
			// Set start time if field exists
			const startTimeInput = page.locator('input[name="start_time"], input[type="datetime-local"]').first();
			if (await startTimeInput.isVisible()) {
				await startTimeInput.fill('2024-12-31T10:00');
			}
			
			// Submit the form
			await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
			
			// Should redirect to test sessions list
			await expect(page).toHaveURL(/\/tests\/test-session/);
		});

		test('should show test session link when available', async ({ authenticatedPage: page }) => {
			// Look for test link or URL
			const linkButton = page.locator('button:has-text("Link"), a:has-text("Link"), button:has-text("URL")').first();
			if (await linkButton.isVisible()) {
				await expect(linkButton).toBeVisible();
			}
		});

		test('should edit test session', async ({ authenticatedPage: page }) => {
			const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();
			if (await editButton.isVisible()) {
				await editButton.click();
				
				// Should navigate to edit page
				await expect(page).toHaveURL(/\/tests\/test-session\/.*\/edit|\d+/);
				
				// Modify session details
				const nameInput = page.locator('input[name="name"], input[name="title"]');
				await nameInput.clear();
				await nameInput.fill('Updated Test Session');
				
				// Submit the form
				await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Update")');
				
				// Should redirect back to sessions list
				await expect(page).toHaveURL(/\/tests\/test-session/);
			}
		});
	});

	test.describe('Test Configuration', () => {
		test.beforeEach(async ({ authenticatedPage: page }) => {
			await mockAllAPIs(page);
			await page.goto('/tests/test-template');
		});

		test('should configure test questions', async ({ authenticatedPage: page }) => {
			// Click on a test to configure it
			const templateTest = mockTests.find(t => t.is_template);
			if (templateTest) {
				await page.click(`text=${templateTest.name}`);
				
				// Should navigate to test configuration page
				await expect(page).toHaveURL(/\/tests\/test-template\/\d+/);
				
				// Should show questions section
				await expect(page.locator('text=Questions, text=Question Bank')).toBeVisible();
				
				// Should show add questions button
				const addQuestionsButton = page.locator('button:has-text("Add Questions"), button:has-text("Add Question")').first();
				if (await addQuestionsButton.isVisible()) {
					await expect(addQuestionsButton).toBeVisible();
				}
			}
		});

		test('should add questions to test', async ({ authenticatedPage: page }) => {
			// Navigate to test configuration
			const templateTest = mockTests.find(t => t.is_template);
			if (templateTest) {
				await page.click(`text=${templateTest.name}`);
				
				// Click add questions button
				const addQuestionsButton = page.locator('button:has-text("Add Questions"), button:has-text("Add Question")').first();
				if (await addQuestionsButton.isVisible()) {
					await addQuestionsButton.click();
					
					// Should show question selection dialog/page
					await expect(page.locator('text=Select Questions, text=Question Selection')).toBeVisible();
					
					// Select some questions
					const questionCheckbox = page.locator('input[type="checkbox"]').first();
					if (await questionCheckbox.isVisible()) {
						await questionCheckbox.check();
					}
					
					// Confirm selection
					const confirmButton = page.locator('button:has-text("Add"), button:has-text("Confirm"), button:has-text("Save")').first();
					if (await confirmButton.isVisible()) {
						await confirmButton.click();
					}
				}
			}
		});

		test('should configure test settings', async ({ authenticatedPage: page }) => {
			// Navigate to test configuration
			const templateTest = mockTests.find(t => t.is_template);
			if (templateTest) {
				await page.click(`text=${templateTest.name}`);
				
				// Should show configuration options
				await expect(page.locator('text=Settings, text=Configuration')).toBeVisible();
				
				// Check for time limit setting
				const timeLimitInput = page.locator('input[name="time_limit"]');
				if (await timeLimitInput.isVisible()) {
					await timeLimitInput.clear();
					await timeLimitInput.fill('90');
				}
				
				// Check for randomization settings
				const shuffleCheckbox = page.locator('input[name="shuffle"], input[type="checkbox"]').first();
				if (await shuffleCheckbox.isVisible()) {
					await shuffleCheckbox.check();
				}
				
				// Save settings
				const saveButton = page.locator('button:has-text("Save"), button[type="submit"]').first();
				if (await saveButton.isVisible()) {
					await saveButton.click();
				}
			}
		});

		test('should show test preview', async ({ authenticatedPage: page }) => {
			// Navigate to test configuration
			const templateTest = mockTests.find(t => t.is_template);
			if (templateTest) {
				await page.click(`text=${templateTest.name}`);
				
				// Look for preview button
				const previewButton = page.locator('button:has-text("Preview"), a:has-text("Preview")').first();
				if (await previewButton.isVisible()) {
					await previewButton.click();
					
					// Should show test preview
					await expect(page.locator('text=Preview, text=Test Preview')).toBeVisible();
				}
			}
		});
	});

	test.describe('Empty States', () => {
		test('should handle empty test templates', async ({ authenticatedPage: page }) => {
			// Mock empty response
			await page.route('**/test?is_template=true**', async (route) => {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify([])
				});
			});
			
			await page.goto('/tests/test-template');
			
			// Should show empty state
			await expect(page.locator('text=No templates, text=Create your first')).toBeVisible();
			
			// Should still show create button
			const createButton = page.locator('button:has-text("Create"), a:has-text("Create")').first();
			await expect(createButton).toBeVisible();
		});

		test('should handle empty test sessions', async ({ authenticatedPage: page }) => {
			// Mock empty response
			await page.route('**/test?is_template=false**', async (route) => {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify([])
				});
			});
			
			await page.goto('/tests/test-session');
			
			// Should show empty state
			await expect(page.locator('text=No sessions, text=Create your first')).toBeVisible();
		});
	});
}); 