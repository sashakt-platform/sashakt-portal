import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as server from './+page.server';
import { redirect, setFlash } from 'sveltekit-flash-message/server';

vi.mock('$env/static/private', () => ({
	BACKEND_URL: 'http://fake-backend'
}));

vi.mock('$lib/server/auth', () => ({
	requireLogin: vi.fn(() => ({ id: 1, organization_id: 10, permissions: ['update_role'] })),
	getSessionTokenCookie: vi.fn(() => 'fake-token')
}));

vi.mock('$lib/utils/permissions.js', () => ({
	requirePermission: vi.fn(),
	PERMISSIONS: {
		UPDATE_ROLE: 'update_role'
	}
}));

vi.mock('sveltekit-flash-message/server', () => ({
	setFlash: vi.fn(),
	redirect: vi.fn()
}));

const mockCookies = {
	get: vi.fn(),
	getAll: vi.fn(),
	set: vi.fn(),
	delete: vi.fn(),
	serialize: vi.fn()
};

global.fetch = vi.fn();

const mockRole = {
	id: 2,
	organization_id: 10,
	name: 'test_admin',
	label: 'Test Admin',
	description: 'Test Admin role',
	is_active: true,
	permissions: [1, 2, 3]
};

const mockCatalog = {
	data: [
		{ id: 1, name: 'create_test', description: null, is_active: true },
		{ id: 2, name: 'read_test', description: null, is_active: true }
	],
	count: 2
};

describe('page.server load function', () => {
	beforeEach(() => vi.resetAllMocks());

	function mockRoleAndCatalogFetch() {
		(global.fetch as any)
			.mockResolvedValueOnce({ ok: true, json: async () => mockRole })
			.mockResolvedValueOnce({ ok: true, json: async () => mockCatalog });
	}

	it('requires the UPDATE_ROLE permission', async () => {
		const permissions = await import('$lib/utils/permissions.js');
		mockRoleAndCatalogFetch();

		await server.load({ params: { id: '2' }, cookies: mockCookies } as any);

		expect(permissions.requirePermission).toHaveBeenCalledWith(
			expect.objectContaining({ organization_id: 10 }),
			'update_role'
		);
	});

	it('fetches the role by id with the correct URL and Bearer token', async () => {
		mockRoleAndCatalogFetch();

		await server.load({ params: { id: '2' }, cookies: mockCookies } as any);

		expect(global.fetch).toHaveBeenNthCalledWith(
			1,
			'http://fake-backend/roles/2',
			expect.objectContaining({
				method: 'GET',
				headers: expect.objectContaining({ Authorization: 'Bearer fake-token' })
			})
		);
	});

	it('fetches the permission catalog with the correct URL and Bearer token', async () => {
		mockRoleAndCatalogFetch();

		await server.load({ params: { id: '2' }, cookies: mockCookies } as any);

		expect(global.fetch).toHaveBeenNthCalledWith(
			2,
			'http://fake-backend/permissions/?limit=500',
			expect.objectContaining({
				method: 'GET',
				headers: expect.objectContaining({ Authorization: 'Bearer fake-token' })
			})
		);
	});

	it('returns the role and permission catalog on success', async () => {
		mockRoleAndCatalogFetch();

		const result = (await server.load({ params: { id: '2' }, cookies: mockCookies } as any)) as any;

		expect(result.role).toEqual(mockRole);
		expect(result.permissionCatalog).toEqual(mockCatalog.data);
	});

	it('throws a load error with the backend detail when the role fetch fails', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			status: 404,
			json: async () => ({ detail: 'Role not found' })
		});

		await expect(
			server.load({ params: { id: '999' }, cookies: mockCookies } as any)
		).rejects.toMatchObject({ status: 404, body: { message: 'Role not found' } });
	});

	it('falls back to a default message when the role fetch fails without detail', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			status: 500,
			json: async () => ({})
		});

		await expect(
			server.load({ params: { id: '2' }, cookies: mockCookies } as any)
		).rejects.toMatchObject({ status: 500, body: { message: 'Failed to load role' } });
	});

	it('degrades gracefully with an empty catalog and an error flash when the permissions fetch fails', async () => {
		(global.fetch as any)
			.mockResolvedValueOnce({ ok: true, json: async () => mockRole })
			.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) });

		const result = (await server.load({ params: { id: '2' }, cookies: mockCookies } as any)) as any;

		expect(result.role).toEqual(mockRole);
		expect(result.permissionCatalog).toEqual([]);
		expect(setFlash).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }), mockCookies);
	});

	it('does not throw the whole page when only the permissions fetch fails', async () => {
		(global.fetch as any)
			.mockResolvedValueOnce({ ok: true, json: async () => mockRole })
			.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) });

		await expect(
			server.load({ params: { id: '2' }, cookies: mockCookies } as any)
		).resolves.toBeDefined();
	});
});

