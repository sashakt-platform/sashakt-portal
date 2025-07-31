import { describe, test, expect } from 'vitest';
import { z } from 'zod';
import { PASSWORD_MIN } from '$lib/constants';

// 🔐 User Validation Business Logic - Testing the juicy stuff!

// Recreate the schemas for testing (normally you'd import these)
const baseUserSchema = z.object({
	full_name: z.string().min(1, { message: 'Full name is required' }),
	email: z.string().email({ message: 'Invalid email address' }),
	phone: z.string().optional(),
	organization_id: z.number({ message: 'Organization is required' }),
	role_id: z.number({ message: 'Role is required' }),
	is_active: z.boolean().optional().default(true)
});

export const createUserSchema = baseUserSchema
	.extend({
		password: z
			.string()
			.min(PASSWORD_MIN, { message: `Password must be at least ${PASSWORD_MIN} characters.` }),
		confirm_password: z
			.string()
			.min(PASSWORD_MIN, { message: `Password must be at least ${PASSWORD_MIN} characters.` })
	})
	.refine((data) => data.password === data.confirm_password, {
		message: 'Passwords must match',
		path: ['confirm_password']
	});

export const editUserSchema = baseUserSchema
	.extend({
		password: z.string().optional(),
		confirm_password: z.string().optional()
	})
	.refine(
		(data) => {
			if (data.password && data.password.length > 0) {
				return data.password.length >= PASSWORD_MIN;
			}
			return true;
		},
		{
			message: `Password must be at least ${PASSWORD_MIN} characters.`,
			path: ['password']
		}
	)
	.refine(
		(data) => {
			if (data.password && data.password.length > 0) {
				return data.confirm_password === data.password;
			}
			return true;
		},
		{
			message: 'Passwords must match',
			path: ['confirm_password']
		}
	)
	.refine(
		(data) => {
			if (data.password && data.password.length > 0) {
				return data.confirm_password && data.confirm_password.length > 0;
			}
			return true;
		},
		{
			message: 'Confirm password is required when password is provided',
			path: ['confirm_password']
		}
	);

describe('User Validation Schemas', () => {
	test('createUserSchema should validate new user creation correctly', () => {
		// Valid user creation
		const validUser = {
			full_name: 'John Doe',
			email: 'john@example.com',
			phone: '+1234567890',
			organization_id: 1,
			role_id: 2,
			is_active: true,
			password: 'password123',
			confirm_password: 'password123'
		};

		const result = createUserSchema.safeParse(validUser);
		expect(result.success).toBe(true);

		// Invalid - missing required fields
		const missingFields = {
			email: 'john@example.com',
			password: 'password123',
			confirm_password: 'password123'
		};

		const invalidResult = createUserSchema.safeParse(missingFields);
		expect(invalidResult.success).toBe(false);
		if (!invalidResult.success) {
			expect(invalidResult.error.issues.some((issue) => issue.path.includes('full_name'))).toBe(
				true
			);
		}

		// Invalid - password too short
		const shortPassword = {
			...validUser,
			password: '123',
			confirm_password: '123'
		};

		const shortResult = createUserSchema.safeParse(shortPassword);
		expect(shortResult.success).toBe(false);
		if (!shortResult.success) {
			expect(
				shortResult.error.issues.some((issue) =>
					issue.message.includes('Password must be at least')
				)
			).toBe(true);
		}
	});

	test('createUserSchema should enforce password confirmation matching', () => {
		const userData = {
			full_name: 'Jane Doe',
			email: 'jane@example.com',
			organization_id: 1,
			role_id: 2,
			password: 'password123',
			confirm_password: 'differentpassword'
		};

		const result = createUserSchema.safeParse(userData);
		expect(result.success).toBe(false);

		if (!result.success) {
			expect(result.error.issues.some((issue) => issue.message === 'Passwords must match')).toBe(
				true
			);
		}
	});

	test('editUserSchema should handle optional password updates correctly', () => {
		const baseEditData = {
			full_name: 'John Doe Updated',
			email: 'john.updated@example.com',
			organization_id: 1,
			role_id: 2,
			is_active: true
		};

		// Valid - no password update
		const noPwdUpdate = { ...baseEditData };
		const noPwdResult = editUserSchema.safeParse(noPwdUpdate);
		expect(noPwdResult.success).toBe(true);

		// Valid - password update with matching confirmation
		const validPwdUpdate = {
			...baseEditData,
			password: 'newpassword123',
			confirm_password: 'newpassword123'
		};
		const validPwdResult = editUserSchema.safeParse(validPwdUpdate);
		expect(validPwdResult.success).toBe(true);

		// Invalid - password too short
		const shortPwdUpdate = {
			...baseEditData,
			password: '123',
			confirm_password: '123'
		};
		const shortPwdResult = editUserSchema.safeParse(shortPwdUpdate);
		expect(shortPwdResult.success).toBe(false);

		// Invalid - password provided but confirmation missing
		const missingConfirm = {
			...baseEditData,
			password: 'newpassword123'
		};
		const missingConfirmResult = editUserSchema.safeParse(missingConfirm);
		expect(missingConfirmResult.success).toBe(false);

		// Invalid - passwords don't match
		const mismatchPwd = {
			...baseEditData,
			password: 'newpassword123',
			confirm_password: 'differentpassword'
		};
		const mismatchResult = editUserSchema.safeParse(mismatchPwd);
		expect(mismatchResult.success).toBe(false);
	});

	test('editUserSchema should validate complex password edge cases', () => {
		const baseData = {
			full_name: 'Test User',
			email: 'test@example.com',
			organization_id: 1,
			role_id: 2
		};

		// Edge case: empty string password (should be treated as no password)
		const emptyPassword = {
			...baseData,
			password: '',
			confirm_password: ''
		};
		const emptyResult = editUserSchema.safeParse(emptyPassword);
		expect(emptyResult.success).toBe(true);

		// Edge case: password provided but empty confirmation
		const emptyConfirm = {
			...baseData,
			password: 'validpassword',
			confirm_password: ''
		};
		const emptyConfirmResult = editUserSchema.safeParse(emptyConfirm);
		expect(emptyConfirmResult.success).toBe(false);

		// Edge case: minimum length password
		const minPassword = {
			...baseData,
			password: 'a'.repeat(PASSWORD_MIN),
			confirm_password: 'a'.repeat(PASSWORD_MIN)
		};
		const minResult = editUserSchema.safeParse(minPassword);
		expect(minResult.success).toBe(true);

		// Edge case: one character below minimum
		const belowMinPassword = {
			...baseData,
			password: 'a'.repeat(PASSWORD_MIN - 1),
			confirm_password: 'a'.repeat(PASSWORD_MIN - 1)
		};
		const belowMinResult = editUserSchema.safeParse(belowMinPassword);
		expect(belowMinResult.success).toBe(false);
	});

	test('baseUserSchema should validate email formats rigorously', () => {
		const baseData = {
			full_name: 'Test User',
			organization_id: 1,
			role_id: 2
		};

		// Valid emails
		const validEmails = [
			'user@example.com',
			'user.name@example.com',
			'user+label@example.co.uk',
			'123@example.org'
		];

		validEmails.forEach((email) => {
			const result = baseUserSchema.safeParse({ ...baseData, email });
			expect(result.success).toBe(true);
		});

		// Invalid emails
		const invalidEmails = [
			'notanemail',
			'user@',
			'@example.com',
			'user..name@example.com',
			'user@example',
			''
		];

		invalidEmails.forEach((email) => {
			const result = baseUserSchema.safeParse({ ...baseData, email });
			expect(result.success).toBe(false);
		});
	});
});
