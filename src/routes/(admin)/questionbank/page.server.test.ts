import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';

vi.mock('$env/static/private', () => ({
	BACKEND_URL: 'http://fake-backend.com'
}));

vi.mock('$lib/constants', () => ({
	DEFAULT_PAGE_SIZE: 25
}));

vi.mock('$lib/server/auth', () => ({
	requireLogin: vi.fn(() => ({ id: 1, permissions: ['read_question'] })),
	getSessionTokenCookie: vi.fn(() => 'fake-token')
}));

vi.mock('$lib/utils/permissions.js', () => ({
	requirePermission: vi.fn(),
	PERMISSIONS: {
		READ_QUESTION: 'read_question',
		DELETE_QUESTION: 'delete_question'
	}
}));

const setFlashMock = vi.fn();
vi.mock('sveltekit-flash-message/server', () => ({
	setFlash: (...args: any[]) => setFlashMock(...args)
}));

vi.mock('@sveltejs/kit', () => ({
	fail: vi.fn((status: number) => ({ type: 'failure', status }))
}));

const mockCookies = {
	get: vi.fn(),
	set: vi.fn(),
	delete: vi.fn(),
	getAll: vi.fn(),
	serialize: vi.fn()
};

function mockRequest(data: Record<string, string>) {
	const fd = new FormData();
	for (const [key, value] of Object.entries(data)) {
		fd.append(key, value);
	}
	return { formData: async () => fd } as unknown as Request;
}

