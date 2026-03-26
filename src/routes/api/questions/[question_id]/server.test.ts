import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './+server';
import { BACKEND_URL } from '$env/static/private';

vi.mock('$lib/server/auth', () => ({
	getSessionTokenCookie: vi.fn(() => 'mock-token')
}));

describe('GET /api/questions/[question_id]', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
		vi.clearAllMocks();
	});

	it('fetches question data from backend and returns it', async () => {
		const questionData = {
			id: 42,
			question_text: 'Test question',
			media: {
				image: {
					gcs_path: 'org_1/questions/q_42.png',
					content_type: 'image/png',
					size_bytes: 1024
				}
			},
			options: [
				{ id: 1, key: 'A', value: 'Option A', media: null },
				{ id: 2, key: 'B', value: 'Option B' }
			]
		};

		(fetch as any).mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => questionData
		});

		const response = await GET({
			params: { question_id: '42' }
		} as any);

		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body).toEqual(questionData);
		expect(fetch).toHaveBeenCalledWith(
			`${BACKEND_URL}/questions/42/`,
			expect.objectContaining({
				method: 'GET',
				headers: expect.objectContaining({
					Authorization: 'Bearer mock-token'
				})
			})
		);
	});

	it('passes through backend error status', async () => {
		(fetch as any).mockResolvedValueOnce({
			ok: false,
			status: 404,
			json: async () => ({ detail: 'Not found' })
		});

		const response = await GET({
			params: { question_id: '999' }
		} as any);

		const body = await response.json();

		expect(response.status).toBe(404);
		expect(body.detail).toBe('Not found');
	});

	it('returns 500 when fetch throws', async () => {
		(fetch as any).mockRejectedValueOnce(new Error('Network error'));

		const response = await GET({
			params: { question_id: '42' }
		} as any);

		const body = await response.json();

		expect(response.status).toBe(500);
		expect(body.message).toBe('Failed to fetch question');
	});
});
