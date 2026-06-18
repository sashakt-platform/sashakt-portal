import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';
import { DEFAULT_PAGE_SIZE } from '$lib/constants';

type LoadResult = Exclude<Awaited<ReturnType<typeof load>>, void>;

vi.mock('$env/static/private', () => ({
	BACKEND_URL: 'http://fake-backend.com'
}));

vi.mock('$lib/server/auth', () => ({
	requireLogin: vi.fn(() => ({ id: 1, permissions: ['read_form', 'delete_form'] })),
	getSessionTokenCookie: vi.fn(() => 'fake-token')
}));

vi.mock('$lib/utils/permissions.js', () => ({
	requirePermission: vi.fn(),
	PERMISSIONS: {
		READ_FORM: 'read_form',
		DELETE_FORM: 'delete_form'
	}
}));

const setFlashMock = vi.fn();
vi.mock('sveltekit-flash-message/server', () => ({
	setFlash: (...args: any[]) => setFlashMock(...args)
}));

global.fetch = vi.fn();

function mockRequest(data: Record<string, string>) {
	const fd = new FormData();
	for (const [key, value] of Object.entries(data)) fd.append(key, value);
	return { formData: async () => fd } as unknown as Request;
}

describe('load', () => {
	beforeEach(() => vi.clearAllMocks());

	it('returns forms when API succeeds', async () => {
		const fakeForms = { items: [{ id: 'f1', name: 'Registration', fields_count: 3 }], total: 1, pages: 1 };
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => fakeForms
		});

		const url = new URL('http://test.com/?page=2&size=5');
		const result = (await load({ cookies: {}, url } as any)) as LoadResult;

		expect(result.forms).toEqual(fakeForms);
		expect(result.totalPages).toBe(1);
		expect(result.params.page).toBe(2);
		expect(result.params.size).toBe(5);
	});

	it('uses default pagination when no query params are given', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ items: [], total: 0, pages: 0 })
		});

		const url = new URL('http://test.com/');
		const result = (await load({ cookies: {}, url } as any)) as LoadResult;

		expect(result.params.page).toBe(1);
		expect(result.params.size).toBe(DEFAULT_PAGE_SIZE);
		expect(result.params.sortOrder).toBe('asc');
	});

	it('passes search param as name filter to the API', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ items: [], total: 0, pages: 0 })
		});

		const url = new URL('http://test.com/?search=Registration');
		await load({ cookies: {}, url } as any);

		const fetchUrl = (global.fetch as any).mock.calls[0][0];
		expect(fetchUrl).toContain('name=Registration');
	});

	it('passes sort params to the API', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ items: [], total: 0, pages: 0 })
		});

		const url = new URL('http://test.com/?sortBy=name&sortOrder=desc');
		await load({ cookies: {}, url } as any);

		const fetchUrl = (global.fetch as any).mock.calls[0][0];
		expect(fetchUrl).toContain('sort_by=name');
		expect(fetchUrl).toContain('sort_order=desc');
	});

	it('passes isActive filter to the API', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ items: [], total: 0, pages: 0 })
		});

		const url = new URL('http://test.com/?isActive=true');
		await load({ cookies: {}, url } as any);

		const fetchUrl = (global.fetch as any).mock.calls[0][0];
		expect(fetchUrl).toContain('is_active=true');
	});

	it('omits isActive when not provided', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ items: [], total: 0, pages: 0 })
		});

		const url = new URL('http://test.com/');
		await load({ cookies: {}, url } as any);

		const fetchUrl = (global.fetch as any).mock.calls[0][0];
		expect(fetchUrl).not.toContain('is_active');
	});

	it('sends the Bearer token in the Authorization header', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ items: [], total: 0, pages: 0 })
		});

		const url = new URL('http://test.com/');
		await load({ cookies: {}, url } as any);

		const fetchOptions = (global.fetch as any).mock.calls[0][1];
		expect(fetchOptions.headers.Authorization).toBe('Bearer fake-token');
	});

	it('sets error flash and returns empty state when API fails with JSON detail', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			statusText: 'Internal Server Error',
			json: async () => ({ detail: 'Something went wrong' })
		});

		const cookies = {};
		const url = new URL('http://test.com/');
		const result = (await load({ cookies, url } as any)) as LoadResult;

		expect(setFlashMock).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'error', message: expect.stringContaining('Something went wrong') }),
			cookies
		);
		expect(result.forms).toEqual({ items: [], total: 0, pages: 0 });
		expect(result.totalPages).toBe(0);
	});

	it('falls back to statusText when error response is not JSON', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			statusText: 'Bad Gateway',
			json: async () => { throw new Error('Not JSON'); }
		});

		const cookies = {};
		const url = new URL('http://test.com/');
		await load({ cookies, url } as any);

		expect(setFlashMock).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'error', message: expect.stringContaining('Bad Gateway') }),
			cookies
		);
	});

	it('computes fields_count from fields array when fields_count is absent', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				items: [{ id: 'f1', name: 'Survey', fields: [{ id: 'q1' }, { id: 'q2' }] }],
				total: 1,
				pages: 1
			})
		});

		const url = new URL('http://test.com/');
		const result = (await load({ cookies: {}, url } as any)) as LoadResult;

		expect(result.forms.items[0].fields_count).toBe(2);
	});

	it('preserves existing fields_count when already set', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				items: [{ id: 'f1', name: 'Survey', fields_count: 5, fields: [{ id: 'q1' }] }],
				total: 1,
				pages: 1
			})
		});

		const url = new URL('http://test.com/');
		const result = (await load({ cookies: {}, url } as any)) as LoadResult;

		expect(result.forms.items[0].fields_count).toBe(5);
	});

	it('sets fields_count to 0 when fields is not an array', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				items: [{ id: 'f1', name: 'Empty', fields: null }],
				total: 1,
				pages: 1
			})
		});

		const url = new URL('http://test.com/');
		const result = (await load({ cookies: {}, url } as any)) as LoadResult;

		expect(result.forms.items[0].fields_count).toBe(0);
	});
});

