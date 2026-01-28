import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DELETE } from './+server';
import { BACKEND_URL } from '$env/static/private';

vi.mock('$lib/server/auth', () => ({
	getSessionTokenCookie: vi.fn(() => 'mock-token')
}));

const mockFetch = vi.fn();

describe('DELETE /api/organization/logo', () => {
	beforeEach(() => {
		mockFetch.mockReset();
	});

	it('returns success message when logo is deleted', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({})
		});

		const response = await DELETE({ fetch: mockFetch } as any);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body).toEqual({ message: 'Logo deleted successfully' });
		expect(mockFetch).toHaveBeenCalledWith(
			`${BACKEND_URL}/organization/current/logo`,
			expect.objectContaining({
				method: 'DELETE',
				headers: expect.objectContaining({
					Authorization: 'Bearer mock-token'
				})
			})
		);
	});

	it('returns error message when backend responds with error', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 404
		});

		const response = await DELETE({ fetch: mockFetch } as any);
		const body = await response.json();

		expect(response.status).toBe(404);
		expect(body).toEqual({ message: 'Failed to delete logo' });
	});

	it('returns 500 error when fetch throws', async () => {
		mockFetch.mockRejectedValueOnce(new Error('Network error'));

		const response = await DELETE({ fetch: mockFetch } as any);
		const body = await response.json();

		expect(response.status).toBe(500);
		expect(body).toEqual({ message: 'Failed to delete logo' });
	});
});
