import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DELETE } from './+server';
import { BACKEND_URL } from '$env/static/private';

vi.mock('$lib/server/auth', () => ({
	getSessionTokenCookie: vi.fn(() => 'mock-token')
}));

type DeleteEvent = Parameters<typeof DELETE>[0];

const mockFetch = vi.fn();

function makeDeleteEvent(overrides: Partial<DeleteEvent> = {}): DeleteEvent {
	return {
		fetch: mockFetch,
		locals: { user: { organization_id: 42 } },
		request: new Request('http://localhost', { method: 'DELETE' }),
		...overrides
	} as unknown as DeleteEvent;
}

describe('DELETE /api/organization/platform_guide', () => {
	beforeEach(() => {
		mockFetch.mockReset();
	});

	it('returns 400 when the user has no organization_id', async () => {
		const response = await DELETE(makeDeleteEvent({ locals: { user: null } } as any));
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body).toEqual({ message: 'Organization not found' });
		expect(mockFetch).not.toHaveBeenCalled();
	});

	it('returns success message when platform guide is removed', async () => {
		mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		const response = await DELETE(makeDeleteEvent());
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body).toEqual({ message: 'Platform guide removed' });
		expect(mockFetch).toHaveBeenCalledWith(
			`${BACKEND_URL}/organization/42/platform_guide`,
			expect.objectContaining({
				method: 'DELETE',
				headers: expect.objectContaining({ Authorization: 'Bearer mock-token' })
			})
		);
	});

	it('propagates backend error status', async () => {
		mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

		const response = await DELETE(makeDeleteEvent());
		const body = await response.json();

		expect(response.status).toBe(404);
		expect(body).toEqual({ message: 'Failed to remove platform guide' });
	});

	it('returns 500 when fetch throws', async () => {
		mockFetch.mockRejectedValueOnce(new Error('Network error'));

		const response = await DELETE(makeDeleteEvent());
		const body = await response.json();

		expect(response.status).toBe(500);
		expect(body).toEqual({ message: 'Failed to remove platform guide' });
	});
});