describe('actions.batchDelete', () => {
	beforeEach(() => vi.clearAllMocks());

	it('sets success flash when all forms are deleted', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ delete_success_count: 3, delete_failure_list: null })
		});

		const result = await actions.batchDelete({
			request: mockRequest({ formIds: '["f1","f2","f3"]' }),
			cookies: {}
		} as any);

		expect(setFlashMock).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'success', message: expect.stringContaining('3 successful') }),
			expect.anything()
		);
		expect(result).toEqual({ success: true });
	});

	it('sets error flash when some forms fail to delete', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ delete_success_count: 2, delete_failure_list: ['f3'] })
		});

		await actions.batchDelete({
			request: mockRequest({ formIds: '["f1","f2","f3"]' }),
			cookies: {}
		} as any);

		expect(setFlashMock).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'error', message: expect.stringContaining('1 failed') }),
			expect.anything()
		);
	});

	it('sets error flash and returns fail(500) when API responds with an error', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			statusText: 'Bad Request',
			json: async () => ({ detail: 'Invalid IDs' })
		});

		const result = await actions.batchDelete({
			request: mockRequest({ formIds: '["bad-id"]' }),
			cookies: {}
		} as any);

		expect(setFlashMock).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'error', message: expect.stringContaining('Invalid IDs') }),
			expect.anything()
		);
		expect(result?.status).toBe(500);
	});

	it('sets error flash and returns fail(500) on network error', async () => {
		(global.fetch as any).mockRejectedValueOnce(new Error('Network failure'));

		const result = await actions.batchDelete({
			request: mockRequest({ formIds: '["f1"]' }),
			cookies: {}
		} as any);

		expect(setFlashMock).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'error', message: 'Failed to delete forms' }),
			expect.anything()
		);
		expect(result?.status).toBe(500);
	});

	it('sends DELETE request with the correct URL and Authorization header', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ delete_success_count: 1, delete_failure_list: null })
		});

		await actions.batchDelete({
			request: mockRequest({ formIds: '["f1"]' }),
			cookies: {}
		} as any);

		const [fetchUrl, fetchOptions] = (global.fetch as any).mock.calls[0];
		expect(fetchUrl).toBe('http://fake-backend.com/form/');
		expect(fetchOptions.method).toBe('DELETE');
		expect(fetchOptions.headers.Authorization).toBe('Bearer fake-token');
	});

	it('sends the formIds body to the API', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ delete_success_count: 2, delete_failure_list: null })
		});

		const ids = '["f1","f2"]';
		await actions.batchDelete({
			request: mockRequest({ formIds: ids }),
			cookies: {}
		} as any);

		const fetchOptions = (global.fetch as any).mock.calls[0][1];
		expect(fetchOptions.body).toBe(ids);
	});
});
