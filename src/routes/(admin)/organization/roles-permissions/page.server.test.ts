import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, actions } from './+page.server';

vi.mock('$env/static/private', () => ({
	BACKEND_URL: 'http://fake-backend.com'
}));

const requireLoginMock = vi.fn(() => ({
	id: 1,
	organization_id: 10,
	permissions: ['read_role', 'update_role', 'delete_role']
}));

vi.mock('$lib/server/auth.js', () => ({
	requireLogin: (...args: unknown[]) => requireLoginMock(...args),
	getSessionTokenCookie: vi.fn(() => 'fake-token')
}));

const requirePermissionMock = vi.fn();
vi.mock('$lib/utils/permissions.js', () => ({
	requirePermission: (...args: unknown[]) => requirePermissionMock(...args),
	PERMISSIONS: {
		READ_ROLE: 'read_role',
		UPDATE_ROLE: 'update_role',
		DELETE_ROLE: 'delete_role'
	}
}));

const setFlashMock = vi.fn();
const redirectMock = vi.fn();
vi.mock('sveltekit-flash-message/server', () => ({
	setFlash: (...args: unknown[]) => setFlashMock(...args),
	redirect: (...args: unknown[]) => {
		redirectMock(...args);
		throw { status: args[0], location: args[1] };
	}
}));

global.fetch = vi.fn();

function mockRequest(data: Record<string, string>) {
	const fd = new FormData();
	for (const [key, value] of Object.entries(data)) {
		fd.append(key, value);
	}
	return { formData: async () => fd } as unknown as Request;
}

describe('load', () => {
	beforeEach(() => vi.clearAllMocks());

	it('requires the READ_ROLE permission', async () => {
		(global.fetch as any)
			.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) })
			.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

		await load();

		expect(requirePermissionMock).toHaveBeenCalledWith(
			expect.objectContaining({ organization_id: 10 }),
			'read_role'
		);
	});

	it('returns roles and title-cased permission labels on success', async () => {
		(global.fetch as any)
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ data: [{ id: 1, name: 'system_admin', label: 'System Admin' }] })
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ data: [{ id: 1, name: 'read_user' }] })
			});

		const result = await load();

		expect(result.roles).toEqual([{ id: 1, name: 'system_admin', label: 'System Admin' }]);
		expect(result.permissions).toEqual([{ id: 1, name: 'read_user', label: 'View User' }]);
	});

	it('returns empty lists when the roles and permissions requests fail', async () => {
		(global.fetch as any)
			.mockResolvedValueOnce({ ok: false })
			.mockResolvedValueOnce({ ok: false });

		const result = await load();

		expect(result.roles).toEqual([]);
		expect(result.permissions).toEqual([]);
	});

	it('sends the Bearer token to both the roles and permissions endpoints', async () => {
		(global.fetch as any)
			.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) })
			.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

		await load();

		const [rolesCall, permissionsCall] = (global.fetch as any).mock.calls;
		expect(rolesCall[0]).toBe('http://fake-backend.com/roles/?limit=200');
		expect(rolesCall[1].headers.Authorization).toBe('Bearer fake-token');
		expect(permissionsCall[0]).toBe('http://fake-backend.com/permissions/?limit=200');
		expect(permissionsCall[1].headers.Authorization).toBe('Bearer fake-token');
	});
});

describe('actions.updateRolePermissions', () => {
	beforeEach(() => vi.clearAllMocks());

	it('requires the UPDATE_ROLE permission', async () => {
		(global.fetch as any).mockResolvedValueOnce({ ok: true });

		await actions.updateRolePermissions({
			request: mockRequest({ role_id: '5', payload: JSON.stringify({ permissions: [1] }) }),
			cookies: {}
		} as any);

		expect(requirePermissionMock).toHaveBeenCalledWith(
			expect.objectContaining({ organization_id: 10 }),
			'update_role'
		);
	});

	it('sends a PUT with the parsed payload to the role endpoint and returns success', async () => {
		(global.fetch as any).mockResolvedValueOnce({ ok: true });

		const result = await actions.updateRolePermissions({
			request: mockRequest({ role_id: '5', payload: JSON.stringify({ permissions: [1, 2] }) }),
			cookies: {}
		} as any);

		const fetchCall = (global.fetch as any).mock.calls[0];
		expect(fetchCall[0]).toBe('http://fake-backend.com/roles/5');
		expect(fetchCall[1].method).toBe('PUT');
		expect(JSON.parse(fetchCall[1].body)).toEqual({ permissions: [1, 2] });
		expect(result).toEqual({ success: true });
	});

	it('sets an error flash and returns fail(500) when the API call fails', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			json: async () => ({ detail: 'Cannot update permissions' })
		});

		const result = await actions.updateRolePermissions({
			request: mockRequest({ role_id: '5', payload: JSON.stringify({ permissions: [] }) }),
			cookies: {}
		} as any);

		expect(setFlashMock).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'error', message: 'Cannot update permissions' }),
			expect.anything()
		);
		expect(result?.status).toBe(500);
	});
});

describe('actions.deleteRole', () => {
	beforeEach(() => vi.clearAllMocks());

	it('requires the DELETE_ROLE permission', async () => {
		(global.fetch as any).mockResolvedValueOnce({ ok: true });

		await expect(
			actions.deleteRole({
				url: new URL('http://test.com/?role_id=5'),
				cookies: {}
			} as any)
		).rejects.toBeTruthy();

		expect(requirePermissionMock).toHaveBeenCalledWith(
			expect.objectContaining({ organization_id: 10 }),
			'delete_role'
		);
	});

	it('deletes the role and redirects with a success flash', async () => {
		(global.fetch as any).mockResolvedValueOnce({ ok: true });

		await expect(
			actions.deleteRole({
				url: new URL('http://test.com/?role_id=5'),
				cookies: {}
			} as any)
		).rejects.toBeTruthy();

		const fetchCall = (global.fetch as any).mock.calls[0];
		expect(fetchCall[0]).toBe('http://fake-backend.com/roles/5');
		expect(fetchCall[1].method).toBe('DELETE');
		expect(redirectMock).toHaveBeenCalledWith(
			303,
			'/organization/roles-permissions',
			expect.objectContaining({ type: 'success' }),
			expect.anything()
		);
	});

	it('returns fail(400) with an error flash when the role cannot be deleted', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			status: 400,
			json: async () => ({ detail: 'This role is restricted and cannot be deleted' })
		});

		const result = await actions.deleteRole({
			url: new URL('http://test.com/?role_id=5'),
			cookies: {}
		} as any);

		expect(setFlashMock).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'error',
				message: 'This role is restricted and cannot be deleted'
			}),
			expect.anything()
		);
		expect(result?.status).toBe(400);
	});

	it('returns fail(500) when the API call fails for a non-400 reason', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			status: 404,
			json: async () => ({ detail: 'Role not found' })
		});

		const result = await actions.deleteRole({
			url: new URL('http://test.com/?role_id=999'),
			cookies: {}
		} as any);

		expect(result?.status).toBe(500);
	});
});
