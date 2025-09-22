export type User = NonNullable<App.Locals['user']>;
export type Permission = string;

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: User | null, permission: Permission): boolean {
	if (!user || !user.permissions) {
		return false;
	}
	return user.permissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(user: User | null, permissions: Permission[]): boolean {
	if (!user || !user.permissions) {
		return false;
	}
	return permissions.some((permission) => user.permissions.includes(permission));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(user: User | null, permissions: Permission[]): boolean {
	if (!user || !user.permissions) {
		return false;
	}
	return permissions.every((permission) => user.permissions.includes(permission));
}

/**
 * Permission constants for common actions
 */
export const PERMISSIONS = {
	// User permissions
	CREATE_USER: 'create_user',
	UPDATE_USER: 'update_user',
	DELETE_USER: 'delete_user',
	READ_USER: 'read_user',
	UPDATE_USER_ME: 'update_user_me',

	// Question permissions
	CREATE_QUESTION: 'create_question',
	UPDATE_QUESTION: 'update_question',
	DELETE_QUESTION: 'delete_question',
	READ_QUESTION: 'read_question',

	// Test permissions
	CREATE_TEST: 'create_test',
	UPDATE_TEST: 'update_test',
	DELETE_TEST: 'delete_test',
	READ_TEST: 'read_test',

	// Tag permissions
	CREATE_TAG: 'create_tag',
	UPDATE_TAG: 'update_tag',
	DELETE_TAG: 'delete_tag',
	READ_TAG: 'read_tag',

	// Organization permissions
	CREATE_ORGANIZATION: 'create_organization',
	UPDATE_ORGANIZATION: 'update_organization',
	DELETE_ORGANIZATION: 'delete_organization',
	READ_ORGANIZATION: 'read_organization',

	// Role permissions
	CREATE_ROLE: 'create_role',
	UPDATE_ROLE: 'update_role',
	DELETE_ROLE: 'delete_role',
	READ_ROLE: 'read_role',

	// Test template permissions
	CREATE_TEST_TEMPLATE: 'create_test_template',
	UPDATE_TEST_TEMPLATE: 'update_test_template',
	DELETE_TEST_TEMPLATE: 'delete_test_template',
	READ_TEST_TEMPLATE: 'read_test_template'
} as const;

/**
 * Check if user can perform CRUD operations on an entity
 */
export function canCreate(user: User | null, entity: keyof typeof ENTITY_PERMISSIONS): boolean {
	const permissions = ENTITY_PERMISSIONS[entity];
	return hasPermission(user, permissions.create);
}

export function canRead(user: User | null, entity: keyof typeof ENTITY_PERMISSIONS): boolean {
	const permissions = ENTITY_PERMISSIONS[entity];
	return hasPermission(user, permissions.read);
}

export function canUpdate(user: User | null, entity: keyof typeof ENTITY_PERMISSIONS): boolean {
	const permissions = ENTITY_PERMISSIONS[entity];
	return hasPermission(user, permissions.update);
}

export function canDelete(user: User | null, entity: keyof typeof ENTITY_PERMISSIONS): boolean {
	const permissions = ENTITY_PERMISSIONS[entity];
	return hasPermission(user, permissions.delete);
}

/**
 * Entity-specific permission mappings
 */
export const ENTITY_PERMISSIONS = {
	user: {
		create: PERMISSIONS.CREATE_USER,
		read: PERMISSIONS.READ_USER,
		update: PERMISSIONS.UPDATE_USER,
		delete: PERMISSIONS.DELETE_USER
	},
	question: {
		create: PERMISSIONS.CREATE_QUESTION,
		read: PERMISSIONS.READ_QUESTION,
		update: PERMISSIONS.UPDATE_QUESTION,
		delete: PERMISSIONS.DELETE_QUESTION
	},
	test: {
		create: PERMISSIONS.CREATE_TEST,
		read: PERMISSIONS.READ_TEST,
		update: PERMISSIONS.UPDATE_TEST,
		delete: PERMISSIONS.DELETE_TEST
	},
	tag: {
		create: PERMISSIONS.CREATE_TAG,
		read: PERMISSIONS.READ_TAG,
		update: PERMISSIONS.UPDATE_TAG,
		delete: PERMISSIONS.DELETE_TAG
	},
	organization: {
		create: PERMISSIONS.CREATE_ORGANIZATION,
		read: PERMISSIONS.READ_ORGANIZATION,
		update: PERMISSIONS.UPDATE_ORGANIZATION,
		delete: PERMISSIONS.DELETE_ORGANIZATION
	},
	role: {
		create: PERMISSIONS.CREATE_ROLE,
		read: PERMISSIONS.READ_ROLE,
		update: PERMISSIONS.UPDATE_ROLE,
		delete: PERMISSIONS.DELETE_ROLE
	},
	'test-template': {
		create: PERMISSIONS.CREATE_TEST_TEMPLATE,
		read: PERMISSIONS.READ_TEST_TEMPLATE,
		update: PERMISSIONS.UPDATE_TEST_TEMPLATE,
		delete: PERMISSIONS.DELETE_TEST_TEMPLATE
	}
} as const;

/**
 * Server-side permission check helper
 */
export function requirePermission(user: User | null, permission: Permission): asserts user is User {
	if (!hasPermission(user, permission)) {
		throw new Error(`Access denied: Missing permission '${permission}'`);
	}
}

/**
 * Server-side permission check for any permission
 */
export function requireAnyPermission(
	user: User | null,
	permissions: Permission[]
): asserts user is User {
	if (!hasAnyPermission(user, permissions)) {
		throw new Error(`Access denied: Missing any of permissions: ${permissions.join(', ')}`);
	}
}
