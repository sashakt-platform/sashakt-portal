import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';
import { requirePermission, PERMISSIONS } from '$lib/utils/permissions.js';
import { setFlash } from 'sveltekit-flash-message/server';
import { fail } from '@sveltejs/kit';

vi.mock('$env/static/private', () => ({
	BACKEND_URL: 'http://localhost:8000'
}));

vi.mock('$lib/constants.js', () => ({
	DEFAULT_PAGE_SIZE: 25
}));

vi.mock('$lib/server/auth', () => ({
	getSessionTokenCookie: vi.fn(() => 'mock-token'),
	requireLogin: vi.fn(() => ({ id: 1, permissions: ['read_entity', 'delete_entity'] }))
}));

vi.mock('$lib/utils/permissions.js', () => ({
	requirePermission: vi.fn(),
	PERMISSIONS: {
		READ_ENTITY: 'read_entity',
		DELETE_ENTITY: 'delete_entity'
	}
}));

vi.mock('@sveltejs/kit', () => ({
	fail: vi.fn((status: number) => ({ status, type: 'failure' }))
}));

vi.mock('sveltekit-flash-message/server', () => ({
	setFlash: vi.fn()
}));

const mockCookies = {
	get: vi.fn(),
	getAll: vi.fn(),
	set: vi.fn(),
	delete: vi.fn(),
	serialize: vi.fn()
};

function makeUrl(path: string, params = '') {
	return new URL(`http://localhost${path}${params ? '?' + params : ''}`);
}

