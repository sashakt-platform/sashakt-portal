import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './+server';
import { BACKEND_URL } from '$env/static/private';

vi.mock('$lib/server/auth', () => ({
	getSessionTokenCookie: vi.fn(() => 'mock-token')
}));

const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('GET /api/candidate/summary', () => {
	beforeEach(() => {
		mockFetch.mockReset();
	});

	it('returns candidate summary data when backend response is ok', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				total_test_submitted: 8,
				total_test_not_submitted: 2,
				not_submitted_active: 1,
				not_submitted_inactive: 1
			})
		});

		const response = await GET();
		const body = await response.json();

		expect(body).toEqual({
			total_test_submitted: 8,
			total_test_not_submitted: 2,
			not_submitted_active: 1,
			not_submitted_inactive: 1
		});

		expect(mockFetch).toHaveBeenCalledWith(
			`${BACKEND_URL}/candidate/summary`,
			expect.objectContaining({
				method: 'GET',
				headers: expect.objectContaining({
					Authorization: 'Bearer mock-token'
				})
			})
		);
	});

	it('returns zeros if backend response is not ok', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			json: async () => ({})
		});

		const response = await GET();
		const body = await response.json();

		expect(body).toEqual({
			total_test_submitted: 0,
			total_test_not_submitted: 0,
			not_submitted_active: 0,
			not_submitted_inactive: 0
		});
	});

	it('returns zeros if fetch throws error', async () => {
		mockFetch.mockRejectedValueOnce(new Error('Network error'));

		const response = await GET();
		const body = await response.json();

		expect(body).toEqual({
			total_test_submitted: 0,
			total_test_not_submitted: 0,
			not_submitted_active: 0,
			not_submitted_inactive: 0
		});
	});
});
