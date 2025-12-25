import { describe, it, expect } from 'vitest';
import {
	hasPermission,
	hasAnyPermission,
	hasAllPermissions,
	canCreate,
	canRead,
	canUpdate,
	canDelete,
	requirePermission,
	requireAnyPermission,
	isStateAdmin,
	getUserState,
	PERMISSIONS,
	type User
} from './permissions';

describe('permissions', () => {
	const mockUser: User = {
		id: 1,
		username: 'testuser',
		email: 'test@example.com',
		permissions: [
			PERMISSIONS.CREATE_USER,
			PERMISSIONS.READ_USER,
			PERMISSIONS.CREATE_QUESTION,
			PERMISSIONS.READ_QUESTION
		]
	} as User;

	const userWithNoPermissions: User = {
		id: 2,
		username: 'nopermissions',
		email: 'noperm@example.com',
		permissions: []
	} as User;

	describe('hasPermission()', () => {
		it('should return true when user has the permission', () => {
			expect(hasPermission(mockUser, PERMISSIONS.CREATE_USER)).toBe(true);
			expect(hasPermission(mockUser, PERMISSIONS.READ_QUESTION)).toBe(true);
		});

		it('should return false when user does not have the permission', () => {
			expect(hasPermission(mockUser, PERMISSIONS.DELETE_USER)).toBe(false);
			expect(hasPermission(mockUser, PERMISSIONS.UPDATE_TEST)).toBe(false);
		});

		it('should return false when user is null', () => {
			expect(hasPermission(null, PERMISSIONS.CREATE_USER)).toBe(false);
		});

		it('should return false when user has no permissions', () => {
			expect(hasPermission(userWithNoPermissions, PERMISSIONS.CREATE_USER)).toBe(false);
		});
	});

	describe('hasAnyPermission()', () => {
		it('should return true when user has at least one of the permissions', () => {
			expect(hasAnyPermission(mockUser, [PERMISSIONS.CREATE_USER, PERMISSIONS.DELETE_USER])).toBe(
				true
			);
		});

		it('should return false when user has none of the permissions', () => {
			expect(hasAnyPermission(mockUser, [PERMISSIONS.DELETE_USER, PERMISSIONS.UPDATE_TEST])).toBe(
				false
			);
		});

		it('should return false when user is null', () => {
			expect(hasAnyPermission(null, [PERMISSIONS.CREATE_USER])).toBe(false);
		});

		it('should return false when permissions array is empty', () => {
			expect(hasAnyPermission(mockUser, [])).toBe(false);
		});
	});

	describe('hasAllPermissions()', () => {
		it('should return true when user has all of the permissions', () => {
			expect(hasAllPermissions(mockUser, [PERMISSIONS.CREATE_USER, PERMISSIONS.READ_USER])).toBe(
				true
			);
		});

		it('should return false when user is missing at least one permission', () => {
			expect(hasAllPermissions(mockUser, [PERMISSIONS.CREATE_USER, PERMISSIONS.DELETE_USER])).toBe(
				false
			);
		});

		it('should return false when user is null', () => {
			expect(hasAllPermissions(null, [PERMISSIONS.CREATE_USER])).toBe(false);
		});

		it('should return true when permissions array is empty', () => {
			expect(hasAllPermissions(mockUser, [])).toBe(true);
		});
	});

	describe('CRUD helpers', () => {
		describe('canCreate()', () => {
			it('should return true when user has create permission for entity', () => {
				expect(canCreate(mockUser, 'user')).toBe(true);
				expect(canCreate(mockUser, 'question')).toBe(true);
			});

			it('should return false when user does not have create permission', () => {
				expect(canCreate(mockUser, 'test')).toBe(false);
			});
		});

		describe('canRead()', () => {
			it('should return true when user has read permission for entity', () => {
				expect(canRead(mockUser, 'user')).toBe(true);
				expect(canRead(mockUser, 'question')).toBe(true);
			});

			it('should return false when user does not have read permission', () => {
				expect(canRead(mockUser, 'test')).toBe(false);
			});
		});

		describe('canUpdate()', () => {
			it('should return false when user does not have update permission', () => {
				expect(canUpdate(mockUser, 'user')).toBe(false);
				expect(canUpdate(mockUser, 'question')).toBe(false);
			});
		});

		describe('canDelete()', () => {
			it('should return false when user does not have delete permission', () => {
				expect(canDelete(mockUser, 'user')).toBe(false);
				expect(canDelete(mockUser, 'question')).toBe(false);
			});
		});
	});

	describe('requirePermission()', () => {
		it('should not throw error when user has permission', () => {
			expect(() => requirePermission(mockUser, PERMISSIONS.CREATE_USER)).not.toThrow();
		});

		it('should throw 403 error when user does not have permission', () => {
			try {
				requirePermission(mockUser, PERMISSIONS.DELETE_USER);
				expect.fail('Should have thrown an error');
			} catch (error: any) {
				expect(error.status).toBe(403);
				expect(error.body?.message).toContain('Access denied');
			}
		});

		it('should throw error when user is null', () => {
			try {
				requirePermission(null, PERMISSIONS.CREATE_USER);
				expect.fail('Should have thrown an error');
			} catch (error: any) {
				expect(error.status).toBe(403);
			}
		});
	});

	describe('requireAnyPermission()', () => {
		it('should not throw error when user has at least one permission', () => {
			expect(() =>
				requireAnyPermission(mockUser, [PERMISSIONS.CREATE_USER, PERMISSIONS.DELETE_USER])
			).not.toThrow();
		});

		it('should throw 403 error when user has none of the permissions', () => {
			try {
				requireAnyPermission(mockUser, [PERMISSIONS.DELETE_USER, PERMISSIONS.UPDATE_TEST]);
				expect.fail('Should have thrown an error');
			} catch (error: any) {
				expect(error.status).toBe(403);
				expect(error.body?.message).toContain('Access denied');
			}
		});

		it('should throw error when user is null', () => {
			try {
				requireAnyPermission(null, [PERMISSIONS.CREATE_USER]);
				expect.fail('Should have thrown an error');
			} catch (error: any) {
				expect(error.status).toBe(403);
			}
		});
	});

	describe('isStateAdmin()', () => {
		const stateAdminUser: User = {
			id: 3,
			username: 'stateadmin',
			email: 'stateadmin@example.com',
			permissions: [PERMISSIONS.READ_USER],
			states: [{ id: 1, name: 'Maharashtra' }]
		} as User;

		const userWithNoStates: User = {
			id: 5,
			username: 'nostate',
			email: 'nostate@example.com',
			permissions: [],
			states: []
		} as User;

		it('should return true when user has exactly one state assigned', () => {
			expect(isStateAdmin(stateAdminUser)).toBe(true);
		});

		it('should return false when user has no states assigned', () => {
			expect(isStateAdmin(userWithNoStates)).toBe(false);
		});

		it('should return false when user is null', () => {
			expect(isStateAdmin(null)).toBe(false);
		});

		it('should return false when user.states is undefined', () => {
			const userWithoutStates = { ...mockUser, states: undefined } as User;
			expect(isStateAdmin(userWithoutStates)).toBe(false);
		});
	});

	describe('getUserState()', () => {
		const stateAdminUser: User = {
			id: 3,
			username: 'stateadmin',
			email: 'stateadmin@example.com',
			permissions: [],
			states: [{ id: 1, name: 'Maharashtra' }]
		} as User;

		const userWithNoStates: User = {
			id: 5,
			username: 'nostate',
			email: 'nostate@example.com',
			permissions: [],
			states: []
		} as User;

		it('should return the state when user has a state assigned', () => {
			const state = getUserState(stateAdminUser);
			expect(state).toEqual({ id: 1, name: 'Maharashtra' });
		});

		it('should return null when user has no states assigned', () => {
			expect(getUserState(userWithNoStates)).toBeNull();
		});

		it('should return null when user is null', () => {
			expect(getUserState(null)).toBeNull();
		});

		it('should return null when user.states is undefined', () => {
			const userWithoutStates = { ...mockUser, states: undefined } as User;
			expect(getUserState(userWithoutStates)).toBeNull();
		});
	});
});
