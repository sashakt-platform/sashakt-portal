import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load } from './+page.server';

const requireLoginMock = vi.fn(() => ({
	id: 1,
	organization_id: 10,
	permissions: ['read_role']
}));

vi.mock('$lib/server/auth', () => ({
	requireLogin: (...args: unknown[]) => requireLoginMock(...args)
}));

const requirePermissionMock = vi.fn();
vi.mock('$lib/utils/permissions.js', () => ({
	requirePermission: (...args: unknown[]) => requirePermissionMock(...args),
	PERMISSIONS: {
		READ_ROLE: 'read_role'
	}
}));

describe('load', () => {
	beforeEach(() => vi.clearAllMocks());

	it('requires the user to be logged in', async () => {
		await load({} as never);

		expect(requireLoginMock).toHaveBeenCalled();
	});

	it('requires the READ_ROLE permission for the logged-in user', async () => {
		await load({} as never);

		expect(requirePermissionMock).toHaveBeenCalledWith(
			expect.objectContaining({ organization_id: 10 }),
			'read_role'
		);
	});

	it('checks permission after resolving the logged-in user', async () => {
		const callOrder: string[] = [];
		requireLoginMock.mockImplementationOnce(() => {
			callOrder.push('requireLogin');
			return { id: 1, organization_id: 10, permissions: ['read_role'] };
		});
		requirePermissionMock.mockImplementationOnce(() => {
			callOrder.push('requirePermission');
		});

		await load({} as never);

		expect(callOrder).toEqual(['requireLogin', 'requirePermission']);
	});

	it('resolves with an empty object when authorized', async () => {
		const result = await load({} as never);

		expect(result).toEqual({});
	});
});
