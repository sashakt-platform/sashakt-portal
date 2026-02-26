import { error } from '@sveltejs/kit';

export type User = NonNullable<App.Locals['user']>;
export type Permission = string;

/**
 * Check if user is a State Admin (has only one state assigned)
 * State admins can only access data from their assigned state,
 * so state selection dropdowns should be hidden for them.
 */
export function isStateAdmin(user: User | null): boolean {
	if (!user || !user.states) {
		return false;
	}
	return user.states.length === 1;
}

/**
 * Check if user has assigned districts.
 * Users with assigned districts can only access data from those districts,
 * so district selection dropdowns should be hidden for them.
 */
export function hasAssignedDistricts(user: User | null): boolean {
	if (!user || !user.districts) {
		return false;
	}

	return Array.isArray(user.districts) && user.districts.length > 0;
}

/**
 * Get the user's assigned state (for State admins)
 * Returns the first state if user has states assigned, null otherwise
 */
export function getUserState(user: User | null): { id: number | string; name: string } | null {
	if (!user || !user.states || user.states.length === 0) {
		return null;
	}
	return user.states[0];
}

/**
 * Get the user's assigned district (for State admins)
 * Returns all the districts if user has districts assigned, null otherwise
 */
export function getUserDistrict(
	user: User | null
): Array<{ id: number | string; name: string }> | null {
	if (!user || !user.districts || user.districts.length === 0) {
		return null;
	}
	return user.districts;
}

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
	UPDATE_MY_ORGANIZATION: 'update_my_organization',

	// Certificate permissions
	CREATE_CERTIFICATE: 'create_certificate',
	UPDATE_CERTIFICATE: 'update_certificate',
	DELETE_CERTIFICATE: 'delete_certificate',
	READ_CERTIFICATE: 'read_certificate',

	// Role permissions
	CREATE_ROLE: 'create_role',
	UPDATE_ROLE: 'update_role',
	DELETE_ROLE: 'delete_role',
	READ_ROLE: 'read_role',

	// Entity permissions
	CREATE_ENTITY: 'create_entity',
	UPDATE_ENTITY: 'update_entity',
	DELETE_ENTITY: 'delete_entity',
	READ_ENTITY: 'read_entity',

	// Test template permissions
	CREATE_TEST_TEMPLATE: 'create_test_template',
	UPDATE_TEST_TEMPLATE: 'update_test_template',
	DELETE_TEST_TEMPLATE: 'delete_test_template',
	READ_TEST_TEMPLATE: 'read_test_template',

	// Form permissions
	CREATE_FORM: 'create_form',
	UPDATE_FORM: 'update_form',
	DELETE_FORM: 'delete_form',
	READ_FORM: 'read_form',
	READ_FORM_RESPONSE: 'read_form_response'
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
	certificate: {
		create: PERMISSIONS.CREATE_CERTIFICATE,
		read: PERMISSIONS.READ_CERTIFICATE,
		update: PERMISSIONS.UPDATE_CERTIFICATE,
		delete: PERMISSIONS.DELETE_CERTIFICATE
	},

	role: {
		create: PERMISSIONS.CREATE_ROLE,
		read: PERMISSIONS.READ_ROLE,
		update: PERMISSIONS.UPDATE_ROLE,
		delete: PERMISSIONS.DELETE_ROLE
	},
	entity: {
		create: PERMISSIONS.CREATE_ENTITY,
		read: PERMISSIONS.READ_ENTITY,
		update: PERMISSIONS.UPDATE_ENTITY,
		delete: PERMISSIONS.DELETE_ENTITY
	},
	'test-template': {
		create: PERMISSIONS.CREATE_TEST_TEMPLATE,
		read: PERMISSIONS.READ_TEST_TEMPLATE,
		update: PERMISSIONS.UPDATE_TEST_TEMPLATE,
		delete: PERMISSIONS.DELETE_TEST_TEMPLATE
	},
	form: {
		create: PERMISSIONS.CREATE_FORM,
		read: PERMISSIONS.READ_FORM,
		update: PERMISSIONS.UPDATE_FORM,
		delete: PERMISSIONS.DELETE_FORM
	}
} as const;

/**
 * Server-side permission check helper
 */
export function requirePermission(user: User | null, permission: Permission): asserts user is User {
	if (!hasPermission(user, permission)) {
		throw error(403, `Access denied: Missing permission '${permission}'`);
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
		throw error(403, `Access denied: Missing any of permissions: ${permissions.join(', ')}`);
	}
}
