import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, DELETE } from './+server';
import { BACKEND_URL } from '$env/static/private';

vi.mock('$lib/server/auth', () => ({
	getSessionTokenCookie: vi.fn(() => 'mock-token')
}));

describe('POST /api/media/questions/[question_id]/external', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
		vi.clearAllMocks();
	});

	it('forwards URL to backend and returns response', async () => {
		const backendResponse = {
			type: 'video',
			provider: 'youtube',
			url: 'https://www.youtube.com/watch?v=abc',
			embed_url: 'https://www.youtube.com/embed/abc'
		};

		(fetch as any).mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => backendResponse
		});

		const url = new URL(
			'http://localhost/api/media/questions/42/external?url=https://www.youtube.com/watch?v=abc'
		);

		const response = await POST({
			params: { question_id: '42' },
			url
		} as any);

		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body).toEqual(backendResponse);
		expect(fetch).toHaveBeenCalledWith(
			expect.stringContaining(`${BACKEND_URL}/media/questions/42/external?url=`),
			expect.objectContaining({
				method: 'POST',
				headers: expect.objectContaining({
					Authorization: 'Bearer mock-token'
				})
			})
		);
	});

	it('returns 400 when URL parameter is missing', async () => {
		const url = new URL('http://localhost/api/media/questions/42/external');

		const response = await POST({
			params: { question_id: '42' },
			url
		} as any);

		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body.message).toBe('URL parameter is required');
	});

	it('returns 500 when fetch throws', async () => {
		(fetch as any).mockRejectedValueOnce(new Error('Network error'));

		const url = new URL('http://localhost/api/media/questions/42/external?url=https://example.com');

		const response = await POST({
			params: { question_id: '42' },
			url
		} as any);

		const body = await response.json();

		expect(response.status).toBe(500);
		expect(body.message).toBe('Failed to add external media');
	});
});

describe('DELETE /api/media/questions/[question_id]/external', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
		vi.clearAllMocks();
	});

	it('sends delete request and returns success', async () => {
		(fetch as any).mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ message: 'External media removed successfully' })
		});

		const response = await DELETE({
			params: { question_id: '42' }
		} as any);

		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.message).toBe('External media removed successfully');
		expect(fetch).toHaveBeenCalledWith(
			`${BACKEND_URL}/media/questions/42/external`,
			expect.objectContaining({
				method: 'DELETE',
				headers: expect.objectContaining({
					Authorization: 'Bearer mock-token'
				})
			})
		);
	});

	it('returns 500 when fetch throws', async () => {
		(fetch as any).mockRejectedValueOnce(new Error('Network error'));

		const response = await DELETE({
			params: { question_id: '42' }
		} as any);

		const body = await response.json();

		expect(response.status).toBe(500);
		expect(body.message).toBe('Failed to delete external media');
	});
});
