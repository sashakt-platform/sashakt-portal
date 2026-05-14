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
	isSuperAdmin,
	isSystemAdmin,
	isOwnEntity,
	getUserState,
	hasLocation,
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

	describe('isSuperAdmin()', () => {
		it('should return true when user has CREATE_ORGANIZATION', () => {
			const user = { ...mockUser, permissions: [PERMISSIONS.CREATE_ORGANIZATION] } as User;
			expect(isSuperAdmin(user)).toBe(true);
		});

		it('should return true when user has UPDATE_ORGANIZATION', () => {
			const user = { ...mockUser, permissions: [PERMISSIONS.UPDATE_ORGANIZATION] } as User;
			expect(isSuperAdmin(user)).toBe(true);
		});

		it('should return true when user has DELETE_ORGANIZATION', () => {
			const user = { ...mockUser, permissions: [PERMISSIONS.DELETE_ORGANIZATION] } as User;
			expect(isSuperAdmin(user)).toBe(true);
		});

		it('should return true when user has all three org permissions', () => {
			const user = {
				...mockUser,
				permissions: [
					PERMISSIONS.CREATE_ORGANIZATION,
					PERMISSIONS.UPDATE_ORGANIZATION,
					PERMISSIONS.DELETE_ORGANIZATION
				]
			} as User;
			expect(isSuperAdmin(user)).toBe(true);
		});

		it('should return false when user has none of the org permissions', () => {
			expect(isSuperAdmin(mockUser)).toBe(false);
		});

		it('should return false when user is null', () => {
			expect(isSuperAdmin(null)).toBe(false);
		});
	});

	describe('isSystemAdmin()', () => {
		it('should return true when user has UPDATE_MY_ORGANIZATION', () => {
			const user = { ...mockUser, permissions: [PERMISSIONS.UPDATE_MY_ORGANIZATION] } as User;
			expect(isSystemAdmin(user)).toBe(true);
		});

		it('should return false when user does not have UPDATE_MY_ORGANIZATION', () => {
			expect(isSystemAdmin(mockUser)).toBe(false);
		});

		it('should return false when user is null', () => {
			expect(isSystemAdmin(null)).toBe(false);
		});
	});

	describe('isOwnEntity()', () => {
		const owner = { ...mockUser, id: '42' } as User;
		const otherUser = { ...mockUser, id: '99' } as User;
		const superAdminUser = {
			...mockUser,
			id: '99',
			permissions: [PERMISSIONS.CREATE_ORGANIZATION]
		} as User;
		const systemAdminUser = {
			...mockUser,
			id: '99',
			permissions: [PERMISSIONS.UPDATE_MY_ORGANIZATION]
		} as User;

		it('should return true when user.id matches entityCreatedById (both strings)', () => {
			expect(isOwnEntity(owner, '42')).toBe(true);
		});

		it('should return true when user.id matches entityCreatedById (string vs number)', () => {
			expect(isOwnEntity(owner, 42)).toBe(true);
		});

		it('should return false when user.id does not match entityCreatedById', () => {
			expect(isOwnEntity(otherUser, '42')).toBe(false);
		});

		it('should return false when entityCreatedById is null', () => {
			expect(isOwnEntity(owner, null)).toBe(false);
		});

		it('should return false when entityCreatedById is undefined', () => {
			expect(isOwnEntity(owner, undefined)).toBe(false);
		});

		it('should return false when user is null', () => {
			expect(isOwnEntity(null, '42')).toBe(false);
		});

		it('should return true for a super admin even when entity belongs to a different user', () => {
			expect(isOwnEntity(superAdminUser, '42')).toBe(true);
		});

		it('should return true for a system admin even when entity belongs to a different user', () => {
			expect(isOwnEntity(systemAdminUser, '42')).toBe(true);
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

	describe('hasLocation()', () => {
		const userWithState: User = {
			id: 10,
			username: 'stateuser',
			email: 'state@example.com',
			permissions: [],
			states: [{ id: 1, name: 'Maharashtra' }],
			districts: []
		} as User;

		const userWithDistrict: User = {
			id: 11,
			username: 'districtuser',
			email: 'district@example.com',
			permissions: [],
			states: [],
			districts: [{ id: 1, name: 'Pune' }]
		} as User;

		const userWithBoth: User = {
			id: 12,
			username: 'bothuser',
			email: 'both@example.com',
			permissions: [],
			states: [{ id: 1, name: 'Maharashtra' }],
			districts: [{ id: 1, name: 'Pune' }]
		} as User;

		const userWithNoLocation: User = {
			id: 13,
			username: 'nolocation',
			email: 'noloc@example.com',
			permissions: [],
			states: [],
			districts: []
		} as User;

		it('should return false when user is null', () => {
			expect(hasLocation(null)).toBe(false);
		});

		it('should return false when user has no states and no districts', () => {
			expect(hasLocation(userWithNoLocation)).toBe(false);
		});

		it('should return true when user has one state assigned', () => {
			expect(hasLocation(userWithState)).toBe(true);
		});

		it('should return true when user has multiple states assigned', () => {
			const userWithMultipleStates = {
				...userWithState,
				states: [
					{ id: 1, name: 'Maharashtra' },
					{ id: 2, name: 'Gujarat' }
				]
			} as User;
			expect(hasLocation(userWithMultipleStates)).toBe(true);
		});

		it('should return true when user has a district assigned', () => {
			expect(hasLocation(userWithDistrict)).toBe(true);
		});

		it('should return true when user has both states and districts assigned', () => {
			expect(hasLocation(userWithBoth)).toBe(true);
		});

		it('should return false when states and districts are undefined', () => {
			const userWithoutLocationFields = { ...mockUser, states: undefined, districts: undefined } as User;
			expect(hasLocation(userWithoutLocationFields)).toBe(false);
		});
	});
});
