import { describe, it, expect } from 'vitest';
import { createUserSchema, editUserSchema } from './schema';

describe('User Schema Validation', () => {
	describe('createUserSchema (Add User)', () => {
		const validUserData = {
			full_name: 'John Doe',
			email: 'john@example.com',
			phone: '1234567890',
			organization_id: 1,
			role_id: 1,
			state_ids: [1, 2],
			is_active: true,
			password: 'password123',
			confirm_password: 'password123'
		};

		it('should validate correct user data', () => {
			const result = createUserSchema.safeParse(validUserData);
			expect(result.success).toBe(true);
		});

		describe('Required Fields', () => {
			it('should fail when full_name is empty', () => {
				const result = createUserSchema.safeParse({
					...validUserData,
					full_name: ''
				});
				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.error.issues[0].message).toBe('Full name is required');
				}
			});

			it('should fail when email is invalid', () => {
				const result = createUserSchema.safeParse({
					...validUserData,
					email: 'invalid-email'
				});
				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.error.issues[0].message).toBe('Invalid email address');
				}
			});

			it('should fail when organization_id is missing', () => {
				const result = createUserSchema.safeParse({
					...validUserData,
					organization_id: 0
				});
				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.error.issues[0].message).toBe('Organization is required');
				}
			});

			it('should fail when role_id is missing', () => {
				const result = createUserSchema.safeParse({
					...validUserData,
					role_id: 0
				});
				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.error.issues[0].message).toBe('Role is required');
				}
			});
		});

		describe('Optional Fields', () => {
			it('should allow empty phone', () => {
				const result = createUserSchema.safeParse({
					...validUserData,
					phone: ''
				});
				expect(result.success).toBe(true);
			});

			it('should allow missing phone', () => {
				const { phone, ...dataWithoutPhone } = validUserData;
				const result = createUserSchema.safeParse(dataWithoutPhone);
				expect(result.success).toBe(true);
			});

			it('should default state_ids to empty array', () => {
				const { state_ids, ...dataWithoutStates } = validUserData;
				const result = createUserSchema.safeParse(dataWithoutStates);
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data.state_ids).toEqual([]);
				}
			});

			it('should default is_active to true', () => {
				const { is_active, ...dataWithoutActive } = validUserData;
				const result = createUserSchema.safeParse(dataWithoutActive);
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data.is_active).toBe(true);
				}
			});
		});

		describe('Type Coercion', () => {
			it('should coerce organization_id to number', () => {
				const result = createUserSchema.safeParse({
					...validUserData,
					organization_id: '5'
				});
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data.organization_id).toBe(5);
					expect(typeof result.data.organization_id).toBe('number');
				}
			});

			it('should coerce role_id to number', () => {
				const result = createUserSchema.safeParse({
					...validUserData,
					role_id: '3'
				});
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data.role_id).toBe(3);
					expect(typeof result.data.role_id).toBe('number');
				}
			});

			it('should coerce state_ids array elements to numbers', () => {
				const result = createUserSchema.safeParse({
					...validUserData,
					state_ids: ['1', '2', '3']
				});
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data.state_ids).toEqual([1, 2, 3]);
				}
			});
		});

		describe('Password Validation', () => {
			it('should fail when password is too short', () => {
				const result = createUserSchema.safeParse({
					...validUserData,
					password: 'short',
					confirm_password: 'short'
				});
				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.error.issues[0].message).toContain('at least 8 characters');
				}
			});

			it('should fail when confirm_password is too short', () => {
				const result = createUserSchema.safeParse({
					...validUserData,
					password: 'password123',
					confirm_password: 'short'
				});
				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.error.issues[0].message).toContain('at least 8 characters');
				}
			});

			it('should fail when passwords do not match', () => {
				const result = createUserSchema.safeParse({
					...validUserData,
					password: 'password123',
					confirm_password: 'different123'
				});
				expect(result.success).toBe(false);
				if (!result.success) {
					const matchError = result.error.issues.find((i) => i.message === 'Passwords must match');
					expect(matchError).toBeDefined();
					expect(matchError?.path).toEqual(['confirm_password']);
				}
			});

			it('should fail when password is missing', () => {
				const { password, ...dataWithoutPassword } = validUserData;
				const result = createUserSchema.safeParse(dataWithoutPassword);
				expect(result.success).toBe(false);
			});

			it('should fail when confirm_password is missing', () => {
				const { confirm_password, ...dataWithoutConfirm } = validUserData;
				const result = createUserSchema.safeParse(dataWithoutConfirm);
				expect(result.success).toBe(false);
			});

			it('should accept minimum length password', () => {
				const result = createUserSchema.safeParse({
					...validUserData,
					password: '12345678',
					confirm_password: '12345678'
				});
				expect(result.success).toBe(true);
			});
		});
	});

	describe('editUserSchema (Edit User)', () => {
		const validEditData = {
			full_name: 'John Doe',
			email: 'john@example.com',
			phone: '1234567890',
			organization_id: 1,
			role_id: 1,
			state_ids: [1, 2],
			is_active: true
		};

		it('should validate correct user data without passwords', () => {
			const result = editUserSchema.safeParse(validEditData);
			expect(result.success).toBe(true);
		});

		describe('Optional Password Update', () => {
			it('should allow updating user without providing password', () => {
				const result = editUserSchema.safeParse(validEditData);
				expect(result.success).toBe(true);
			});

			it('should allow empty password and confirm_password', () => {
				const result = editUserSchema.safeParse({
					...validEditData,
					password: '',
					confirm_password: ''
				});
				expect(result.success).toBe(true);
			});

			it('should accept valid password update', () => {
				const result = editUserSchema.safeParse({
					...validEditData,
					password: 'newpassword123',
					confirm_password: 'newpassword123'
				});
				expect(result.success).toBe(true);
			});
		});

		describe('Password Validation When Provided', () => {
			it('should fail when password is too short', () => {
				const result = editUserSchema.safeParse({
					...validEditData,
					password: 'short',
					confirm_password: 'short'
				});
				expect(result.success).toBe(false);
				if (!result.success) {
					const lengthError = result.error.issues.find((i) =>
						i.message.includes('at least 8 characters')
					);
					expect(lengthError).toBeDefined();
					expect(lengthError?.path).toEqual(['password']);
				}
			});

			it('should fail when passwords do not match', () => {
				const result = editUserSchema.safeParse({
					...validEditData,
					password: 'password123',
					confirm_password: 'different123'
				});
				expect(result.success).toBe(false);
				if (!result.success) {
					const matchError = result.error.issues.find((i) => i.message === 'Passwords must match');
					expect(matchError).toBeDefined();
					expect(matchError?.path).toEqual(['confirm_password']);
				}
			});

			it('should fail when password is provided but confirm_password is empty', () => {
				const result = editUserSchema.safeParse({
					...validEditData,
					password: 'password123',
					confirm_password: ''
				});
				expect(result.success).toBe(false);
				if (!result.success) {
					const requiredError = result.error.issues.find((i) =>
						i.message.includes('Confirm password is required')
					);
					expect(requiredError).toBeDefined();
					expect(requiredError?.path).toEqual(['confirm_password']);
				}
			});

			it('should fail when password is provided but confirm_password is missing', () => {
				const result = editUserSchema.safeParse({
					...validEditData,
					password: 'password123'
				});
				expect(result.success).toBe(false);
				if (!result.success) {
					const requiredError = result.error.issues.find((i) =>
						i.message.includes('Confirm password is required')
					);
					expect(requiredError).toBeDefined();
				}
			});

			it('should accept minimum length password when updating', () => {
				const result = editUserSchema.safeParse({
					...validEditData,
					password: '12345678',
					confirm_password: '12345678'
				});
				expect(result.success).toBe(true);
			});
		});

		describe('Base Field Validation (Same as Create)', () => {
			it('should fail when full_name is empty', () => {
				const result = editUserSchema.safeParse({
					...validEditData,
					full_name: ''
				});
				expect(result.success).toBe(false);
			});

			it('should fail when email is invalid', () => {
				const result = editUserSchema.safeParse({
					...validEditData,
					email: 'invalid-email'
				});
				expect(result.success).toBe(false);
			});

			it('should coerce organization_id to number', () => {
				const result = editUserSchema.safeParse({
					...validEditData,
					organization_id: '5'
				});
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data.organization_id).toBe(5);
				}
			});
		});

		describe('Edge Cases', () => {
			it('should handle undefined password fields', () => {
				const result = editUserSchema.safeParse({
					...validEditData,
					password: undefined,
					confirm_password: undefined
				});
				expect(result.success).toBe(true);
			});

			it('should allow special characters in email', () => {
				const result = editUserSchema.safeParse({
					...validEditData,
					email: 'test+admin@example.co.uk'
				});
				expect(result.success).toBe(true);
			});

			it('should accept multiple states', () => {
				const result = editUserSchema.safeParse({
					...validEditData,
					state_ids: [1, 2, 3, 4, 5]
				});
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.data.state_ids).toHaveLength(5);
				}
			});
		});
	});
});
