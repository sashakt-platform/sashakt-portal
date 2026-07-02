import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load } from './+page.server';

vi.mock('$env/static/private', () => ({
	BACKEND_URL: 'http://fake-backend.com'
}));

const requireLoginMock = vi.fn(() => ({
	id: 1,
	organization_id: 10,
	permissions: ['read_provider']
}));

vi.mock('$lib/server/auth', () => ({
	requireLogin: (...args: unknown[]) => requireLoginMock(...args),
	getSessionTokenCookie: vi.fn(() => 'fake-token')
}));

const requirePermissionMock = vi.fn();
vi.mock('$lib/utils/permissions.js', () => ({
	requirePermission: (...args: unknown[]) => requirePermissionMock(...args),
	PERMISSIONS: {
		READ_PROVIDER: 'read_provider'
	}
}));

const setFlashMock = vi.fn();
vi.mock('sveltekit-flash-message/server', () => ({
	setFlash: (...args: unknown[]) => setFlashMock(...args)
}));

global.fetch = vi.fn();

describe('load', () => {
	beforeEach(() => vi.clearAllMocks());

	it('returns providers when the API call succeeds', async () => {
		const fakeProviders = [
			{ id: 1, provider_id: 101, is_enabled: true, provider: { name: 'Google Sheets' } }
		];
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => fakeProviders
		});

		const result = await load({ cookies: {} } as any);

		expect(result.providers).toEqual(fakeProviders);
	});

	it('requires the READ_PROVIDER permission', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => []
		});

		await load({ cookies: {} } as any);

		expect(requirePermissionMock).toHaveBeenCalledWith(
			expect.objectContaining({ organization_id: 10 }),
			'read_provider'
		);
	});

	it('fetches from the organization-scoped providers endpoint', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => []
		});

		await load({ cookies: {} } as any);

		const fetchUrl = (global.fetch as any).mock.calls[0][0];
		expect(fetchUrl).toBe('http://fake-backend.com/providers/organizations/10/providers');
	});

	it('sends the Bearer token in the Authorization header', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => []
		});

		await load({ cookies: {} } as any);

		const fetchOptions = (global.fetch as any).mock.calls[0][1];
		expect(fetchOptions.headers.Authorization).toBe('Bearer fake-token');
	});

	it('sets an error flash and returns an empty providers list when the API call fails', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			statusText: 'Internal Server Error',
			json: async () => ({ detail: 'Something went wrong' })
		});

		const cookies = {};
		const result = await load({ cookies } as any);

		expect(setFlashMock).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'error',
				message: expect.stringContaining('Something went wrong')
			}),
			cookies
		);
		expect(result.providers).toEqual([]);
	});

	it('falls back to statusText when the API error has no detail', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			statusText: 'Service Unavailable',
			json: async () => ({})
		});

		const cookies = {};
		await load({ cookies } as any);

		expect(setFlashMock).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'error',
				message: expect.stringContaining('Service Unavailable')
			}),
			cookies
		);
	});
});
