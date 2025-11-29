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
});
