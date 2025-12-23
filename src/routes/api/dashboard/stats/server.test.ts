import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './+server';
import { BACKEND_URL } from '$env/static/private';

vi.mock('$lib/server/auth', () => ({
	getSessionTokenCookie: vi.fn(() => 'mock-token')
}));

const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('GET /api/dashboard/stats', () => {
	beforeEach(() => {
		mockFetch.mockReset();
	});

	it('returns stats from backend when response is ok', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				total_questions: 10,
				total_users: 5,
				total_tests: 3
			})
		});

		const response = await GET();
		const body = await response.json();

		expect(body).toEqual({
			total_questions: 10,
			total_users: 5,
			total_tests: 3
		});
		expect(mockFetch).toHaveBeenCalledWith(
			`${BACKEND_URL}/organization/aggregated_data`,
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
			total_questions: 0,
			total_users: 0,
			total_tests: 0
		});
	});

	it('returns zeros if fetch throws', async () => {
		mockFetch.mockRejectedValueOnce(new Error('Network error'));

		const response = await GET();
		const body = await response.json();

		expect(body).toEqual({
			total_questions: 0,
			total_users: 0,
			total_tests: 0
		});
	});
});
