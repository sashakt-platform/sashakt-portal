import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as server from './+page.server';
import { redirect, setFlash } from 'sveltekit-flash-message/server';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { addProviderSchema } from './schema.js';

vi.mock('$env/static/private', () => ({
	BACKEND_URL: 'http://fake-backend'
}));

vi.mock('$lib/server/auth', () => ({
	requireLogin: vi.fn(() => ({ id: 1, organization_id: 10, name: 'Test User' })),
	getSessionTokenCookie: vi.fn(() => 'fake-token')
}));

vi.mock('$lib/utils/permissions.js', () => ({
	requirePermission: vi.fn(),
	PERMISSIONS: {
		CREATE_PROVIDER: 'CREATE_PROVIDER',
		DELETE_PROVIDER: 'DELETE_PROVIDER'
	}
}));

vi.mock('sveltekit-superforms', () => ({
	superValidate: vi.fn(async () => ({
		valid: true,
		data: { provider_id: 1, config_json: '', is_enabled: true }
	}))
}));

vi.mock('sveltekit-superforms/adapters', () => ({
	zod4: vi.fn((schema) => schema)
}));

vi.mock('sveltekit-flash-message/server', () => ({
	setFlash: vi.fn(),
	redirect: vi.fn(() => {
		throw new Error('redirect');
	})
}));

const mockCookies = {
	get: vi.fn(),
	getAll: vi.fn(),
	set: vi.fn(),
	delete: vi.fn(),
	serialize: vi.fn()
};

global.fetch = vi.fn();

describe('page.server load function', () => {
	beforeEach(() => vi.resetAllMocks());

	it('fetches the provider catalog and returns providers, form, and action', async () => {
		const mockCatalog = { items: [{ id: 1, name: 'Google Sheets' }] };
		(global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => mockCatalog });

		const result = (await server.load({ params: { action: 'add', id: 'new' } } as any)) as any;

		expect(result.action).toBe('add');
		expect(result.providers).toEqual(mockCatalog.items);
		expect(result.form).toBeDefined();
	});

	it('requires the CREATE_PROVIDER permission', async () => {
		const permissions = await import('$lib/utils/permissions.js');
		(global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) });

		await server.load({ params: { action: 'add', id: 'new' } } as any);

		expect(permissions.requirePermission).toHaveBeenCalledWith(
			expect.objectContaining({ organization_id: 10 }),
			'CREATE_PROVIDER'
		);
	});

	it('uses the AddProviderSchema for validation', async () => {
		(global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) });

		await server.load({ params: { action: 'add', id: 'new' } } as any);

		expect(zod4).toHaveBeenCalledWith(addProviderSchema);
	});

	it('fetches the catalog with the correct URL and Bearer token', async () => {
		(global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) });

		await server.load({ params: { action: 'add', id: 'new' } } as any);

		expect(global.fetch).toHaveBeenCalledWith(
			'http://fake-backend/providers/?page=1&size=100',
			expect.objectContaining({
				method: 'GET',
				headers: expect.objectContaining({ Authorization: 'Bearer fake-token' })
			})
		);
	});

	it('throws a load error with the backend detail when the catalog fetch fails', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			status: 502,
			json: async () => ({ detail: 'Catalog unavailable' })
		});

		await expect(
			server.load({ params: { action: 'add', id: 'new' } } as any)
		).rejects.toMatchObject({ status: 502, body: { message: 'Catalog unavailable' } });
	});

	it('falls back to a default message when the catalog fetch fails without detail', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			status: 500,
			json: async () => ({})
		});

		await expect(
			server.load({ params: { action: 'add', id: 'new' } } as any)
		).rejects.toMatchObject({ status: 500, body: { message: 'Failed to load providers' } });
	});
});