// ─────────────────────────────────────────────────────────────────────────────
describe('Entity Listing — load()', () => {
	const mockFetch = vi.fn();

	beforeEach(() => {
		global.fetch = mockFetch;
		mockFetch.mockClear();
		vi.clearAllMocks();
	});

	function mockSuccess(data = { items: [{ id: 1, name: 'CLF' }], total: 1, pages: 2 }) {
		mockFetch.mockResolvedValueOnce({ ok: true, json: async () => data });
	}

	function mockFailure(statusText = 'Internal Server Error') {
		mockFetch.mockResolvedValueOnce({ ok: false, statusText });
	}

	// ── Permissions ───────────────────────────────────────────────────────────
	describe('Permissions', () => {
		it('requires READ_ENTITY permission', async () => {
			mockSuccess();
			await load({ url: makeUrl('/entity') } as any);
			expect(requirePermission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				PERMISSIONS.READ_ENTITY
			);
		});
	});

	// ── API call — query parameters ───────────────────────────────────────────
	describe('API call — query parameters', () => {
		it('calls the /entitytype/ endpoint', async () => {
			mockSuccess();
			await load({ url: makeUrl('/entity') } as any);
			expect(mockFetch.mock.calls[0][0]).toContain('/entitytype/');
		});

		it('sends Bearer token in Authorization header', async () => {
			mockSuccess();
			await load({ url: makeUrl('/entity') } as any);
			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining('/entitytype/'),
				expect.objectContaining({ headers: { Authorization: 'Bearer mock-token' } })
			);
		});

		it('includes default page=1 and size=25', async () => {
			mockSuccess();
			await load({ url: makeUrl('/entity') } as any);
			const url = mockFetch.mock.calls[0][0] as string;
			expect(url).toContain('page=1');
			expect(url).toContain('size=25');
		});

		it('forwards custom page and size', async () => {
			mockSuccess();
			await load({ url: makeUrl('/entity', 'page=3&size=10') } as any);
			const url = mockFetch.mock.calls[0][0] as string;
			expect(url).toContain('page=3');
			expect(url).toContain('size=10');
		});

		it('maps search param to name in the API URL', async () => {
			mockSuccess();
			await load({ url: makeUrl('/entity', 'search=CLF') } as any);
			const url = mockFetch.mock.calls[0][0] as string;
			expect(url).toContain('name=CLF');
			expect(url).not.toContain('search=CLF');
		});

		it('maps sortBy to sort_by and sortOrder to sort_order', async () => {
			mockSuccess();
			await load({ url: makeUrl('/entity', 'sortBy=name&sortOrder=desc') } as any);
			const url = mockFetch.mock.calls[0][0] as string;
			expect(url).toContain('sort_by=name');
			expect(url).toContain('sort_order=desc');
		});

		it('omits sort_by when sortBy is not provided', async () => {
			mockSuccess();
			await load({ url: makeUrl('/entity') } as any);
			expect(mockFetch.mock.calls[0][0]).not.toContain('sort_by');
		});

		it('includes is_active=true when isActive=true', async () => {
			mockSuccess();
			await load({ url: makeUrl('/entity', 'isActive=true') } as any);
			expect(mockFetch.mock.calls[0][0]).toContain('is_active=true');
		});

		it('includes is_active=false when isActive=false', async () => {
			mockSuccess();
			await load({ url: makeUrl('/entity', 'isActive=false') } as any);
			expect(mockFetch.mock.calls[0][0]).toContain('is_active=false');
		});

		it('omits is_active when isActive param is not set', async () => {
			mockSuccess();
			await load({ url: makeUrl('/entity') } as any);
			expect(mockFetch.mock.calls[0][0]).not.toContain('is_active');
		});

		it('normalises isActive casing — "TRUE" is treated as "true"', async () => {
			mockSuccess();
			await load({ url: makeUrl('/entity', 'isActive=TRUE') } as any);
			expect(mockFetch.mock.calls[0][0]).toContain('is_active=true');
		});

		it('omits is_active when isActive is an unrecognised value (e.g. "yes")', async () => {
			mockSuccess();
			await load({ url: makeUrl('/entity', 'isActive=yes') } as any);
			expect(mockFetch.mock.calls[0][0]).not.toContain('is_active');
		});
	});

	// ── Return value — success ─────────────────────────────────────────────────
	describe('Return value — success', () => {
		it('returns entities from the API response', async () => {
			const mockData = { items: [{ id: 1, name: 'CLF' }], total: 1, pages: 3 };
			mockSuccess(mockData);
			const result = (await load({ url: makeUrl('/entity') } as any)) as any;
			expect(result.entities).toEqual(mockData);
		});

		it('returns totalPages from the API response pages field', async () => {
			mockSuccess({ items: [], total: 0, pages: 5 });
			const result = (await load({ url: makeUrl('/entity') } as any)) as any;
			expect(result.totalPages).toBe(5);
		});

		it('returns correct params object reflecting the request URL', async () => {
			mockSuccess();
			const result = (await load({
				url: makeUrl('/entity', 'page=2&size=10&search=test&sortBy=name&sortOrder=desc&isActive=true')
			} as any)) as any;
			expect(result.params).toEqual({
				page: 2,
				size: 10,
				search: 'test',
				sortBy: 'name',
				sortOrder: 'desc',
				isActive: 'true'
			});
		});

		it('returns default params when no URL params are provided', async () => {
			mockSuccess();
			const result = (await load({ url: makeUrl('/entity') } as any)) as any;
			expect(result.params).toEqual({
				page: 1,
				size: 25,
				search: '',
				sortBy: '',
				sortOrder: 'asc',
				isActive: ''
			});
		});
	});

	// ── Return value — API failure ─────────────────────────────────────────────
	describe('Return value — API failure', () => {
		it('returns entities: null when fetch fails', async () => {
			mockFailure('Server Error');
			const result = (await load({ url: makeUrl('/entity') } as any)) as any;
			expect(result.entities).toBeNull();
		});

		it('still returns params on API failure', async () => {
			mockFailure();
			const result = (await load({
				url: makeUrl('/entity', 'page=2&size=10')
			} as any)) as any;
			expect(result.params.page).toBe(2);
			expect(result.params.size).toBe(10);
		});
	});
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Entity Listing — batchDelete action', () => {
	const mockFetch = vi.fn();

	beforeEach(() => {
		global.fetch = mockFetch;
		mockFetch.mockClear();
		vi.clearAllMocks();
	});

	function makeRequest(entityIds: number[]) {
		return {
			formData: vi.fn().mockResolvedValue({
				get: vi.fn((key: string) => (key === 'entityIds' ? JSON.stringify(entityIds) : null))
			})
		};
	}

	function makeEvent(entityIds: number[]) {
		return { request: makeRequest(entityIds), cookies: mockCookies };
	}

	function mockBackendSuccess(successCount: number, failureList: number[] | null = null) {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				delete_success_count: successCount,
				delete_failure_list: failureList
			})
		});
	}

	function mockBackendError(detail = 'Cannot delete') {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			statusText: 'Internal Server Error',
			json: async () => ({ detail })
		});
	}

	// ── Permissions ───────────────────────────────────────────────────────────
	describe('Permissions', () => {
		it('requires DELETE_ENTITY permission', async () => {
			mockBackendSuccess(1);
			await actions.batchDelete(makeEvent([1]) as any);
			expect(requirePermission).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1 }),
				PERMISSIONS.DELETE_ENTITY
			);
		});
	});

	// ── API call ──────────────────────────────────────────────────────────────
	describe('API call', () => {
		it('calls DELETE /entitytype/ endpoint', async () => {
			mockBackendSuccess(2);
			await actions.batchDelete(makeEvent([1, 2]) as any);
			expect(mockFetch).toHaveBeenCalledWith(
				'http://localhost:8000/entitytype/',
				expect.objectContaining({ method: 'DELETE' })
			);
		});

		it('sends entityIds from formData as the request body', async () => {
			mockBackendSuccess(2);
			await actions.batchDelete(makeEvent([1, 2]) as any);
			const [, opts] = mockFetch.mock.calls[0];
			expect(opts.body).toBe(JSON.stringify([1, 2]));
		});

		it('sends Bearer token in Authorization header', async () => {
			mockBackendSuccess(1);
			await actions.batchDelete(makeEvent([1]) as any);
			const [, opts] = mockFetch.mock.calls[0];
			expect(opts.headers.Authorization).toBe('Bearer mock-token');
		});

		it('sends Content-Type: application/json header', async () => {
			mockBackendSuccess(1);
			await actions.batchDelete(makeEvent([1]) as any);
			const [, opts] = mockFetch.mock.calls[0];
			expect(opts.headers['Content-Type']).toBe('application/json');
		});
	});

	// ── Success response ──────────────────────────────────────────────────────
	describe('Success response', () => {
		it('returns { success: true } when all deletions succeed', async () => {
			mockBackendSuccess(3);
			const result = await actions.batchDelete(makeEvent([1, 2, 3]) as any);
			expect(result).toEqual({ success: true });
		});

		it('sets a success flash when delete_failure_list is null', async () => {
			mockBackendSuccess(2, null);
			await actions.batchDelete(makeEvent([1, 2]) as any);
			expect(setFlash).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'success' }),
				mockCookies
			);
		});

		it('sets a success flash when delete_failure_list is an empty array', async () => {
			mockBackendSuccess(2, []);
			await actions.batchDelete(makeEvent([1, 2]) as any);
			expect(setFlash).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'success' }),
				mockCookies
			);
		});

		it('flash message includes the successful deletion count', async () => {
			mockBackendSuccess(4, null);
			await actions.batchDelete(makeEvent([1, 2, 3, 4]) as any);
			expect(setFlash).toHaveBeenCalledWith(
				expect.objectContaining({ message: expect.stringContaining('4') }),
				mockCookies
			);
		});

		it('sets an error flash when delete_failure_list is non-empty', async () => {
			mockBackendSuccess(2, [3]);
			await actions.batchDelete(makeEvent([1, 2, 3]) as any);
			expect(setFlash).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'error' }),
				mockCookies
			);
		});

		it('flash message includes the failure count when some deletions fail', async () => {
			mockBackendSuccess(1, [2, 3]);
			await actions.batchDelete(makeEvent([1, 2, 3]) as any);
			expect(setFlash).toHaveBeenCalledWith(
				expect.objectContaining({ message: expect.stringContaining('2') }),
				mockCookies
			);
		});
	});

	// ── Error handling — backend returns non-ok ───────────────────────────────
	describe('Error handling — backend non-ok response', () => {
		it('returns fail(500) when backend returns a non-ok response', async () => {
			mockBackendError();
			await actions.batchDelete(makeEvent([1]) as any);
			expect(fail).toHaveBeenCalledWith(500);
		});

		it('sets an error flash when backend returns a non-ok response', async () => {
			mockBackendError('Cannot delete entity');
			await actions.batchDelete(makeEvent([1]) as any);
			expect(setFlash).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'error' }),
				mockCookies
			);
		});

		it('error flash message includes the backend detail', async () => {
			mockBackendError('Entity still in use');
			await actions.batchDelete(makeEvent([1]) as any);
			expect(setFlash).toHaveBeenCalledWith(
				expect.objectContaining({ message: expect.stringContaining('Entity still in use') }),
				mockCookies
			);
		});

		it('error flash message falls back to statusText when detail is missing', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				statusText: 'Bad Gateway',
				json: async () => ({})
			});
			await actions.batchDelete(makeEvent([1]) as any);
			expect(setFlash).toHaveBeenCalledWith(
				expect.objectContaining({ message: expect.stringContaining('Bad Gateway') }),
				mockCookies
			);
		});
	});

	// ── Error handling — network error ────────────────────────────────────────
	describe('Error handling — network error', () => {
		it('returns fail(500) on a network error', async () => {
			mockFetch.mockRejectedValueOnce(new Error('Network failure'));
			await actions.batchDelete(makeEvent([1]) as any);
			expect(fail).toHaveBeenCalledWith(500);
		});

		it('sets an error flash on a network error', async () => {
			mockFetch.mockRejectedValueOnce(new Error('Network failure'));
			await actions.batchDelete(makeEvent([1]) as any);
			expect(setFlash).toHaveBeenCalledWith(
				expect.objectContaining({ type: 'error' }),
				mockCookies
			);
		});

		it('error flash message mentions entity types on network failure', async () => {
			mockFetch.mockRejectedValueOnce(new Error('Network failure'));
			await actions.batchDelete(makeEvent([1]) as any);
			expect(setFlash).toHaveBeenCalledWith(
				expect.objectContaining({ message: expect.stringContaining('entity types') }),
				mockCookies
			);
		});
	});
});