describe('Question Bank Route', () => {
	const mockFetch = vi.fn();

	beforeEach(() => {
		global.fetch = mockFetch;
		mockFetch.mockClear();
		vi.clearAllMocks();
	});

	describe('load()', () => {
		it('checks user is logged in and has READ_QUESTION permission', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ items: [], total: 0, pages: 0 })
			});

			await load({ cookies: mockCookies, url: new URL('http://test.com/') } as any);

			expect(requirePermission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				PERMISSIONS.READ_QUESTION
			);
		});

		it('returns questions data with default pagination when no query params', async () => {
			const mockData = { items: [{ id: '1' }], total: 1, pages: 1 };
			mockFetch.mockResolvedValue({ ok: true, json: async () => mockData });

			const result = await load({
				cookies: mockCookies,
				url: new URL('http://test.com/')
			} as any);

			expect(result.questions).toEqual(mockData);
			expect(result.totalPages).toBe(1);
			expect(result.params).toEqual({
				page: 1,
				size: 25,
				search: '',
				sortBy: '',
				sortOrder: 'asc'
			});
		});

		it('passes custom pagination params to API', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ items: [], total: 0, pages: 5 })
			});

			const result = await load({
				cookies: mockCookies,
				url: new URL('http://test.com/?page=3&size=10')
			} as any);

			const callUrl = mockFetch.mock.calls[0][0];
			expect(callUrl).toContain('page=3');
			expect(callUrl).toContain('size=10');
			expect(result.params.page).toBe(3);
			expect(result.params.size).toBe(10);
		});

		it('passes search as question_text to API', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ items: [], total: 0, pages: 0 })
			});

			await load({
				cookies: mockCookies,
				url: new URL('http://test.com/?search=photosynthesis')
			} as any);

			const callUrl = mockFetch.mock.calls[0][0];
			expect(callUrl).toContain('question_text=photosynthesis');
		});

		it('passes sort params to API', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ items: [], total: 0, pages: 0 })
			});

			await load({
				cookies: mockCookies,
				url: new URL('http://test.com/?sortBy=question_text&sortOrder=desc')
			} as any);

			const callUrl = mockFetch.mock.calls[0][0];
			expect(callUrl).toContain('sort_by=question_text');
			expect(callUrl).toContain('sort_order=desc');
		});

		it('omits sort params from API call when not provided', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ items: [], total: 0, pages: 0 })
			});

			await load({
				cookies: mockCookies,
				url: new URL('http://test.com/')
			} as any);

			const callUrl = mockFetch.mock.calls[0][0];
			expect(callUrl).not.toContain('sort_by');
		});

		it('passes tag_ids filter params to API', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ items: [], total: 0, pages: 0 })
			});

			await load({
				cookies: mockCookies,
				url: new URL('http://test.com/?tag_ids=1&tag_ids=2')
			} as any);

			const callUrl = mockFetch.mock.calls[0][0];
			expect(callUrl).toContain('tag_ids=1');
			expect(callUrl).toContain('tag_ids=2');
		});

		it('passes state_ids filter params to API', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ items: [], total: 0, pages: 0 })
			});

			await load({
				cookies: mockCookies,
				url: new URL('http://test.com/?state_ids=10&state_ids=11')
			} as any);

			const callUrl = mockFetch.mock.calls[0][0];
			expect(callUrl).toContain('state_ids=10');
			expect(callUrl).toContain('state_ids=11');
		});

		it('passes tag_type_ids filter params to API', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ items: [], total: 0, pages: 0 })
			});

			await load({
				cookies: mockCookies,
				url: new URL('http://test.com/?tag_type_ids=5')
			} as any);

			const callUrl = mockFetch.mock.calls[0][0];
			expect(callUrl).toContain('tag_type_ids=5');
		});

		it('uses Bearer token in Authorization header', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ items: [], total: 0, pages: 0 })
			});

			await load({
				cookies: mockCookies,
				url: new URL('http://test.com/')
			} as any);

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining('/questions/'),
				expect.objectContaining({
					method: 'GET',
					headers: { Authorization: 'Bearer fake-token' }
				})
			);
		});

		it('returns empty questions and sets flash error when API fails', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				statusText: 'Internal Server Error',
				json: async () => ({ detail: 'Something went wrong' })
			});

			const result = await load({
				cookies: mockCookies,
				url: new URL('http://test.com/')
			} as any);

			expect(result.questions).toEqual({ items: [], total: 0, pages: 0 });
			expect(result.totalPages).toBe(0);
			expect(setFlashMock).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'error',
					message: expect.stringContaining('Failed to fetch questions')
				}),
				mockCookies
			);
		});

		it('uses statusText in flash error when API returns no detail', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				statusText: 'Bad Gateway',
				json: async () => ({})
			});

			await load({
				cookies: mockCookies,
				url: new URL('http://test.com/')
			} as any);

			expect(setFlashMock).toHaveBeenCalledWith(
				expect.objectContaining({
					message: expect.stringContaining('Bad Gateway')
				}),
				mockCookies
			);
		});
	});

	describe('actions.batchDelete()', () => {
		it('checks user is logged in and has DELETE_QUESTION permission', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ delete_success_count: 1, delete_failure_list: null })
			});

			await actions.batchDelete({
				request: mockRequest({ questionIds: JSON.stringify(['1']) }),
				cookies: mockCookies
			} as any);

			expect(requirePermission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				PERMISSIONS.DELETE_QUESTION
			);
		});

		it('sends DELETE request to /questions/ with questionIds as body', async () => {
			const questionIds = JSON.stringify(['1', '2']);
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ delete_success_count: 2, delete_failure_list: null })
			});

			await actions.batchDelete({
				request: mockRequest({ questionIds }),
				cookies: mockCookies
			} as any);

			expect(mockFetch).toHaveBeenCalledWith(
				'http://fake-backend.com/questions/',
				expect.objectContaining({
					method: 'DELETE',
					headers: expect.objectContaining({ Authorization: 'Bearer fake-token' }),
					body: questionIds
				})
			);
		});

		it('sets success flash when all deletions succeed', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ delete_success_count: 2, delete_failure_list: null })
			});

			const result = await actions.batchDelete({
				request: mockRequest({ questionIds: JSON.stringify(['1', '2']) }),
				cookies: mockCookies
			} as any);

			expect(setFlashMock).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'success' }),
				mockCookies
			);
			expect(result).toEqual({ success: true });
		});

		it('sets error flash when some deletions fail', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ delete_success_count: 1, delete_failure_list: [{ id: '2' }] })
			});

			await actions.batchDelete({
				request: mockRequest({ questionIds: JSON.stringify(['1', '2']) }),
				cookies: mockCookies
			} as any);

			expect(setFlashMock).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'error' }),
				mockCookies
			);
		});

		it('flash message includes success count and failure count', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ delete_success_count: 3, delete_failure_list: [{ id: '4' }, { id: '5' }] })
			});

			await actions.batchDelete({
				request: mockRequest({ questionIds: JSON.stringify(['3', '4', '5']) }),
				cookies: mockCookies
			} as any);

			expect(setFlashMock).toHaveBeenCalledWith(
				expect.objectContaining({
					message: expect.stringContaining('3')
				}),
				mockCookies
			);
		});

		it('sets error flash and returns fail(500) when API returns non-OK', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				statusText: 'Bad Request',
				json: async () => ({ detail: [{ msg: 'Invalid question IDs' }] })
			});

			const result = await actions.batchDelete({
				request: mockRequest({ questionIds: JSON.stringify(['99']) }),
				cookies: mockCookies
			} as any);

			expect(setFlashMock).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'error',
					message: expect.stringContaining('Invalid question IDs')
				}),
				mockCookies
			);
			expect(result).toEqual(expect.objectContaining({ status: 500 }));
		});

		it('uses statusText in flash error when API error has no detail msg', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				statusText: 'Gateway Timeout',
				json: async () => ({ detail: [{}] })
			});

			await actions.batchDelete({
				request: mockRequest({ questionIds: JSON.stringify(['1']) }),
				cookies: mockCookies
			} as any);

			expect(setFlashMock).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'error',
					message: expect.stringContaining('Gateway Timeout')
				}),
				mockCookies
			);
		});

		it('sets error flash and returns fail(500) on network exception', async () => {
			mockFetch.mockRejectedValue(new Error('Network failure'));

			const result = await actions.batchDelete({
				request: mockRequest({ questionIds: JSON.stringify(['1']) }),
				cookies: mockCookies
			} as any);

			expect(setFlashMock).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'error',
					message: 'Failed to delete questions'
				}),
				mockCookies
			);
			expect(result).toEqual(expect.objectContaining({ status: 500 }));
		});
	});
});
