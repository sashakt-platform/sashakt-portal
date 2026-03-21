import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, DELETE } from './+server';
import { BACKEND_URL } from '$env/static/private';

vi.mock('$lib/server/auth', () => ({
	getSessionTokenCookie: vi.fn(() => 'mock-token')
}));

const mockFormData = new FormData();

describe('POST /api/media/questions/[question_id]/image', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
		vi.clearAllMocks();
	});

	it('forwards multipart form data to backend and returns response', async () => {
		const backendResponse = {
			gcs_path: 'org_1/questions/q_1_abc.png',
			content_type: 'image/png',
			size_bytes: 24576
		};

		(fetch as any).mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => backendResponse
		});

		const response = await POST({
			params: { question_id: '42' },
			request: { formData: async () => mockFormData }
		} as any);

		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body).toEqual(backendResponse);
		expect(fetch).toHaveBeenCalledWith(
			`${BACKEND_URL}/media/questions/42/image`,
			expect.objectContaining({
				method: 'POST',
				headers: expect.objectContaining({
					Authorization: 'Bearer mock-token'
				}),
				body: mockFormData
			})
		);
	});

	it('returns backend error status on failure', async () => {
		(fetch as any).mockResolvedValueOnce({
			ok: false,
			status: 400,
			json: async () => ({ detail: 'Invalid image' })
		});

		const response = await POST({
			params: { question_id: '42' },
			request: { formData: async () => mockFormData }
		} as any);

		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body.detail).toBe('Invalid image');
	});

	it('returns 500 when fetch throws', async () => {
		(fetch as any).mockRejectedValueOnce(new Error('Network error'));

		const response = await POST({
			params: { question_id: '42' },
			request: { formData: async () => mockFormData }
		} as any);

		const body = await response.json();

		expect(response.status).toBe(500);
		expect(body.message).toBe('Failed to upload image');
	});
});

describe('DELETE /api/media/questions/[question_id]/image', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
		vi.clearAllMocks();
	});

	it('sends delete request and returns success', async () => {
		(fetch as any).mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({ message: 'Image deleted successfully' })
		});

		const response = await DELETE({
			params: { question_id: '42' }
		} as any);

		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body.message).toBe('Image deleted successfully');
		expect(fetch).toHaveBeenCalledWith(
			`${BACKEND_URL}/media/questions/42/image`,
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
		expect(body.message).toBe('Failed to delete image');
	});
});
