import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './+server';
import { BACKEND_URL } from '$env/static/private';

vi.mock('$lib/server/auth', () => ({
	getSessionTokenCookie: vi.fn(() => 'mock-token')
}));

function makeUrl(tagIds: string[]) {
	const params = tagIds.map((id) => `tag_ids=${id}`).join('&');
	return new URL(`http://localhost/api/questions/count-by-tags?${params}`);
}

describe('GET /api/questions/count-by-tags', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
		vi.clearAllMocks();
	});

	it('returns an empty array without calling fetch when no tag_ids are given', async () => {
		const response = await GET({ url: new URL('http://localhost/api/questions/count-by-tags') } as any);
		const body = await response.json();

		expect(body).toEqual([]);
		expect(fetch).not.toHaveBeenCalled();
	});

	it('forwards every tag_id and the bearer token to the backend', async () => {
		const counts = [
			{ tag_id: 1, question_count: 5 },
			{ tag_id: 2, question_count: 0 }
		];
		(fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => counts
		});

		const response = await GET({ url: makeUrl(['1', '2']) } as any);
		const body = await response.json();

		expect(body).toEqual(counts);
		expect(fetch).toHaveBeenCalledWith(
			`${BACKEND_URL}/questions/count-by-tags?tag_ids=1&tag_ids=2`,
			expect.objectContaining({
				method: 'GET',
				headers: expect.objectContaining({
					Authorization: 'Bearer mock-token'
				})
			})
		);
	});

	it('returns an empty array when the backend responds with a non-ok status', async () => {
		(fetch as any).mockResolvedValueOnce({
			ok: false,
			status: 500,
			statusText: 'Internal Server Error'
		});

		const response = await GET({ url: makeUrl(['1']) } as any);
		const body = await response.json();

		expect(body).toEqual([]);
	});

	it('returns an empty array when fetch throws', async () => {
		(fetch as any).mockRejectedValueOnce(new Error('Network error'));

		const response = await GET({ url: makeUrl(['1']) } as any);
		const body = await response.json();

		expect(body).toEqual([]);
	});
});