describe('page.server save action', () => {
	beforeEach(() => vi.resetAllMocks());

	function makeFormData(overrides: Record<string, string | string[] | undefined> = {}) {
		const fields: Record<string, string | string[] | undefined> = {
			name: 'test_admin',
			label: 'Test Admin',
			description: 'Test Admin role',
			is_active: 'true',
			permissions: ['1', '2'],
			...overrides
		};
		const formData = new FormData();
		for (const [key, value] of Object.entries(fields)) {
			if (value === undefined) continue;
			if (Array.isArray(value)) {
				value.forEach((v) => formData.append(key, v));
			} else {
				formData.append(key, value);
			}
		}
		return { formData: async () => formData };
	}

	it('requires the UPDATE_ROLE permission', async () => {
		const permissions = await import('$lib/utils/permissions.js');
		(global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		await server.actions.save({
			request: makeFormData(),
			params: { id: '2' },
			cookies: mockCookies
		} as any);

		expect(permissions.requirePermission).toHaveBeenCalledWith(
			expect.objectContaining({ organization_id: 10 }),
			'update_role'
		);
	});

	it('returns fail(400) when required role data is missing', async () => {
		const result = (await server.actions.save({
			request: makeFormData({ name: undefined }),
			params: { id: '2' },
			cookies: mockCookies
		} as any)) as any;

		expect(result.status).toBe(400);
		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('PUTs to the role endpoint with the full role payload', async () => {
		(global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		await server.actions.save({
			request: makeFormData(),
			params: { id: '2' },
			cookies: mockCookies
		} as any);

		expect(global.fetch).toHaveBeenCalledWith(
			'http://fake-backend/roles/2',
			expect.objectContaining({ method: 'PUT' })
		);
		const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
		expect(body).toEqual({
			name: 'test_admin',
			label: 'Test Admin',
			description: 'Test Admin role',
			is_active: true,
			permissions: [1, 2]
		});
	});

	it('sends null description when description is blank', async () => {
		(global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		await server.actions.save({
			request: makeFormData({ description: '' }),
			params: { id: '2' },
			cookies: mockCookies
		} as any);

		const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
		expect(body.description).toBeNull();
	});

	it('sends an empty permissions array when none are selected', async () => {
		(global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		await server.actions.save({
			request: makeFormData({ permissions: [] }),
			params: { id: '2' },
			cookies: mockCookies
		} as any);

		const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
		expect(body.permissions).toEqual([]);
	});

	it('redirects to the same edit page with a success flash', async () => {
		(global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({}) });

		await server.actions.save({
			request: makeFormData(),
			params: { id: '2' },
			cookies: mockCookies
		} as any);

		expect(redirect).toHaveBeenCalledWith(
			303,
			'/organization/roles-permissions/edit/2',
			{ type: 'success', message: 'Role updated successfully' },
			mockCookies
		);
	});

	it('returns fail with the backend detail when the PUT fails', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			status: 500,
			json: async () => ({ detail: 'Update rejected' })
		});

		const result = (await server.actions.save({
			request: makeFormData(),
			params: { id: '2' },
			cookies: mockCookies
		} as any)) as any;

		expect(setFlash).toHaveBeenCalledWith(
			{ type: 'error', message: 'Update rejected' },
			mockCookies
		);
		expect(result.status).toBe(500);
	});

	it('returns fail with a default message when the PUT fails without detail', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			status: 500,
			json: async () => ({})
		});

		const result = (await server.actions.save({
			request: makeFormData(),
			params: { id: '2' },
			cookies: mockCookies
		} as any)) as any;

		expect(setFlash).toHaveBeenCalledWith(
			{ type: 'error', message: 'Failed to update role' },
			mockCookies
		);
		expect(result.status).toBe(500);
	});
});
