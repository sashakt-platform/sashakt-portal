import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './+server';
import { BACKEND_URL } from '$env/static/private';

vi.mock('$lib/server/auth', () => ({
	getSessionTokenCookie: vi.fn(() => 'mock-token')
}));

const mockFetch = vi.fn();
global.fetch = mockFetch as any;

function makeUrl(params: Record<string, string>) {
	const url = new URL('http://localhost/api/test-link');
	Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
	return url;
}

describe('GET /api/test-link', () => {
	beforeEach(() => {
		mockFetch.mockReset();
	});

	it('returns 400 when test_id is missing', async () => {
		const response = await GET({ url: makeUrl({}) } as any);
		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body).toEqual({ error: 'test_id is required' });
	});

	it('returns uuid from backend when response is ok', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ uuid: 'abc123' })
		});

		const response = await GET({ url: makeUrl({ test_id: 'test-42' }) } as any);
		const body = await response.json();

		expect(body).toEqual({ uuid: 'abc123' });
		expect(mockFetch).toHaveBeenCalledWith(
			`${BACKEND_URL}/test/test-42/link`,
			expect.objectContaining({
				method: 'GET',
				headers: expect.objectContaining({
					Authorization: 'Bearer mock-token'
				})
			})
		);
	});

	it('returns error with backend status when backend responds non-ok', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 404,
			statusText: 'Not Found'
		});

		const response = await GET({ url: makeUrl({ test_id: 'missing-id' }) } as any);
		expect(response.status).toBe(404);
		const body = await response.json();
		expect(body).toEqual({ error: 'Failed to fetch test link' });
	});

	it('returns 500 when fetch throws a network error', async () => {
		mockFetch.mockRejectedValueOnce(new Error('Network error'));

		const response = await GET({ url: makeUrl({ test_id: 'test-42' }) } as any);
		expect(response.status).toBe(500);
		const body = await response.json();
		expect(body).toEqual({ error: 'Failed to fetch test link' });
	});
});
