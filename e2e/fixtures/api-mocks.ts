import type { Page, Route } from '@playwright/test';
import { mockStates, mockTags, mockUser, mockSessionToken } from './auth';

// Mock questions data
export const mockQuestions = [
	{
		id: 1,
		question_text: 'What is the capital of France?',
		question_type: 'multiple_choice',
		options: [
			{ label: 'A', text: 'London' },
			{ label: 'B', text: 'Paris' },
			{ label: 'C', text: 'Berlin' },
			{ label: 'D', text: 'Madrid' }
		],
		correct_answer: [1], // Paris
		is_active: true,
		organization_id: 1,
		latest_question_revision_id: 1,
		locations: [],
		tags: [mockTags[0]]
	},
	{
		id: 2,
		question_text: 'Which is the largest planet in our solar system?',
		question_type: 'multiple_choice',
		options: [
			{ label: 'A', text: 'Earth' },
			{ label: 'B', text: 'Jupiter' },
			{ label: 'C', text: 'Saturn' },
			{ label: 'D', text: 'Mars' }
		],
		correct_answer: [1], // Jupiter
		is_active: true,
		organization_id: 1,
		latest_question_revision_id: 2,
		locations: [],
		tags: [mockTags[1]]
	}
];

// Mock tests data
export const mockTests = [
	{
		id: 1,
		name: 'Sample Test Template',
		description: 'A sample test template for e2e testing',
		is_template: true,
		is_active: true,
		time_limit: 60,
		total_marks: 100,
		created_by_id: mockUser.id,
		organization_id: 1,
		tags: [mockTags[0]],
		states: [mockStates[0]],
		question_revisions: []
	},
	{
		id: 2,
		name: 'Live Test Session',
		description: 'A live test session for candidates',
		is_template: false,
		is_active: true,
		time_limit: 45,
		total_marks: 50,
		created_by_id: mockUser.id,
		organization_id: 1,
		tags: [mockTags[1]],
		states: [mockStates[1]],
		question_revisions: []
	}
];

// Mock users data
export const mockUsers = [
	{
		id: 1,
		email: 'admin@example.com',
		full_name: 'Admin User',
		is_active: true,
		is_superuser: true,
		organization_id: 1
	},
	{
		id: 2,
		email: 'user@example.com',
		full_name: 'Regular User',
		is_active: true,
		is_superuser: false,
		organization_id: 1
	}
];

/**
 * Set up API mocks for questions endpoints
 */
export async function mockQuestionsAPI(page: Page) {
	// Mock questions list endpoint
	await page.route('**/questions**', async (route) => {
		if (route.request().method() === 'GET') {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify(mockQuestions)
			});
		} else if (route.request().method() === 'POST') {
			// Mock question creation
			const body = await route.request().postDataJSON();
			const newQuestion = {
				id: mockQuestions.length + 1,
				...body,
				organization_id: mockUser.organization_id,
				latest_question_revision_id: mockQuestions.length + 1,
				locations: [],
				tags: body.tag_ids?.map((id: number) => mockTags.find(t => t.id === id)).filter(Boolean) || []
			};
			await route.fulfill({
				status: 201,
				contentType: 'application/json',
				body: JSON.stringify(newQuestion)
			});
		}
	});

	// Mock single question endpoint
	await page.route('**/questions/*', async (route) => {
		const url = route.request().url();
		const questionId = parseInt(url.split('/').pop() || '0');
		
		if (route.request().method() === 'GET') {
			const question = mockQuestions.find(q => q.id === questionId);
			if (question) {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify(question)
				});
			} else {
				await route.fulfill({ status: 404 });
			}
		} else if (route.request().method() === 'PUT') {
			// Mock question update
			const body = await route.request().postDataJSON();
			const question = mockQuestions.find(q => q.id === questionId);
			if (question) {
				Object.assign(question, body);
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify(question)
				});
			} else {
				await route.fulfill({ status: 404 });
			}
		} else if (route.request().method() === 'DELETE') {
			// Mock question deletion
			await route.fulfill({ status: 200 });
		}
	});
}

/**
 * Set up API mocks for tests endpoints
 */
