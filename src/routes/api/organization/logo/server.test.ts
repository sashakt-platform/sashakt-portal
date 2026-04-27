import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Cookies } from '@sveltejs/kit';
import { DELETE } from './+server';
import { BACKEND_URL } from '$env/static/private';
import { invalidateOrganizationCache } from '$lib/server/organization-cache';

vi.mock('$lib/server/auth', () => ({
	getSessionTokenCookie: vi.fn(() => 'mock-token'),
	organizationCookieName: 'sashakt-organization'
}));

vi.mock('$lib/server/organization-cache', () => ({
	invalidateOrganizationCache: vi.fn()
}));

type DeleteEvent = Parameters<typeof DELETE>[0];

const mockFetch = vi.fn();
const mockCookies: Pick<Cookies, 'get'> = {
	get: vi.fn(() => 'test-org')
};

function makeDeleteEvent(overrides: Partial<DeleteEvent> = {}): DeleteEvent {
	return {
		fetch: mockFetch,
		cookies: mockCookies as unknown as Cookies,
		request: new Request('http://localhost', { method: 'DELETE' }),
		...overrides
	} as unknown as DeleteEvent;
}

describe('DELETE /api/organization/logo', () => {
	beforeEach(() => {
		mockFetch.mockReset();
		vi.mocked(mockCookies.get).mockReset().mockReturnValue('test-org');
		vi.mocked(invalidateOrganizationCache).mockReset();
	});

	it('returns success message when logo is deleted', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({})
		});

		const response = await DELETE(makeDeleteEvent());
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
		expect(invalidateOrganizationCache).toHaveBeenCalledWith('test-org');
	});

	it('does not invalidate cache when backend responds with error', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 404
		});

		const response = await DELETE(makeDeleteEvent());
		const body = await response.json();

		expect(response.status).toBe(404);
		expect(body).toEqual({ message: 'Failed to delete logo' });
		expect(invalidateOrganizationCache).not.toHaveBeenCalled();
	});

	it('returns 500 error when fetch throws', async () => {
		mockFetch.mockRejectedValueOnce(new Error('Network error'));

		const response = await DELETE(makeDeleteEvent());
		const body = await response.json();

		expect(response.status).toBe(500);
		expect(body).toEqual({ message: 'Failed to delete logo' });
		expect(invalidateOrganizationCache).not.toHaveBeenCalled();
	});
});
