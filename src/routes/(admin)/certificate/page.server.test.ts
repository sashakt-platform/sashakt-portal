import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';
import { DEFAULT_PAGE_SIZE } from '$lib/constants';

vi.mock('$env/static/private', () => ({
	BACKEND_URL: 'http://fake-backend.com'
}));

vi.mock('$lib/server/auth', () => ({
	requireLogin: vi.fn(() => ({ id: 1, organization_id: 10, permissions: ['read_certificate'] })),
	getSessionTokenCookie: vi.fn(() => 'fake-token')
}));

vi.mock('$lib/utils/permissions.js', () => ({
	requirePermission: vi.fn(),
	PERMISSIONS: {
		READ_CERTIFICATE: 'read_certificate',
		DELETE_CERTIFICATE: 'delete_certificate'
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

	it('returns certificates when API succeeds', async () => {
		const fakeCertificates = { items: [{ id: 'c1', name: 'Completion' }], total: 1, pages: 1 };
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => fakeCertificates
		});

		const url = new URL('http://test.com/?page=2&size=5');
		const result = await load({ cookies: {}, url } as any);

		expect(result.certificates).toEqual(fakeCertificates);
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
		const result = await load({ cookies: {}, url } as any);

		expect(result.params.page).toBe(1);
		expect(result.params.size).toBe(DEFAULT_PAGE_SIZE);
	});

	it('passes search param as name filter to the API', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ items: [], total: 0, pages: 0 })
		});

		const url = new URL('http://test.com/?search=Completion');
		await load({ cookies: {}, url } as any);

		const fetchUrl = (global.fetch as any).mock.calls[0][0];
		expect(fetchUrl).toContain('name=Completion');
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

	it('passes isActive=true filter to the API', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ items: [], total: 0, pages: 0 })
		});

		const url = new URL('http://test.com/?isActive=true');
		await load({ cookies: {}, url } as any);

		const fetchUrl = (global.fetch as any).mock.calls[0][0];
		expect(fetchUrl).toContain('is_active=true');
	});

	it('does not pass isActive filter when value is invalid', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ items: [], total: 0, pages: 0 })
		});

		const url = new URL('http://test.com/?isActive=maybe');
		await load({ cookies: {}, url } as any);

		const fetchUrl = (global.fetch as any).mock.calls[0][0];
		expect(fetchUrl).not.toContain('is_active');
	});

	it('sets error flash and returns empty state when API fails', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			statusText: 'Internal Server Error',
			json: async () => ({ detail: 'Something went wrong' })
		});

		const cookies = {};
		const url = new URL('http://test.com/');
		const result = await load({ cookies, url } as any);

		expect(setFlashMock).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'error', message: expect.stringContaining('Something went wrong') }),
			cookies
		);
		expect(result.certificates).toEqual({ items: [], total: 0, pages: 0 });
		expect(result.totalPages).toBe(0);
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
});

// ---------------------------------------------------------------------------
// actions.batchDelete
// ---------------------------------------------------------------------------
describe('actions.batchDelete', () => {
	beforeEach(() => vi.clearAllMocks());

	it('sets success flash when all certificates are deleted', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				delete_success_count: 3,
				delete_failure_list: null
			})
		});

		const result = await actions.batchDelete({
			request: mockRequest({ certificateIds: '["c1","c2","c3"]' }),
			cookies: {}
		} as any);

		expect(setFlashMock).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'success', message: expect.stringContaining('3 successful') }),
			expect.anything()
		);
		expect(result).toEqual({ success: true });
	});

	it('sets error flash when some certificates fail to delete', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				delete_success_count: 2,
				delete_failure_list: ['c3']
			})
		});

		await actions.batchDelete({
			request: mockRequest({ certificateIds: '["c1","c2","c3"]' }),
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
			request: mockRequest({ certificateIds: '["bad-id"]' }),
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
			request: mockRequest({ certificateIds: '["c1"]' }),
			cookies: {}
		} as any);

		expect(setFlashMock).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'error' }),
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
			request: mockRequest({ certificateIds: '["c1"]' }),
			cookies: {}
		} as any);

		const [fetchUrl, fetchOptions] = (global.fetch as any).mock.calls[0];
		expect(fetchUrl).toBe('http://fake-backend.com/certificate/');
		expect(fetchOptions.method).toBe('DELETE');
		expect(fetchOptions.headers.Authorization).toBe('Bearer fake-token');
	});
});