export async function mockTestsAPI(page: Page) {
	// Mock tests list endpoint
	await page.route('**/test**', async (route) => {
		if (route.request().method() === 'GET') {
			const url = new URL(route.request().url());
			const isTemplate = url.searchParams.get('is_template');
			
			let filteredTests = mockTests;
			if (isTemplate !== null) {
				filteredTests = mockTests.filter(t => t.is_template === (isTemplate === 'true'));
			}
			
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify(filteredTests)
			});
		} else if (route.request().method() === 'POST') {
			// Mock test creation
			const body = await route.request().postDataJSON();
			const newTest = {
				id: mockTests.length + 1,
				...body,
				created_by_id: mockUser.id,
				organization_id: mockUser.organization_id,
				tags: body.tag_ids?.map((id: number) => mockTags.find(t => t.id === id)).filter(Boolean) || [],
				states: body.state_ids?.map((id: number) => mockStates.find(s => s.id === id)).filter(Boolean) || [],
				question_revisions: []
			};
			await route.fulfill({
				status: 201,
				contentType: 'application/json',
				body: JSON.stringify(newTest)
			});
		}
	});

	// Mock single test endpoint
	await page.route('**/test/*', async (route) => {
		const url = route.request().url();
		const testId = parseInt(url.split('/').pop() || '0');
		
		if (route.request().method() === 'GET') {
			const test = mockTests.find(t => t.id === testId);
			if (test) {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify(test)
				});
			} else {
				await route.fulfill({ status: 404 });
			}
		} else if (route.request().method() === 'PUT') {
			// Mock test update
			const body = await route.request().postDataJSON();
			const test = mockTests.find(t => t.id === testId);
			if (test) {
				Object.assign(test, body);
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify(test)
				});
			} else {
				await route.fulfill({ status: 404 });
			}
		} else if (route.request().method() === 'DELETE') {
			// Mock test deletion
			await route.fulfill({ status: 200 });
		}
	});
}

/**
 * Set up API mocks for users endpoints
 */
export async function mockUsersAPI(page: Page) {
	// Mock users list endpoint
	await page.route('**/users**', async (route) => {
		if (route.request().method() === 'GET') {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					data: mockUsers,
					count: mockUsers.length
				})
			});
		}
	});

	// Mock user signup endpoint
	await page.route('**/users/signup', async (route) => {
		if (route.request().method() === 'POST') {
			const body = await route.request().postDataJSON();
			const newUser = {
				id: mockUsers.length + 1,
				...body,
				organization_id: mockUser.organization_id,
				is_active: true
			};
			await route.fulfill({
				status: 201,
				contentType: 'application/json',
				body: JSON.stringify(newUser)
			});
		}
	});
}

/**
 * Set up API mocks for tags and states endpoints
 */
export async function mockMetadataAPI(page: Page) {
	// Mock tags endpoint
	await page.route('**/tags**', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify(mockTags)
		});
	});

	// Mock states endpoint
	await page.route('**/states**', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify(mockStates)
		});
	});
}

/**
 * Set up API mocks for authentication and core endpoints
 */
export async function mockAuthAPI(page: Page) {
	// Mock the backend authentication check
	await page.route('**/users/me', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify(mockUser)
		});
	});

	// Mock login endpoint
	await page.route('**/login/access-token', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				access_token: mockSessionToken,
				token_type: 'bearer'
			})
		});
	});

	// Mock organization data endpoint
	await page.route('**/organization/aggregated_data', async (route) => {
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

	// Mock organization endpoint
	await page.route('**/organization**', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify([{
				id: 1,
				name: 'Test Organization',
				description: 'Test organization for e2e tests'
			}])
		});
	});

	// Mock roles endpoint
	await page.route('**/roles**', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify([
				{ id: 1, name: 'Admin', description: 'Administrator role' },
				{ id: 2, name: 'User', description: 'Regular user role' }
			])
		});
	});
}

/**
 * Set up API mocks for location endpoints
 */
export async function mockLocationAPI(page: Page) {
	// Mock location/state endpoint
	await page.route('**/location/state/**', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify(mockStates)
		});
	});
}

/**
 * Set up API mocks for tag-related endpoints
 */
export async function mockTagAPI(page: Page) {
	// Mock tag endpoint (different from tags)
	await page.route('**/tag/**', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify(mockTags)
		});
	});

	// Mock tagtype endpoint
	await page.route('**/tagtype/**', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify([
				{ id: 1, name: 'Type 1', description: 'Tag type 1' },
				{ id: 2, name: 'Type 2', description: 'Tag type 2' }
			])
		});
	});
}

/**
 * Set up all API mocks for the application
 */
export async function mockAllAPIs(page: Page) {
	await mockAuthAPI(page);
	await mockQuestionsAPI(page);
	await mockTestsAPI(page);
	await mockUsersAPI(page);
	await mockMetadataAPI(page);
	await mockLocationAPI(page);
	await mockTagAPI(page);
} 