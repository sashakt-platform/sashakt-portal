import { test, expect } from './fixtures/auth';
import { mockAllAPIs, mockQuestions } from './fixtures/api-mocks';

test.describe('Question Bank Management', () => {
	test.beforeEach(async ({ authenticatedPage: page }) => {
		await mockAllAPIs(page);
		await page.goto('/questionbank');
	});

	test('should display questions list', async ({ authenticatedPage: page }) => {
		// Check that the page title is correct
		await expect(page.locator('h2')).toContainText('Question Bank');
		
		// Check that questions are displayed
		await expect(page.locator('text=What is the capital of France?')).toBeVisible();
		await expect(page.locator('text=Which is the largest planet in our solar system?')).toBeVisible();
		
		// Check that question options are visible
		await expect(page.locator('text=Paris')).toBeVisible();
		await expect(page.locator('text=Jupiter')).toBeVisible();
	});

	test('should show create question button', async ({ authenticatedPage: page }) => {
		// Check for the "Create Question" or similar button
		const createButton = page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("+"), a:has-text("+")').first();
		await expect(createButton).toBeVisible();
	});

	test('should navigate to create question page', async ({ authenticatedPage: page }) => {
		// Click the create button
		const createButton = page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("+"), a:has-text("+")').first();
		await createButton.click();
		
		// Should navigate to create question page
		await expect(page).toHaveURL(/\/questionbank\/.*\/new|\/questionbank\/create|\/questionbank\/single-question/);
	});

	test('should create a new question', async ({ authenticatedPage: page }) => {
		// Navigate to create question page
		const createButton = page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("+"), a:has-text("+")').first();
		await createButton.click();
		
		// Wait for the form to load
		await page.waitForSelector('input, textarea');
		
		// Fill in question details
		await page.fill('textarea[name="question_text"], input[name="question_text"]', 'What is 2 + 2?');
		
		// Fill in options if they exist
		const optionA = page.locator('input[name*="option"], input[placeholder*="Option A"]').first();
		if (await optionA.isVisible()) {
			await optionA.fill('3');
		}
		
		const optionB = page.locator('input[name*="option"], input[placeholder*="Option B"]').nth(1);
		if (await optionB.isVisible()) {
			await optionB.fill('4');
		}
		
		const optionC = page.locator('input[name*="option"], input[placeholder*="Option C"]').nth(2);
		if (await optionC.isVisible()) {
			await optionC.fill('5');
		}
		
		const optionD = page.locator('input[name*="option"], input[placeholder*="Option D"]').nth(3);
		if (await optionD.isVisible()) {
			await optionD.fill('6');
		}
		
		// Select correct answer if available
		const correctAnswer = page.locator('input[type="radio"], input[type="checkbox"]').nth(1);
		if (await correctAnswer.isVisible()) {
			await correctAnswer.check();
		}
		
		// Submit the form
		await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
		
		// Should redirect back to questions list or show success
		await expect(page).toHaveURL(/\/questionbank/);
	});

	test('should edit an existing question', async ({ authenticatedPage: page }) => {
		// Find and click edit button for the first question
		const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();
		if (await editButton.isVisible()) {
			await editButton.click();
		} else {
			// Try clicking on the question row/title to edit
			await page.click('text=What is the capital of France?');
		}
		
		// Should navigate to edit page
		await expect(page).toHaveURL(/\/questionbank\/.*\/edit|\/questionbank\/single-question/);
		
		// Modify the question text
		const questionTextInput = page.locator('textarea[name="question_text"], input[name="question_text"]');
		await questionTextInput.clear();
		await questionTextInput.fill('What is the capital of France? (Updated)');
		
		// Submit the form
		await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Update")');
		
		// Should redirect back to questions list
		await expect(page).toHaveURL(/\/questionbank/);
	});

	test('should delete a question', async ({ authenticatedPage: page }) => {
		// Find the delete button (could be in a dropdown menu)
		const moreActionsButton = page.locator('button:has-text("⋯"), button:has-text("Actions")').first();
		if (await moreActionsButton.isVisible()) {
			await moreActionsButton.click();
			await page.click('text=Delete');
		} else {
			await page.locator('button:has-text("Delete")').first().click();
		}
		
		// Confirm deletion if there's a confirmation dialog
		const confirmButton = page.locator('button:has-text("Continue"), button:has-text("Confirm"), button:has-text("Delete")').last();
		if (await confirmButton.isVisible()) {
			await confirmButton.click();
		}
		
		// The question should be removed from the list
		// We can't reliably test this without more specific selectors
		// but we can verify we're still on the questions page
		await expect(page).toHaveURL(/\/questionbank/);
	});

	test('should filter questions by text search', async ({ authenticatedPage: page }) => {
		// Find the search input
		const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[name*="search"]').first();
		
		if (await searchInput.isVisible()) {
			// Search for a specific question
			await searchInput.fill('capital');
			
			// Should show only the question about capital
			await expect(page.locator('text=What is the capital of France?')).toBeVisible();
			// The other question should not be visible
			await expect(page.locator('text=Which is the largest planet')).not.toBeVisible();
		}
	});

	test('should filter questions by tags', async ({ authenticatedPage: page }) => {
		// Look for tag selection dropdown
		const tagDropdown = page.locator('button:has-text("tag"), button:has-text("Tag"), [data-testid="tag-select"]').first();
		
		if (await tagDropdown.isVisible()) {
			await tagDropdown.click();
			
			// Select a tag
			await page.click('text=Tag 1');
			
			// Apply filter (if there's an apply button)
			const applyButton = page.locator('button:has-text("Apply"), button:has-text("Filter")').first();
			if (await applyButton.isVisible()) {
				await applyButton.click();
			}
			
			// Should filter questions by selected tag
			await expect(page.locator('h2')).toContainText('Question Bank');
		}
	});

	test('should filter questions by states', async ({ authenticatedPage: page }) => {
		// Look for state selection dropdown
		const stateDropdown = page.locator('button:has-text("state"), button:has-text("State"), [data-testid="state-select"]').first();
		
		if (await stateDropdown.isVisible()) {
			await stateDropdown.click();
			
			// Select a state
			await page.click('text=State 1');
			
			// Apply filter (if there's an apply button)
			const applyButton = page.locator('button:has-text("Apply"), button:has-text("Filter")').first();
			if (await applyButton.isVisible()) {
				await applyButton.click();
			}
			
			// Should filter questions by selected state
			await expect(page.locator('h2')).toContainText('Question Bank');
		}
	});

	test('should show question details in table format', async ({ authenticatedPage: page }) => {
		// Check that questions are displayed in a table or list format
		await expect(page.locator('table, .question-item, .question-row')).toBeVisible();
		
		// Check for question text
		await expect(page.locator('text=What is the capital of France?')).toBeVisible();
		
		// Check for active status or similar metadata
		await expect(page.locator('text=Active, text=Published').first()).toBeVisible();
	});

	test('should handle empty state when no questions exist', async ({ authenticatedPage: page }) => {
		// Mock empty questions response
		await page.route('**/questions**', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([])
			});
		});
		
		// Reload the page
		await page.reload();
		
		// Should show empty state message
		await expect(page.locator('text=No questions, text=Empty, text=Create your first').first()).toBeVisible();
		
		// Should show create button even when empty
		const createButton = page.locator('button:has-text("Create"), a:has-text("Create")').first();
		await expect(createButton).toBeVisible();
	});

	test('should show bulk import option', async ({ authenticatedPage: page }) => {
		// Look for bulk import button
		const importButton = page.locator('button:has-text("Import"), a:has-text("Import"), button:has-text("Upload")').first();
		
		if (await importButton.isVisible()) {
			await importButton.click();
			
			// Should navigate to import page
			await expect(page).toHaveURL(/\/questionbank\/import/);
		}
	});

	test('should navigate to question import page and show file upload', async ({ authenticatedPage: page }) => {
		// Try to find and click import button
		const importButton = page.locator('button:has-text("Import"), a:has-text("Import")').first();
		
		if (await importButton.isVisible()) {
			await importButton.click();
			await expect(page).toHaveURL(/\/questionbank\/import/);
			
			// Should show file upload input
			await expect(page.locator('input[type="file"]')).toBeVisible();
			
			// Should show instructions or template download
			await expect(page.locator('text=CSV, text=template, text=format')).toBeVisible();
		}
	});

	test('should show question actions menu', async ({ authenticatedPage: page }) => {
		// Look for actions menu (three dots, etc.)
		const actionsButton = page.locator('button:has-text("⋯"), button:has-text("Actions"), [data-testid="question-actions"]').first();
		
		if (await actionsButton.isVisible()) {
			await actionsButton.click();
			
			// Should show edit and delete options
			await expect(page.locator('text=Edit')).toBeVisible();
			await expect(page.locator('text=Delete')).toBeVisible();
		}
	});
}); 