describe('page.server save action', () => {
	beforeEach(() => vi.resetAllMocks());

	it('returns fail(400) and sets an error flash when the form is invalid', async () => {
		(superValidate as any).mockResolvedValueOnce({ valid: false, data: {} });

		const result = (await server.actions.save({
			request: {},
			cookies: mockCookies
		} as any)) as any;

		expect(setFlash).toHaveBeenCalledWith(
			{ type: 'error', message: 'Provider not added. Please check all the details.' },
			mockCookies
		);
		expect(result.status).toBe(400);
	});

	it('requires the CREATE_PROVIDER permission', async () => {
		const permissions = await import('$lib/utils/permissions.js');
		(global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		try {
			await server.actions.save({ request: {}, cookies: mockCookies } as any);
		} catch {
			// redirect() throws in production
		}

		expect(permissions.requirePermission).toHaveBeenCalledWith(
			expect.objectContaining({ organization_id: 10 }),
			'CREATE_PROVIDER'
		);
	});

	it('sends an empty object when config_json is blank', async () => {
		(superValidate as any).mockResolvedValueOnce({
			valid: true,
			data: { provider_id: 1, config_json: '   ', is_enabled: true }
		});
		(global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		try {
			await server.actions.save({ request: {}, cookies: mockCookies } as any);
		} catch {
			// redirect() throws in production
		}

		const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
		expect(body.config_json).toEqual({});
	});

	it('parses config_json into an object when present', async () => {
		(superValidate as any).mockResolvedValueOnce({
			valid: true,
			data: { provider_id: 1, config_json: '{"api_key":"abc"}', is_enabled: true }
		});
		(global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		try {
			await server.actions.save({ request: {}, cookies: mockCookies } as any);
		} catch {
			// redirect() throws in production
		}

		const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
		expect(body.config_json).toEqual({ api_key: 'abc' });
	});

	it('POSTs to the organization-scoped providers endpoint and redirects on success', async () => {
		(global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		try {
			await server.actions.save({ request: {}, cookies: mockCookies } as any);
		} catch {
			// redirect() throws in production
		}

		expect(global.fetch).toHaveBeenCalledWith(
			'http://fake-backend/providers/organizations/10/providers',
			expect.objectContaining({ method: 'POST' })
		);
		expect(redirect).toHaveBeenCalledWith(
			'/organization/integrations',
			{ type: 'success', message: 'Provider added successfully' },
			mockCookies
		);
	});

	it('returns fail(500) with the backend detail when the POST fails', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			json: async () => ({ detail: 'Provider already added' })
		});

		const result = (await server.actions.save({
			request: {},
			cookies: mockCookies
		} as any)) as any;

		expect(setFlash).toHaveBeenCalledWith(
			{ type: 'error', message: 'Provider already added' },
			mockCookies
		);
		expect(result.status).toBe(500);
	});

	it('returns fail(500) with a default message when the POST fails without detail', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			json: async () => ({})
		});

		const result = (await server.actions.save({
			request: {},
			cookies: mockCookies
		} as any)) as any;

		expect(setFlash).toHaveBeenCalledWith(
			{ type: 'error', message: 'Failed to add provider' },
			mockCookies
		);
		expect(result.status).toBe(500);
	});
});

describe('page.server delete action', () => {
	beforeEach(() => vi.resetAllMocks());

	it('requires the DELETE_PROVIDER permission', async () => {
		const permissions = await import('$lib/utils/permissions.js');
		(global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		try {
			await server.actions.delete({ params: { id: '5' }, cookies: mockCookies } as any);
		} catch {
			// redirect() throws in production
		}

		expect(permissions.requirePermission).toHaveBeenCalledWith(
			expect.objectContaining({ organization_id: 10 }),
			'DELETE_PROVIDER'
		);
	});

	it('DELETEs the organization-scoped provider by provider id and redirects on success', async () => {
		(global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		try {
			await server.actions.delete({ params: { id: '5' }, cookies: mockCookies } as any);
		} catch {
			// redirect() throws in production
		}

		expect(global.fetch).toHaveBeenCalledWith(
			'http://fake-backend/providers/organizations/10/providers/5',
			expect.objectContaining({ method: 'DELETE' })
		);
		expect(redirect).toHaveBeenCalledWith(
			'/organization/integrations',
			{ type: 'success', message: 'Provider deleted successfully' },
			mockCookies
		);
	});

	it('redirects with the backend detail when delete fails', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			json: async () => ({ detail: 'Provider not found' })
		});

		try {
			await server.actions.delete({ params: { id: '999' }, cookies: mockCookies } as any);
		} catch {
			// redirect() throws in production
		}

		expect(redirect).toHaveBeenCalledWith(
			'/organization/integrations',
			{ type: 'error', message: 'Provider not found' },
			mockCookies
		);
		expect(redirect).toHaveBeenCalledTimes(1);
	});

	it('redirects with a default message when delete fails without detail', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			json: async () => ({})
		});

		try {
			await server.actions.delete({ params: { id: '5' }, cookies: mockCookies } as any);
		} catch {
			// redirect() throws in production
		}

		expect(redirect).toHaveBeenCalledWith(
			'/organization/integrations',
			{ type: 'error', message: 'Failed to delete provider' },
			mockCookies
		);
		expect(redirect).toHaveBeenCalledTimes(1);
	});
});
