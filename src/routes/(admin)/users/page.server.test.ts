import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';

// Mock environment variables
vi.mock('$env/static/private', () => ({
	BACKEND_URL: 'http://localhost:8000'
}));

// Mock constants
vi.mock('$lib/constants.js', () => ({
	DEFAULT_PAGE_SIZE: 25
}));

// Mock auth functions
vi.mock('$lib/server/auth', () => ({
	getSessionTokenCookie: vi.fn(() => 'mock-token'),
	requireLogin: vi.fn(() => ({
		id: 1,
		username: 'testuser',
		permissions: ['read_user']
	}))
}));

// Mock permissions
vi.mock('$lib/utils/permissions.js', () => ({
	requirePermission: vi.fn(),
	PERMISSIONS: {
		READ_USER: 'read_user',
		CREATE_USER: 'create_user',
		UPDATE_USER: 'update_user',
		DELETE_USER: 'delete_user'
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

describe('Users List Route', () => {
	const mockFetch = vi.fn();

	beforeEach(() => {
		global.fetch = mockFetch;
		mockFetch.mockClear();
		vi.clearAllMocks();
	});

	describe('load()', () => {
		it('should check user is logged in and has read permission', async () => {
			const mockUrl = new URL('http://localhost/users');

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({
					items: [],
					total: 0,
					pages: 0
				})
			});

			await load({ url: mockUrl } as any);

			expect(requirePermission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				PERMISSIONS.READ_USER
			);
		});

		it('should fetch users with default pagination', async () => {
			const mockUrl = new URL('http://localhost/users');

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({
					items: [],
					total: 0,
					pages: 0
				})
			});

			await load({ url: mockUrl } as any);

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining('/users/?'),
				expect.objectContaining({
					method: 'GET',
					headers: {
						Authorization: 'Bearer mock-token'
					}
				})
			);

			const callUrl = mockFetch.mock.calls[0][0];
			expect(callUrl).toContain('page=1');
			expect(callUrl).toContain('size=25');
		});

		it('should fetch users with custom query parameters', async () => {
			const mockUrl = new URL(
				'http://localhost/users?page=2&size=10&search=test&sortBy=email&sortOrder=desc'
			);

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({
					items: [],
					total: 0,
					pages: 5
				})
			});

			await load({ url: mockUrl } as any);

			const callUrl = mockFetch.mock.calls[0][0];
			expect(callUrl).toContain('page=2');
			expect(callUrl).toContain('size=10');
			expect(callUrl).toContain('search=test');
			expect(callUrl).toContain('sort_by=email');
			expect(callUrl).toContain('sort_order=desc');
		});

		it('should return users data when fetch succeeds', async () => {
			const mockUrl = new URL('http://localhost/users');

			const mockUsersData = {
				items: [
					{ id: 1, name: 'User 1', email: 'user1@example.com' },
					{ id: 2, name: 'User 2', email: 'user2@example.com' }
				],
				total: 2,
				pages: 1
			};

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => mockUsersData
			});

			const result = await load({ url: mockUrl } as any);

			expect(result.users).toEqual(mockUsersData);
			expect(result.totalPages).toBe(1);
			expect(result.params).toEqual({
				page: 1,
				size: 25,
				search: '',
				sortBy: '',
				sortOrder: 'asc'
			});
		});

		it('should return null users when fetch fails', async () => {
			const mockUrl = new URL('http://localhost/users');

			mockFetch.mockResolvedValue({
				ok: false,
				status: 500
			});

			const result = await load({ url: mockUrl } as any);

			expect(result.users).toBeNull();
			expect(result.params).toEqual({
				page: 1,
				size: 25,
				search: '',
				sortBy: '',
				sortOrder: 'asc'
			});
		});

		it('should handle search parameter correctly', async () => {
			const mockUrl = new URL('http://localhost/users?search=john');

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({
					items: [],
					total: 0,
					pages: 0
				})
			});

			const result = await load({ url: mockUrl } as any);

			const callUrl = mockFetch.mock.calls[0][0];
			expect(callUrl).toContain('search=john');
			expect(result.params.search).toBe('john');
		});

		it('should omit sortBy and sortOrder when not provided', async () => {
			const mockUrl = new URL('http://localhost/users');

			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({
					items: [],
					total: 0,
					pages: 0
				})
			});

			await load({ url: mockUrl } as any);

			const callUrl = mockFetch.mock.calls[0][0];
			expect(callUrl).not.toContain('sort_by');
			expect(callUrl).not.toContain('sort_order');
		});
	});

	describe('actions.batchDelete()', () => {
		beforeEach(() => {
			vi.clearAllMocks();
		});

		it('should check DELETE_USER permission', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ delete_success_count: 1, delete_failure_list: [] })
			});

			await actions.batchDelete({
				request: mockRequest({ userIds: JSON.stringify([1]) }),
				cookies: mockCookies
			} as any);

			expect(requirePermission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				PERMISSIONS.DELETE_USER
			);
		});

		it('should send DELETE request to /users/ with userIds body', async () => {
			const userIds = [1, 2, 3];
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ delete_success_count: 3, delete_failure_list: [] })
			});

			await actions.batchDelete({
				request: mockRequest({ userIds: JSON.stringify(userIds) }),
				cookies: mockCookies
			} as any);

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining('/users/'),
				expect.objectContaining({
					method: 'DELETE',
					headers: expect.objectContaining({ Authorization: 'Bearer mock-token' }),
					body: JSON.stringify(userIds)
				})
			);
		});

		it('should flash success when all deletions succeed', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ delete_success_count: 2, delete_failure_list: [] })
			});

			await actions.batchDelete({
				request: mockRequest({ userIds: JSON.stringify([1, 2]) }),
				cookies: mockCookies
			} as any);

			expect(setFlashMock).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'success' }),
				mockCookies
			);
		});

		it('should flash error when some deletions fail', async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				json: async () => ({ delete_success_count: 1, delete_failure_list: [{ id: 2 }] })
			});

			await actions.batchDelete({
				request: mockRequest({ userIds: JSON.stringify([1, 2]) }),
				cookies: mockCookies
			} as any);

			expect(setFlashMock).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'error' }),
				mockCookies
			);
		});

		it('should flash error and return fail(500) when backend returns non-OK', async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 400,
				statusText: 'Bad Request',
				json: async () => ({ detail: 'Invalid user IDs' })
			});

			const result = await actions.batchDelete({
				request: mockRequest({ userIds: JSON.stringify([99]) }),
				cookies: mockCookies
			} as any);

			expect(setFlashMock).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'error',
					message: expect.stringContaining('Invalid user IDs')
				}),
				mockCookies
			);
			expect(result).toEqual(expect.objectContaining({ status: 500 }));
		});

		it('should flash error and return fail(500) on network exception', async () => {
			mockFetch.mockRejectedValue(new Error('Network error'));

			const result = await actions.batchDelete({
				request: mockRequest({ userIds: JSON.stringify([1]) }),
				cookies: mockCookies
			} as any);

			expect(setFlashMock).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'error',
					message: 'Failed to delete users'
				}),
				mockCookies
			);
			expect(result).toEqual(expect.objectContaining({ status: 500 }));
		});
	});
});
