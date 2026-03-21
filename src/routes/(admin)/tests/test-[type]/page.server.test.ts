import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load } from './+page.server';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';
import { setFlash } from 'sveltekit-flash-message/server';

vi.mock('$env/static/private', () => ({
	BACKEND_URL: 'http://localhost:8000',
	TEST_TAKER_URL: 'http://test-taker.example.com'
}));

vi.mock('$lib/constants', () => ({
	DEFAULT_PAGE_SIZE: 25
}));

vi.mock('$lib/server/auth', () => ({
	getSessionTokenCookie: vi.fn(() => 'mock-token'),
	requireLogin: vi.fn(() => ({
		id: 1,
		permissions: ['read_test', 'read_test_template']
	}))
}));

vi.mock('$lib/utils/permissions.js', () => ({
	requirePermission: vi.fn(),
	PERMISSIONS: {
		READ_TEST: 'read_test',
		READ_TEST_TEMPLATE: 'read_test_template'
	}
}));

vi.mock('sveltekit-flash-message/server', () => ({
	setFlash: vi.fn()
}));

const mockCookies = {};

function makeUrl(path: string, params = '') {
	return new URL(`http://localhost${path}${params ? '?' + params : ''}`);
}

describe('Test Management Listing — load()', () => {
	const mockFetch = vi.fn();

	beforeEach(() => {
		global.fetch = mockFetch;
		mockFetch.mockClear();
		vi.clearAllMocks();
	});

	// ── Helper: default success mock ────────────────────────────────────────
	function mockSuccessfulFetch(testsData = { items: [], total: 0, pages: 0 }, questions = []) {
		mockFetch
			.mockResolvedValueOnce({
				ok: true,
				json: async () => testsData
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => questions
			});
	}

	// ────────────────────────────────────────────────────────────────────────
	describe('Permissions', () => {
		it('should require READ_TEST_TEMPLATE permission for type=template', async () => {
			mockSuccessfulFetch();
			await load({
				params: { type: 'template' },
				url: makeUrl('/tests/test-template'),
				cookies: mockCookies
			} as any);

			expect(requirePermission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				PERMISSIONS.READ_TEST_TEMPLATE
			);
		});

		it('should require READ_TEST permission for type=session', async () => {
			mockSuccessfulFetch();
			await load({
				params: { type: 'session' },
				url: makeUrl('/tests/test-session'),
				cookies: mockCookies
			} as any);

			expect(requirePermission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				PERMISSIONS.READ_TEST
			);
		});
	});

	// ────────────────────────────────────────────────────────────────────────
	describe('API call — query parameters', () => {
		it('should include default pagination and is_template=false for session', async () => {
			mockSuccessfulFetch();
			await load({
				params: { type: 'session' },
				url: makeUrl('/tests/test-session'),
				cookies: mockCookies
			} as any);

			const callUrl: string = mockFetch.mock.calls[0][0];
			expect(callUrl).toContain('/test/?');
			expect(callUrl).toContain('is_template=false');
			expect(callUrl).toContain('page=1');
			expect(callUrl).toContain('size=25');
		});

		it('should include is_template=true for type=template', async () => {
			mockSuccessfulFetch();
			await load({
				params: { type: 'template' },
				url: makeUrl('/tests/test-template'),
				cookies: mockCookies
			} as any);

			const callUrl: string = mockFetch.mock.calls[0][0];
			expect(callUrl).toContain('is_template=true');
		});

		it('should forward custom page and size', async () => {
			mockSuccessfulFetch();
			await load({
				params: { type: 'session' },
				url: makeUrl('/tests/test-session', 'page=2&size=10'),
				cookies: mockCookies
			} as any);

			const callUrl: string = mockFetch.mock.calls[0][0];
			expect(callUrl).toContain('page=2');
			expect(callUrl).toContain('size=10');
		});

		it('should map search param to name in the API URL', async () => {
			mockSuccessfulFetch();
			await load({
				params: { type: 'session' },
				url: makeUrl('/tests/test-session', 'search=quiz'),
				cookies: mockCookies
			} as any);

			const callUrl: string = mockFetch.mock.calls[0][0];
			expect(callUrl).toContain('name=quiz');
			expect(callUrl).not.toContain('search=quiz');
		});

		it('should map sortBy to sort_by and sortOrder to sort_order', async () => {
			mockSuccessfulFetch();
			await load({
				params: { type: 'session' },
				url: makeUrl('/tests/test-session', 'sortBy=name&sortOrder=desc'),
				cookies: mockCookies
			} as any);

			const callUrl: string = mockFetch.mock.calls[0][0];
			expect(callUrl).toContain('sort_by=name');
			expect(callUrl).toContain('sort_order=desc');
		});

		it('should omit sort_by when sortBy is not provided but always include sort_order', async () => {
			mockSuccessfulFetch();
			await load({
				params: { type: 'session' },
				url: makeUrl('/tests/test-session'),
				cookies: mockCookies
			} as any);

			const callUrl: string = mockFetch.mock.calls[0][0];
			expect(callUrl).not.toContain('sort_by');
			expect(callUrl).toContain('sort_order=asc');
		});

		it('should forward multiple tag_ids', async () => {
			mockSuccessfulFetch();
			await load({
				params: { type: 'session' },
				url: makeUrl('/tests/test-session', 'tag_ids=1&tag_ids=2'),
				cookies: mockCookies
			} as any);

			const callUrl: string = mockFetch.mock.calls[0][0];
			expect(callUrl).toContain('tag_ids=1');
			expect(callUrl).toContain('tag_ids=2');
		});

		it('should forward multiple state_ids', async () => {
			mockSuccessfulFetch();
			await load({
				params: { type: 'session' },
				url: makeUrl('/tests/test-session', 'state_ids=3&state_ids=4'),
				cookies: mockCookies
			} as any);

			const callUrl: string = mockFetch.mock.calls[0][0];
			expect(callUrl).toContain('state_ids=3');
			expect(callUrl).toContain('state_ids=4');
		});

		it('should forward district_ids', async () => {
			mockSuccessfulFetch();
			await load({
				params: { type: 'session' },
				url: makeUrl('/tests/test-session', 'district_ids=5'),
				cookies: mockCookies
			} as any);

			const callUrl: string = mockFetch.mock.calls[0][0];
			expect(callUrl).toContain('district_ids=5');
		});

		it('should forward tag_type_ids', async () => {
			mockSuccessfulFetch();
			await load({
				params: { type: 'session' },
				url: makeUrl('/tests/test-session', 'tag_type_ids=6'),
				cookies: mockCookies
			} as any);

			const callUrl: string = mockFetch.mock.calls[0][0];
			expect(callUrl).toContain('tag_type_ids=6');
		});

		it('should send Bearer token in Authorization header', async () => {
			mockSuccessfulFetch();
			await load({
				params: { type: 'session' },
				url: makeUrl('/tests/test-session'),
				cookies: mockCookies
			} as any);

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining('/test/?'),
				expect.objectContaining({
					headers: { Authorization: 'Bearer mock-token' }
				})
			);
		});
	});

	// ────────────────────────────────────────────────────────────────────────
	describe('Return value — success', () => {
		it('should return tests from API response', async () => {
			const mockTests = {
				items: [{ id: '1', name: 'Test A' }],
				total: 1,
				pages: 1
			};
			mockSuccessfulFetch(mockTests);

			const result = await load({
				params: { type: 'session' },
				url: makeUrl('/tests/test-session'),
				cookies: mockCookies
			} as any);

			expect(result.tests).toEqual(mockTests);
		});

		it('should return is_template=false for session', async () => {
			mockSuccessfulFetch();
			const result = await load({
				params: { type: 'session' },
				url: makeUrl('/tests/test-session'),
				cookies: mockCookies
			} as any);

			expect(result.is_template).toBe(false);
		});

		it('should return is_template=true for template', async () => {
			mockSuccessfulFetch();
			const result = await load({
				params: { type: 'template' },
				url: makeUrl('/tests/test-template'),
				cookies: mockCookies
			} as any);

			expect(result.is_template).toBe(true);
		});

		it('should return test_taker_url', async () => {
			mockSuccessfulFetch();
			const result = await load({
				params: { type: 'session' },
				url: makeUrl('/tests/test-session'),
				cookies: mockCookies
			} as any);

			expect(result.test_taker_url).toBe('http://test-taker.example.com');
		});

		it('should return params reflecting the request URL', async () => {
			mockSuccessfulFetch();
			const result = await load({
				params: { type: 'session' },
				url: makeUrl(
					'/tests/test-session',
					'page=3&size=10&search=quiz&sortBy=name&sortOrder=desc'
				),
				cookies: mockCookies
			} as any);

			expect(result.params).toEqual({
				page: 3,
				size: 10,
				search: 'quiz',
				sortBy: 'name',
				sortOrder: 'desc'
			});
		});
	});

	// ────────────────────────────────────────────────────────────────────────
	describe('Error handling — tests fetch fails', () => {
		it('should call setFlash with error message when fetch fails', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				statusText: 'Internal Server Error',
				json: async () => ({ detail: 'Something went wrong' })
			});

			await load({
				params: { type: 'session' },
				url: makeUrl('/tests/test-session'),
				cookies: mockCookies
			} as any);

			expect(setFlash).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'error' }),
				mockCookies
			);
		});

		it('should return empty tests structure when fetch fails', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				statusText: 'Server Error',
				json: async () => ({})
			});

			const result = await load({
				params: { type: 'session' },
				url: makeUrl('/tests/test-session'),
				cookies: mockCookies
			} as any);

			expect(result.tests).toEqual({ items: [], total: 0, pages: 0 });
			expect(result.questions).toEqual([]);
		});

		it('should still return is_template and test_taker_url on error', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				statusText: 'Server Error',
				json: async () => ({})
			});

			const result = await load({
				params: { type: 'template' },
				url: makeUrl('/tests/test-template'),
				cookies: mockCookies
			} as any);

			expect(result.is_template).toBe(true);
			expect(result.test_taker_url).toBe('http://test-taker.example.com');
		});
	});

	// ────────────────────────────────────────────────────────────────────────
	describe('Questions secondary fetch', () => {
		it('should return questions from the secondary fetch', async () => {
			const mockQuestions = [{ id: 1, text: 'Q1' }];
			mockSuccessfulFetch({ items: [], total: 0, pages: 0 }, mockQuestions);

			const result = await load({
				params: { type: 'session' },
				url: makeUrl('/tests/test-session'),
				cookies: mockCookies
			} as any);

			expect(result.questions).toEqual(mockQuestions);
		});

		it('should return empty questions array when secondary fetch fails', async () => {
			mockFetch
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ items: [], total: 0, pages: 0 })
				})
				.mockResolvedValueOnce({ ok: false });

			const result = await load({
				params: { type: 'session' },
				url: makeUrl('/tests/test-session'),
				cookies: mockCookies
			} as any);

			expect(result.questions).toEqual([]);
			expect(result.tests).toBeDefined(); // page still loads
		});
	});
});
